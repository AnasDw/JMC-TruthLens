"use strict";
/// <reference types="chrome"/>
/// <reference path="../types/chrome.d.ts"/>
class TruthLensBackground {
    constructor() {
        this.BASE_URL = "http://127.0.0.1:8000";
        this.CONTEXT_MENU_ID = "verifyWithTruthLens";
        this.MAX_CONTENT_LENGTH = 10000;
        this.MAX_RETRIES = 3;
        this.INJECTION_DELAY = 500;
        this.RETRY_BASE_DELAY = 100;
        this.initialize();
    }
    initialize() {
        this.setupEventListeners();
    }
    setupEventListeners() {
        chrome.runtime.onInstalled.addListener(() => this.createContextMenu());
        chrome.contextMenus.onClicked.addListener((info, tab) => this.onContextClick(info, tab));
    }
    async safelySendMessage(tabId, message, retries = this.MAX_RETRIES) {
        if (!this.isValidTabId(tabId)) {
            console.error("TruthLens: Invalid tab ID:", tabId);
            return false;
        }
        try {
            const tabExists = await this.checkTabExists(tabId);
            if (!tabExists) {
                console.warn("TruthLens: Tab no longer exists:", tabId);
                return false;
            }
        }
        catch (error) {
            console.warn("TruthLens: Could not verify tab existence:", tabId);
        }
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                await chrome.tabs.sendMessage(tabId, message);
                return true;
            }
            catch (error) {
                console.warn(`TruthLens: Attempt ${attempt + 1} failed to send message:`, error.message);
                if (attempt < retries) {
                    await this.delay(this.RETRY_BASE_DELAY * (attempt + 1));
                }
                else {
                    console.error("TruthLens: All attempts failed to send message:", message);
                }
            }
        }
        return false;
    }
    checkTabExists(tabId) {
        return new Promise((resolve) => {
            chrome.tabs.query({}, (tabs) => {
                const tabExists = tabs.some((tab) => tab.id === tabId);
                resolve(tabExists);
            });
        });
    }
    isValidTabId(tabId) {
        return Boolean(tabId && tabId > 0);
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    async ensureContentScriptReady(tabId) {
        if (await this.pingContentScript(tabId)) {
            return true;
        }
        console.warn("TruthLens: Content script not ready, attempting to inject...");
        if (!(await this.injectContentScript(tabId))) {
            return false;
        }
        await this.delay(this.INJECTION_DELAY);
        return await this.pingContentScript(tabId);
    }
    async pingContentScript(tabId) {
        try {
            await chrome.tabs.sendMessage(tabId, {
                action: "ping",
            });
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async injectContentScript(tabId) {
        try {
            await chrome.scripting.executeScript({
                target: { tabId },
                files: ["./dist/content.js"],
            });
            return true;
        }
        catch (error) {
            console.error("TruthLens: Failed to inject content script:", error);
            return false;
        }
    }
    createContextMenu() {
        chrome.contextMenus.create({
            id: this.CONTEXT_MENU_ID,
            title: "Verify with TruthLens",
            contexts: ["selection"],
        });
    }
    async onContextClick(info, tab) {
        if (!this.validateContextClick(info, tab)) {
            return;
        }
        const selectedText = info.selectionText.trim();
        const tabId = tab.id;
        if (!(await this.ensureContentScriptReady(tabId))) {
            console.error("TruthLens: Cannot proceed - content script is not ready");
            return;
        }
        await this.safelySendMessage(tabId, {
            action: "verificationStarted",
            selectedText,
        });
        await this.verifyText(tab.url || "", selectedText, tabId);
    }
    validateContextClick(info, tab) {
        if (!tab?.id || !info.selectionText) {
            console.warn("TruthLens: No tab ID or selected text available");
            return false;
        }
        if (!info.selectionText.trim()) {
            console.warn("TruthLens: Selected text is empty");
            return false;
        }
        return true;
    }
    validateContent(content) {
        if (!content?.trim()) {
            return { isValid: false, error: "Content cannot be empty" };
        }
        if (content.length > this.MAX_CONTENT_LENGTH) {
            return {
                isValid: false,
                error: `Content too long (max ${this.MAX_CONTENT_LENGTH.toLocaleString()} characters)`,
            };
        }
        return { isValid: true };
    }
    async sendErrorToTab(tabId, error) {
        return await this.safelySendMessage(tabId, {
            action: "verificationComplete",
            error,
        });
    }
    async sendErrorToPopup(error) {
        try {
            await chrome.storage.local.set({
                truthlens_popup_data: {
                    action: "showPopup",
                    error,
                    timestamp: Date.now(),
                },
            });
        }
        catch (storageError) {
            console.error("TruthLens: Failed to store error for popup:", storageError);
        }
    }
    async verifyText(url, content, tabId) {
        const validation = this.validateContent(content);
        if (!validation.isValid) {
            if (tabId) {
                await this.sendErrorToTab(tabId, validation.error);
            }
            return;
        }
        try {
            const result = await this.makeVerificationRequest(url, content.trim());
            if (tabId) {
                const messageSent = await this.safelySendMessage(tabId, {
                    action: "verificationComplete",
                    result,
                });
                if (!messageSent) {
                    console.warn("TruthLens: Failed to send to original tab, trying active tab");
                    await this.sendToActiveTab({
                        action: "verificationComplete",
                        result,
                    });
                }
            }
            chrome.storage.local.set({
                truthlens_popup_data: {
                    action: "showPopup",
                    result,
                    timestamp: Date.now(),
                },
            });
        }
        catch (error) {
            const errorMessage = error.message;
            if (tabId) {
                const messageSent = await this.sendErrorToTab(tabId, errorMessage);
                if (!messageSent) {
                    console.warn("TruthLens: Failed to send error to original tab, trying active tab");
                    await this.sendToActiveTab({
                        action: "verificationComplete",
                        error: errorMessage,
                    });
                }
            }
            await this.sendErrorToPopup(errorMessage);
        }
    }
    async sendToActiveTab(message) {
        return new Promise((resolve) => {
            chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
                if (tabs.length > 0 && tabs[0].id) {
                    const success = await this.safelySendMessage(tabs[0].id, message);
                    resolve(success);
                }
                else {
                    resolve(false);
                }
            });
        });
    }
    async makeVerificationRequest(url, content) {
        const requestBody = { url, content };
        const response = await fetch(`${this.BASE_URL}/verify/text/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }
}
new TruthLensBackground();
//# sourceMappingURL=background.js.map