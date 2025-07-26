"use strict";
/// <reference types="chrome"/>
const BASE_URL = "http://127.0.0.1:8000";
/**
 * Safely send a message to a content script with error handling
 */
const safelySendMessage = async (tabId, message, retries = 3) => {
    if (!tabId || tabId <= 0) {
        console.error("TruthLens: Invalid tab ID:", tabId);
        return false;
    }
    for (let i = 0; i <= retries; i++) {
        try {
            await chrome.tabs.sendMessage(tabId, message);
            return true;
        }
        catch (error) {
            console.warn(`TruthLens: Attempt ${i + 1} failed to send message:`, error.message);
            if (i < retries) {
                await new Promise((resolve) => setTimeout(resolve, 100 * (i + 1)));
            }
            else {
                console.error("TruthLens: All attempts failed to send message:", message);
            }
        }
    }
    return false;
};
/**
 * Check if content script is ready by sending a ping message
 */
async function ensureContentScriptReady(tabId) {
    try {
        await chrome.tabs.sendMessage(tabId, {
            action: "ping",
        });
        return true;
    }
    catch (error) {
        console.warn("TruthLens: Content script not ready, attempting to inject...");
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ["./dist/content.js"],
            });
            await new Promise((resolve) => setTimeout(resolve, 500));
            try {
                await chrome.tabs.sendMessage(tabId, {
                    action: "ping",
                });
                return true;
            }
            catch (pingError) {
                console.error("TruthLens: Content script injection succeeded but ping failed:", pingError);
                return false;
            }
        }
        catch (injectError) {
            console.error("TruthLens: Failed to inject content script:", injectError);
            return false;
        }
    }
}
/**
 * Create a context menu item for the user to click on to verify the selected text
 */
function createContextMenu() {
    chrome.contextMenus.create({
        id: "verifyWithTruthLens",
        title: "Verify with TruthLens",
        contexts: ["selection"],
    });
}
/**
 * Handle context menu clicks
 */
async function onContextClick(info, tab) {
    if (!tab?.id || !info.selectionText) {
        console.warn("TruthLens: No tab ID or selected text available");
        return;
    }
    const selectedText = info.selectionText.trim();
    if (!selectedText) {
        console.warn("TruthLens: Selected text is empty");
        return;
    }
    const isReady = await ensureContentScriptReady(tab.id);
    if (!isReady) {
        console.error("TruthLens: Cannot proceed - content script is not ready");
        return;
    }
    await safelySendMessage(tab.id, {
        action: "verificationStarted",
        selectedText: selectedText,
    });
    await verifyText(tab.url || "", selectedText, tab.id);
}
/**
 * Send a POST request to TruthLens backend to verify the given text
 */
async function verifyText(url, content, tabId) {
    if (!content || content.trim().length === 0) {
        const errorMessage = "Content cannot be empty";
        console.error("TruthLens:", errorMessage);
        if (tabId) {
            await safelySendMessage(tabId, {
                action: "verificationComplete",
                error: errorMessage,
            });
        }
        return;
    }
    if (content.length > 10000) {
        const errorMessage = "Content too long (max 10,000 characters)";
        console.error("TruthLens:", errorMessage);
        if (tabId) {
            await safelySendMessage(tabId, {
                action: "verificationComplete",
                error: errorMessage,
            });
        }
        return;
    }
    try {
        const objToSend = { url, content: content.trim() };
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
            await safelySendMessage(tabId, {
                action: "verificationComplete",
                result: result,
            });
        }
        chrome.runtime.sendMessage({
            action: "showPopup",
            result: result,
        });
    }
    catch (error) {
        console.error("TruthLens: Verification error:", error);
        if (tabId) {
            await safelySendMessage(tabId, {
                action: "verificationComplete",
                error: error.message,
            });
        }
        chrome.runtime.sendMessage({
            action: "showPopup",
            error: error.message,
        });
    }
}
chrome.runtime.onInstalled.addListener(createContextMenu);
chrome.contextMenus.onClicked.addListener(onContextClick);
//# sourceMappingURL=background.js.map