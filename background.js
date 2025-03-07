// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "summarize") {
    summarizeContent(
      request.tab,
      request.content,
      request.prompt,
      request.apiKey
    )
      .then((summary) => sendResponse(summary))
      .catch((error) => sendResponse({ error: error.message }));
    return true; // Will respond asynchronously
  }
});

async function summarizeContent(tab, content, prompt, apiKey) {
  try {
    const systemPrompt = `format your response in html. use <h1> for the title, <p> for the body, <ul> for the list, <li> for the list item. ${
      prompt || ""
    }`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: content,
          },
        ],
        stream: true, // Enable streaming
      }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let isFormingHtmlTag = false;
    let bufferedContent = "";

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
            if (isHtmlStartToken(token)) {
              isFormingHtmlTag = true;
              bufferedContent = "";
            }
            if (isFormingHtmlTag) {
              bufferedContent += token;
              isFormingHtmlTag = !isHtmlEndToken(token);
            } else {
              bufferedContent = token;
            }

            if (!isFormingHtmlTag) {
              // console.log(bufferedContent);
              // Send each token to the popup
              chrome.runtime.sendMessage({
                type: "streamToken",
                token: bufferedContent,
              });
            }
          }
        }
      }
    }

    // Send completion message
    chrome.runtime.sendMessage({ type: "streamComplete" });
  } catch (error) {
    chrome.runtime.sendMessage({
      type: "error",
      error: error.message,
    });
  }
}

//todo regex instead
function isHtmlStartToken(token) {
  return token.includes("<");
}

function isHtmlEndToken(token) {
  return token.includes(">");
}
