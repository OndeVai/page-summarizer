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
  // Default prompt
  const defaultPrompt =
    "summarize in a 1 min read. use concise bullet points. i want the easiest to digest material. cite any potential political bias in another 20 second read below the rest. Use html li bullett points and add an h1 html title:";

  // Initialize UI state
  errorDisplay.classList.add("hidden");
  summaryDisplay.innerHTML = "Click above to show summary of page";

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
