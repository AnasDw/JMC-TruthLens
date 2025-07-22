const BASE_URL = 'http://127.0.0.1:8000';

/**
 * Create a context menu item for the user to click on to verify the selected
 * text with TruthLens.
 * @listens chrome.runtime.onInstalled
 */
function createContextMenu() {
    chrome.contextMenus.create({
        id: "verifyWithTruthLens",
        title: "Verify with TruthLens",
        contexts: ["selection"]
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
        
        // Immediately show loading state in popup
        chrome.runtime.sendMessage({ 
            action: "showPopup", 
            loading: true 
        });
        
        // Start verification process
        await verifyText(pageUrl, selectedText);
    }
}
chrome.contextMenus.onClicked.addListener(onContextClick);

/**
 * Send a POST request to TruthLens backend to verify the given text.
 * @param {string} url - URL of the page where the text was selected.
 * @param {string} content - Selected text.
 * @throws {Error} - If the response status is not 200.
 */
async function verifyText(url, content) {
    try {
        let objToSend = { url: url, content: content };
        console.log(objToSend);
        const response = await fetch(`${BASE_URL}/verify/text/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(objToSend),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log(result);
        chrome.runtime.sendMessage({ action: "showPopup", result: result });
    } catch (error) {
        console.log('Error:', error);
        chrome.runtime.sendMessage({ action: "showPopup", error: error.message });
    }
}

/**
 * Handles the "verifyText" message from the content script.
 * @param {Object} message - The message sent from the content script.
 * @param {Object} sender - The sender of the message.
 * @param {function} sendResponse - The function to send the response back.
 * @listens chrome.runtime.onMessage
 */
function onSelectTruthLensFromContextMenu(message, sender, sendResponse) {
    if (message.action === "verifyText") {
        // Immediately show loading state in popup
        chrome.runtime.sendMessage({ 
            action: "showPopup", 
            loading: true 
        });
        
        // Start verification process
        verifyText(message.url, message.content);
    }
}
chrome.runtime.onMessage.addListener(onSelectTruthLensFromContextMenu);

// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(createContextMenu);
