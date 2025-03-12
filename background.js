// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "summarize") {
    // Initialize a new conversation
    initializeConversation(
      request.tab,
      request.content,
      request.prompt,
      request.apiKey
    )
      .then((summary) => sendResponse(summary))
      .catch((error) => sendResponse({ error: error.message }));
    return true; // Will respond asynchronously
  } else if (request.action === "followUpQuestion") {
    // Handle follow-up question
    handleFollowUpQuestion(request.question, request.apiKey)
      .then((response) => sendResponse(response))
      .catch((error) => sendResponse({ error: error.message }));
    return true; // Will respond asynchronously
  }
});

// Store conversation history in memory
let conversationHistory = [];

async function initializeConversation(tab, content, prompt, apiKey) {
  // Reset conversation history
  conversationHistory = [];

  // Add system message
  const systemPrompt = `format your response in html. use <h1> for the title, <p> for the body, <ul> for the list, <li> for the list item. ${
    prompt || ""
  }`;

  conversationHistory.push({
    role: "system",
    content: systemPrompt,
  });

  // Add user's initial content
  conversationHistory.push({
    role: "user",
    content: content,
  });

  // Call the API with the conversation
  return await callOpenAI(apiKey, true);
}

async function handleFollowUpQuestion(question, apiKey) {
  // Add the follow-up question to conversation history
  conversationHistory.push({
    role: "user",
    content: question,
  });

  // Call the API with the updated conversation
  return await callOpenAI(apiKey, false);
}

async function callOpenAI(apiKey, isInitialSummary) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: conversationHistory,
        stream: true, // Enable streaming
      }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantResponse = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ") && line !== "data: [DONE]") {
          const json = JSON.parse(line.slice(6));
          const token = json.choices[0]?.delta?.content || "";
          if (token) {
            assistantResponse += token;
            // Send each token to the popup
            chrome.runtime.sendMessage({
              type: "streamToken",
              token: token,
              isFollowUp: !isInitialSummary,
            });
          }
        }
      }
    }

    // Add assistant's response to conversation history
    conversationHistory.push({
      role: "assistant",
      content: assistantResponse,
    });

    // Send completion message
    chrome.runtime.sendMessage({
      type: "streamComplete",
      isFollowUp: !isInitialSummary,
    });
  } catch (error) {
    chrome.runtime.sendMessage({
      type: "error",
      error: error.message,
      isFollowUp: !isInitialSummary,
    });
  }
}

// Add export at the end of the file
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    initializeConversation,
    handleFollowUpQuestion,
    callOpenAI,
  };
}
