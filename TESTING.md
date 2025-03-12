# Testing the Page Summarizer Extension

This document provides instructions for running the unit tests for the Page Summarizer Chrome extension.

## Setup

1. Install dependencies:

   ```
   npm install
   ```

2. Run tests:

   ```
   npm test
   ```

3. Run a specific test file:

   ```
   npm test -- popup.test.js
   ```

4. Run a specific test:

   ```
   npm test -- -t "Toggle prompt section shows/hides the settings"
   ```

5. Generate code coverage report:
   ```
   npm run test:coverage
   ```

## Test Structure

The tests are organized into three main files:

1. **popup.test.js** - Tests for the popup UI functionality
2. **overlay.test.js** - Tests for the overlay functionality
3. **background.test.js** - Tests for the background script functionality and OpenAI API integration

## Test Coverage

The tests cover the following functionality:

### Popup Tests

- Toggle settings panel visibility
- API key saving and validation
- Error message display
- Controls visibility toggling

### Overlay Tests

- Creating the overlay
- Removing the overlay
- Preventing duplicate overlays

### Background Tests

- Message handling for summarization requests
- Port connection handling

### OpenAI API Integration Tests

- Correct API call parameters and headers
- Streaming response handling
- Error handling (network errors, HTTP errors)
- Edge cases:
  - Empty prompts
  - Malformed JSON responses
  - Empty content in responses

### Coverage Results

Current test coverage:

```
---------------|---------|----------|---------|---------|-------------------
File           | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
---------------|---------|----------|---------|---------|-------------------
All files      |   96.29 |    88.88 |      75 |   96.15 | 11
 background.js |   96.29 |    88.88 |      75 |   96.15 | 11
---------------|---------|----------|---------|---------|-------------------
```

## Test Implementation Details

### DOM Testing

The tests use jsdom to simulate a browser environment. This allows us to:

1. Create DOM elements
2. Attach event listeners
3. Dispatch events
4. Check element properties and state

Example:

```javascript
// Create DOM elements
document.body.innerHTML = `<button id="my-button">Click Me</button>`;

// Attach event listeners
document.getElementById("my-button").addEventListener("click", () => {
  document.body.innerHTML += `<div id="result">Clicked!</div>`;
});

// Dispatch events
document.getElementById("my-button").click();

// Check element properties
expect(document.getElementById("result").textContent).toBe("Clicked!");
```

### Chrome API Mocking

The Chrome extension APIs are mocked to simulate browser behavior:

```javascript
global.chrome = {
  tabs: {
    query: jest.fn().mockResolvedValue([{ id: 1 }]),
    sendMessage: jest.fn(),
  },
  storage: {
    local: {
      get: jest.fn().mockImplementation((keys, callback) => {
        callback({ apiKey: "test-api-key" });
      }),
      set: jest.fn(),
    },
  },
};
```

### OpenAI API Mocking

The OpenAI API calls are mocked to simulate different response scenarios:

```javascript
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
```

### Timer Mocking

Jest's timer mocking is used to test animations and transitions:

```javascript
// Use fake timers
jest.useFakeTimers();

// Advance timers
jest.advanceTimersByTime(300);

// Restore real timers
jest.useRealTimers();
```

## Adding New Tests

To add new tests:

1. Create a new test file or add to existing files
2. Use the Jest testing framework syntax
3. Mock Chrome API calls as needed
4. Run tests to verify functionality

## Common Test Failures and Solutions

### Event Handlers Not Working

If tests involving DOM event handlers fail (like clicking buttons), make sure:

1. The event handlers are properly attached in the test setup
2. Events are properly dispatched using `element.click()` or `element.dispatchEvent()`
3. The DOM structure matches what your code expects

Example fix:

```javascript
// Attach event listeners in beforeEach
beforeEach(() => {
  // Get DOM elements
  button = document.getElementById("my-button");

  // Attach event handler
  button.addEventListener("click", () => {
    // Handler code
  });
});
```

### Chrome API Mocks Not Called

If tests involving Chrome API calls fail, check:

1. The mock implementation is correct
2. The mock is properly set up to track calls
3. Async functions are properly handled with Promise mocks

Example fix:

```javascript
// Mock Chrome storage API
global.chrome = {
  storage: {
    local: {
      get: jest.fn().mockImplementation((keys, callback) => {
        callback({ key: "value" });
      }),
      set: jest.fn().mockImplementation((data, callback) => {
        if (callback) callback();
        return Promise.resolve();
      }),
    },
  },
};
```

### OpenAI API Test Failures

If tests involving OpenAI API calls fail, check:

1. The mock stream implementation is correct
2. The TextEncoder/TextDecoder polyfills are properly set up
3. The fetch mock is properly configured for streaming responses
4. Error handling in the tests matches the implementation

Example fix:

```javascript
// Ensure proper polyfills are in place
const { ReadableStream } = require("stream/web");
const { TextEncoder, TextDecoder } = require("util");

global.ReadableStream = ReadableStream;
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch with proper streaming response
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  body: mockStream,
  headers: new Headers({
    "content-type": "text/event-stream",
  }),
});
```

## Troubleshooting

If tests fail, check:

- Chrome API mocks are properly set up
- DOM elements are correctly initialized
- Event handlers are properly attached
- Timers are properly advanced for async operations
- Console for any JavaScript errors during test execution

To debug a specific test, you can run:

```
npm test -- -t "name of your test"
```

## Code Coverage

To generate a code coverage report:

```
npm run test:coverage
```

This will create a coverage report in the `coverage` directory, showing which parts of your code are tested and which are not.

> **Note:** The `coverage` directory is included in `.gitignore` and will not be committed to the repository. This is standard practice as coverage files are generated artifacts and can be large.
