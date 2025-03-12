document.addEventListener("DOMContentLoaded", async () => {
  const apiKeyInput = document.getElementById("api-key");
  const saveKeyButton = document.getElementById("save-key");
  const summarizeButton = document.getElementById("summarize");
  const errorDisplay = document.getElementById("error");
  const summaryDisplay = document.getElementById("summary");
  const togglePromptButton = document.getElementById("toggle-prompt");
  const promptContent = document.getElementById("prompt-content");
  const promptInput = document.getElementById("prompt");

  let bufferedContent = "";

  const incompleteTagRegex = /<[^>]*$/;

  function hasIncompleteTag(str) {
    return incompleteTagRegex.test(str);
  }

  // Create overlay when popup opens
  createOverlay();

  // Create a connection to the content script that will be closed when popup closes
  let contentPort;

  // Add click handler for the summary section to toggle controls visibility
  document.getElementById("summary-section").addEventListener("click", (e) => {
    // Check if the click was near the top-right corner (where the gear icon is)
    const rect = e.currentTarget.getBoundingClientRect();
    const isTopRight = e.clientX > rect.right - 30 && e.clientY < rect.top + 30;

    if (isTopRight) {
      // Toggle the collapsed state of controls
      document.getElementById("controls").classList.toggle("collapsed");
    }
  });

  // Function to create overlay
  async function createOverlay() {
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // Inject content script if not already injected
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
        });
      } catch (error) {
        // Ignore error if script is already injected
        console.log("Content script may already be injected:", error);
      }

      // Send message to content script to create overlay
      await chrome.tabs.sendMessage(tab.id, {
        action: "createOverlay",
      });

      // Create a connection that will be used to detect when popup closes
      contentPort = chrome.tabs.connect(tab.id, { name: "overlay-connection" });
    } catch (error) {
      console.error("Failed to create overlay:", error);
    }
  }

  // Function to remove overlay
  async function removeOverlay() {
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // Send message to content script to remove overlay
      await chrome.tabs.sendMessage(tab.id, {
        action: "removeOverlay",
      });
    } catch (error) {
      console.error("Failed to remove overlay:", error);
    }
  }

  // Default prompt
  const defaultPrompt =
    "summarize in a 1 min read. use concise bullet points. i want the easiest to digest material with larger, readable text. Use proper HTML formatting with <h1> for title, <ul> for lists, and <li> for bullet points. Keep paragraphs short (2-3 sentences max). Use fewer bullet points but make them more meaningful. cite any potential political bias in another section below the rest with an <h2> heading.";

  // Initialize UI state
  errorDisplay.classList.add("hidden");
  summaryDisplay.innerHTML = "<p>Click above to summarize</p>";

  // Load saved API key and prompt from local storage
  chrome.storage.local.get(["apiKey", "customPrompt"], (result) => {
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
      summarizeButton.disabled = false;
    }
    if (result.customPrompt) {
      promptInput.value = result.customPrompt;
    } else {
      promptInput.value = defaultPrompt;
    }
  });

  // Toggle prompt section
  togglePromptButton.addEventListener("click", () => {
    promptContent.classList.toggle("hidden");
    const arrow = togglePromptButton.querySelector(".arrow");
    arrow.innerHTML = promptContent.classList.contains("hidden")
      ? "&darr;"
      : "&uarr;";
  });

  // Save API key to local storage
  saveKeyButton.addEventListener("click", async () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      showError("Please enter an API key");
      return;
    }

    try {
      await chrome.storage.local.set({ apiKey });
      summarizeButton.disabled = false;
      showError("");
    } catch (error) {
      console.error("Failed to save API key:", error);
      showError("Failed to save API key. Please try again.");
    }
  });

  // Save prompt to local storage when changed
  promptInput.addEventListener("change", () => {
    const prompt = promptInput.value.trim();
    chrome.storage.local.set({ customPrompt: prompt });
  });

  // Listen for streaming tokens
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "streamToken") {
      // Show summary section if it's the first token
      if (summaryDisplay.textContent === "") {
        summaryDisplay.classList.remove("hidden");
        errorDisplay.classList.add("hidden");

        // Collapse the controls section when content starts displaying
        document.getElementById("controls").classList.add("collapsed");
      }
      bufferedContent += message.token;

      if (!hasIncompleteTag(bufferedContent)) {
        // Append the new token
        summaryDisplay.innerHTML = bufferedContent;
      }
    } else if (message.type === "streamComplete") {
      summarizeButton.disabled = false;
    } else if (message.type === "error") {
      errorDisplay.textContent = message.error;
      errorDisplay.classList.toggle("hidden", !message.error);
      summarizeButton.disabled = false;

      // Show controls again if there's an error
      document.getElementById("controls").classList.remove("collapsed");
    }
  });

  // Handle summarize button click
  summarizeButton.addEventListener("click", async () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      showError("Please enter an API key");
      return;
    }

    // Reset UI state
    errorDisplay.classList.add("hidden");
    summarizeButton.disabled = true;

    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // Inject content script if not already injected
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
        });
      } catch (error) {
        // Ignore error if script is already injected
        console.log("Content script may already be injected:", error);
      }

      // Send message to content script to get page content
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "getPageContent",
      });

      // Send content to background script for Claude API call
      summaryDisplay.textContent = "";
      bufferedContent = "";
      await chrome.runtime.sendMessage({
        action: "summarize",
        content: response.content,
        apiKey: apiKey,
        prompt: promptInput.value.trim(),
      });
    } catch (error) {
      showError(error.message || "Failed to generate summary");
    } finally {
      // Ensure loading indicator is hidden
      summarizeButton.disabled = false;
    }
  });

  function showError(message) {
    errorDisplay.textContent = message;
    errorDisplay.classList.toggle("hidden", !message);
    if (message) {
      summaryDisplay.classList.add("hidden");
    }
  }
});
