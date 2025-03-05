// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "summarize") {
    summarizeContent(request.content, request.apiKey, request.prompt)
      .then((summary) => sendResponse(summary))
      .catch((error) => sendResponse({ error: error.message }));
    return true; // Will respond asynchronously
  }
});

async function summarizeContent(content, apiKey, prompt) {
  const fullPrompt = `${prompt}\n\n${content}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: fullPrompt,
          },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate summary");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    throw new Error("Failed to connect to OpenAI API: " + error.message);
  }
}
