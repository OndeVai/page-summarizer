/**
 * @jest-environment jsdom
 */

// Mock Chrome API
global.chrome = {
  runtime: {
    onMessage: { addListener: jest.fn() },
    onConnect: { addListener: jest.fn() },
  },
};

// Import content.js functions
// In a real test, you would need to make the content.js code testable
// For this example, we'll recreate the key functions

// Recreate the createOverlay and removeOverlay functions for testing
function createOverlay() {
  // Check if overlay already exists
  if (document.getElementById("page-summarizer-overlay")) {
    return;
  }

  // Create overlay element
  const overlay = document.createElement("div");
  overlay.id = "page-summarizer-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.65)";
  overlay.style.zIndex = "2147483647";
  overlay.style.transition = "opacity 0.3s ease";
  overlay.style.opacity = "0";
  overlay.style.backdropFilter = "blur(3px)";
  overlay.style.pointerEvents = "none";
  overlay.style.background =
    "linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.6) 100%)";

  // Add overlay to the page
  document.body.appendChild(overlay);

  // Trigger transition by setting opacity after a small delay
  setTimeout(() => {
    overlay.style.opacity = "1";
  }, 10);
}

function removeOverlay() {
  const overlay = document.getElementById("page-summarizer-overlay");
  if (overlay) {
    // Fade out the overlay
    overlay.style.opacity = "0";

    // Remove after transition completes
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.remove();
      }
    }, 300);
  }
}

describe("Overlay Functionality", () => {
  beforeEach(() => {
    // Clear the document body before each test
    document.body.innerHTML = "";

    // Reset timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Restore timers
    jest.useRealTimers();
  });

  test("createOverlay adds an overlay to the page", () => {
    // Initially no overlay
    expect(document.getElementById("page-summarizer-overlay")).toBeNull();

    // Create overlay
    createOverlay();

    // Check if overlay was created
    const overlay = document.getElementById("page-summarizer-overlay");
    expect(overlay).not.toBeNull();
    expect(overlay.style.opacity).toBe("0");

    // Advance timers to trigger the opacity transition
    jest.advanceTimersByTime(20);

    // Check if opacity was set to 1
    expect(overlay.style.opacity).toBe("1");
  });

  test("removeOverlay removes the overlay from the page", () => {
    // Create overlay first
    createOverlay();
    jest.advanceTimersByTime(20);

    // Check if overlay exists
    expect(document.getElementById("page-summarizer-overlay")).not.toBeNull();

    // Remove overlay
    removeOverlay();

    // Check if opacity was set to 0
    const overlay = document.getElementById("page-summarizer-overlay");
    expect(overlay.style.opacity).toBe("0");

    // Advance timers to trigger the removal
    jest.advanceTimersByTime(400);

    // Check if overlay was removed
    expect(document.getElementById("page-summarizer-overlay")).toBeNull();
  });

  test("createOverlay does not create duplicate overlays", () => {
    // Create overlay
    createOverlay();

    // Try to create another overlay
    createOverlay();

    // Check if only one overlay exists
    const overlays = document.querySelectorAll("#page-summarizer-overlay");
    expect(overlays.length).toBe(1);
  });
});
