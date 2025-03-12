// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageContent") {
    // Get the main content of the page
    const content = extractPageContent();
    sendResponse({ content });
  } else if (request.action === "createOverlay") {
    createOverlay();
    sendResponse({ success: true });
  } else if (request.action === "removeOverlay") {
    removeOverlay();
    sendResponse({ success: true });
  } else if (request.action === "ping") {
    // Used to check if content script is still connected
    sendResponse({ success: true });
  }
  return true;
});

// Listen for connection from popup
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "overlay-connection") {
    // When the popup disconnects (closes), remove the overlay
    port.onDisconnect.addListener(removeOverlay);
  }
});

// Function to create an overlay on the page
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
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.65)"; // Darker overlay for better contrast
  overlay.style.zIndex = "2147483647"; // Maximum z-index value
  overlay.style.transition = "opacity 0.3s ease";
  overlay.style.opacity = "0";
  overlay.style.backdropFilter = "blur(3px)"; // Increased blur for better visual effect
  overlay.style.pointerEvents = "none"; // Allow clicking through the overlay

  // Add a subtle gradient to make it more visually interesting
  overlay.style.background =
    "linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.6) 100%)";

  // Add overlay to the page
  if (document.body) {
    document.body.appendChild(overlay);

    // Trigger transition by setting opacity after a small delay
    setTimeout(() => {
      overlay.style.opacity = "1";
    }, 10);
  } else {
    // If body is not available yet, wait for it
    document.addEventListener("DOMContentLoaded", () => {
      document.body.appendChild(overlay);
      setTimeout(() => {
        overlay.style.opacity = "1";
      }, 10);
    });
  }
}

// Function to remove the overlay
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
    }, 300); // Match the transition duration
  }
}

function extractPageContent() {
  // Create a clone of the document body
  const clone = document.body.cloneNode(true);

  // Remove unwanted elements from the clone
  const elementsToRemove = clone.querySelectorAll(
    "script, style, nav, header, footer, iframe, noscript"
  );
  elementsToRemove.forEach((el) => el.remove());

  // Get the main content
  let content = "";

  // Try to find the main content area
  const mainContent = clone.querySelector(
    'main, article, [role="main"], .main-content, #main-content'
  );
  if (mainContent) {
    content = mainContent.innerText;
  } else {
    // Fallback to body content
    content = clone.innerText;
  }

  // Clean up the content
  content = content
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/\n+/g, "\n") // Replace multiple newlines with single newline
    .trim();

  // Limit content length to avoid token limits
  const maxLength = 10000;
  if (content.length > maxLength) {
    content = content.substring(0, maxLength) + "...";
  }

  return content;
}
