// Mock Chrome API globally for all tests
global.chrome = {
  tabs: {
    query: jest.fn().mockResolvedValue([{ id: 1 }]),
    sendMessage: jest.fn().mockResolvedValue({ content: "Test content" }),
    connect: jest.fn().mockReturnValue({ name: "overlay-connection" }),
  },
  runtime: {
    onMessage: { addListener: jest.fn() },
    sendMessage: jest.fn(),
    connect: jest.fn().mockReturnValue({ name: "popup" }),
    onConnect: { addListener: jest.fn() },
  },
  storage: {
    local: {
      get: jest.fn().mockImplementation((keys, callback) => {
        callback({ apiKey: "test-api-key", customPrompt: "test prompt" });
      }),
      set: jest.fn().mockResolvedValue(true),
    },
  },
  scripting: {
    executeScript: jest.fn().mockResolvedValue([]),
  },
};

// Add any other global setup here
