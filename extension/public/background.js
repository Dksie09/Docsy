const GRAPHQL_API_URL = process.env.GRAPHQL_API_URL;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "openLink") {
        chrome.tabs.create({
            url: message.url,
            active: false
        }, () => {
            sendResponse({ success: true });
        });
        return true;
    }

    if (message.action === "processQuery") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentUrl = tabs[0]?.url;

            fetch(GRAPHQL_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: `
              query GenerateDocumentationResponse {
                generateDocumentationResponse(
                  question: """${message.query}"""
                  currentUrl: """${currentUrl}"""
                ) {
                  success
                  documentation
                  response
                  links {
                    title
                    url
                  }
                }
              }
            `,
                }),
            })
                .then((response) => response.json())
                .then((data) => {
                    sendResponse({
                        success: true,
                        data: data.data.generateDocumentationResponse,
                    });
                })
                .catch((error) => {
                    sendResponse({ success: false, error: error.message });
                });
        });
        return true;
    }
});

chrome.commands.onCommand.addListener((command) => {
    if (command === "_execute_action") {
        chrome.tabs.create({
            url: chrome.runtime.getURL("index.html"),
            pinned: true,
        });
    }
});