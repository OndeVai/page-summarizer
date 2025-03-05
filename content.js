// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageContent") {
    // Get the main content of the page
    const content = extractPageContent();
    sendResponse({ content });
  }
  return true;
});

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
