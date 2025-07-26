const BASE_URL = "http://127.0.0.1:8000";

/**
 * Safely send a message to a content script with error handling
 * @param {number} tabId - The tab ID to send the message to
 * @param {Object} message - The message object to send
 * @param {number} retries - Number of retries (default: 3)
 */
async function safelySendMessage(tabId, message, retries = 3) {
    for (let i = 0; i <= retries; i++) {
        try {
            await chrome.tabs.sendMessage(tabId, message);
            return true; // Success
        } catch (error) {
            console.warn(
                `TruthLens: Attempt ${i + 1} failed to send message:`,
                error.message
            );
            if (i < retries) {
                // Wait progressively longer before retrying
                await new Promise((resolve) =>
                    setTimeout(resolve, 100 * (i + 1))
                );
            } else {
                console.error(
                    "TruthLens: All attempts failed to send message:",
                    message
                );
                return false; // Failed
            }
        }
    }
}

/**
 * Check if content script is ready by sending a ping message
 * @param {number} tabId - The tab ID to check
 */
async function ensureContentScriptReady(tabId) {
    try {
        await chrome.tabs.sendMessage(tabId, { action: "ping" });
        return true;
    } catch (error) {
        console.warn(
            "TruthLens: Content script not ready, attempting to inject..."
        );

        // Try to inject the content script manually
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ["./js/content.js"],
            });

            // Wait a bit for the script to initialize
            await new Promise((resolve) => setTimeout(resolve, 200));
            return true;
        } catch (injectError) {
            console.error(
                "TruthLens: Failed to inject content script:",
                injectError
            );
            return false;
        }
    }
}

/**
 * Create a context menu item for the user to click on to verify the selected
 * text with TruthLens.
 * @listens chrome.runtime.onInstalled
 */
function createContextMenu() {
    chrome.contextMenus.create({
        id: "verifyWithTruthLens",
        title: "Verify with TruthLens",
        contexts: ["selection"],
    });
}

/**
 * Handles the context menu item click event. If the clicked item is "verifyWithTruthLens",
 * calls the verifyText function with the selected text and the URL of the page.
 * @param {Object} info - The context menu item click event info
 * @param {Object} tab - The tab where the context menu item was clicked
 * @listens chrome.contextMenus.onClicked
 */
async function onContextClick(info, tab) {
    if (info.menuItemId === "verifyWithTruthLens") {
        const selectedText = info.selectionText;
        const pageUrl = tab.url;

        // Ensure content script is ready
        const isReady = await ensureContentScriptReady(tab.id);

        if (isReady) {
            // Send messages to content script with error handling
            await safelySendMessage(tab.id, {
                action: "setHighlightSelectedText",
                selectedText: selectedText,
            });

            await safelySendMessage(tab.id, {
                action: "setLoadingCursor",
            });
        } else {
            console.warn(
                "TruthLens: Content script not available, proceeding without UI updates"
            );
        }

        await verifyText(pageUrl, selectedText, tab.id);
    }
}

/**
 * Send a POST request to TruthLens backend to verify the given text.
 * @param {string} url - URL of the page where the text was selected.
 * @param {string} content - Selected text.
 * @param {number} tabId - ID of the tab where the request originated (optional).
 * @throws {Error} - If the response status is not 200.
 */
async function verifyText(url, content, tabId = null) {
    try {
        let objToSend = { url: url, content: content };

        const response = await fetch(`${BASE_URL}/verify/text/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(objToSend),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (tabId) {
            await safelySendMessage(tabId, { action: "verificationComplete" });
            await safelySendMessage(tabId, {
                action: "showPopup",
                result: result,
            });
        }
    } catch (error) {
        console.error("TruthLens: Verification error:", error);

        if (tabId) {
            await safelySendMessage(tabId, { action: "verificationComplete" });
        }

        await safelySendMessage(tabId, {
            action: "showPopup",
            error: error.message,
        });
    }
}

chrome.runtime.onInstalled.addListener(createContextMenu);
chrome.contextMenus.onClicked.addListener(onContextClick);
