// Add required polyfills
const { ReadableStream } = require("stream/web");
const { TextEncoder, TextDecoder } = require("util");

global.ReadableStream = ReadableStream;
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock chrome API globally before requiring background.js
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
    },
    sendMessage: jest.fn(),
  },
};

// Mock fetch globally
global.fetch = jest.fn();

// Now import the function we want to test
const { summarizeContent } = require("./background.js");

describe("Background Script Tests", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  test("summarizeContent makes correct API call and handles streaming response", async () => {
    // Mock streaming response
    const mockStream = new ReadableStream({
      start(controller) {
        const responses = [
          'data: {"choices":[{"delta":{"content":"Hello"}}]}\n',
          'data: {"choices":[{"delta":{"content":" world"}}]}\n',
          "data: [DONE]\n",
        ];

        responses.forEach((response) => {
          controller.enqueue(new TextEncoder().encode(response));
        });
        controller.close();
      },
    });

    // Mock fetch response
    fetch.mockResolvedValueOnce({
      ok: true,
      body: mockStream,
      headers: new Headers({
        "content-type": "text/event-stream",
      }),
    });

    // Test data
    const tab = { id: 1 };
    const content = "Test content";
    const prompt = "Test prompt";
    const apiKey = "test-api-key";

    // Call the function
    await summarizeContent(tab, content, prompt, apiKey);

    // Verify API call
    expect(fetch).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-api-key",
        },
        body: expect.stringContaining('"stream":true'),
      })
    );

    // Verify messages sent
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: "streamToken",
      token: "Hello",
    });

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: "streamToken",
      token: " world",
    });

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: "streamComplete",
    });
  });

  test("summarizeContent handles API errors", async () => {
    // Mock API error
    fetch.mockRejectedValueOnce(new Error("API Error"));

    // Test data
    const tab = { id: 1 };
    const content = "Test content";
    const prompt = "Test prompt";
    const apiKey = "test-api-key";

    // Call the function
    await summarizeContent(tab, content, prompt, apiKey);

    // Verify error handling
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: "error",
      error: "API Error",
    });
  });

  test("summarizeContent handles invalid JSON response", async () => {
    // Mock invalid JSON response
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("data: invalid-json\n"));
        controller.close();
      },
    });

    fetch.mockResolvedValueOnce({
      ok: true,
      body: mockStream,
      headers: new Headers({
        "content-type": "text/event-stream",
      }),
    });

    // Test data
    const tab = { id: 1 };
    const content = "Test content";
    const prompt = "Test prompt";
    const apiKey = "test-api-key";

    // Call the function
    await summarizeContent(tab, content, prompt, apiKey);

    // Verify no tokens were sent (due to invalid JSON)
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: "streamToken",
      })
    );
  });
});
