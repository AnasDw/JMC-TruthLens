/// <reference types="chrome"/>
/// <reference path="../types/chrome.d.ts"/>

interface VerificationResult {
  label: string;
  response: string;
  isSafe: boolean;
  references?: string;
  archive?: string;
}

interface VerificationRequest {
  url: string;
  content: string;
}

type BackgroundMessageAction =
  | "ping"
  | "setHighlightSelectedText"
  | "setLoadingCursor"
  | "removeLoadingCursor"
  | "removeHighlightSelectedText"
  | "showVerificationResult"
  | "verificationComplete"
  | "verificationStarted"
  | "showPopup";

interface TruthLensMessage {
  action: BackgroundMessageAction;
  selectedText?: string;
  result?: VerificationResult;
  loading?: boolean;
  error?: string;
  message?: string;
}

class TruthLensBackground {
  private readonly BASE_URL = "http://127.0.0.1:8000";
  private readonly CONTEXT_MENU_ID = "verifyWithTruthLens";
  private readonly MAX_CONTENT_LENGTH = 10000;
  private readonly MAX_RETRIES = 3;
  private readonly INJECTION_DELAY = 500;
  private readonly RETRY_BASE_DELAY = 100;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    chrome.runtime.onInstalled.addListener(() => this.createContextMenu());
    chrome.contextMenus.onClicked.addListener((info, tab) =>
      this.onContextClick(info, tab)
    );
  }

  private async safelySendMessage(
    tabId: number,
    message: TruthLensMessage,
    retries: number = this.MAX_RETRIES
  ): Promise<boolean> {
    if (!this.isValidTabId(tabId)) {
      console.error("TruthLens: Invalid tab ID:", tabId);
      return false;
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        await chrome.tabs.sendMessage(tabId, message);
        return true;
      } catch (error) {
        console.warn(
          `TruthLens: Attempt ${attempt + 1} failed to send message:`,
          (error as Error).message
        );

        if (attempt < retries) {
          await this.delay(this.RETRY_BASE_DELAY * (attempt + 1));
        } else {
          console.error(
            "TruthLens: All attempts failed to send message:",
            message
          );
        }
      }
    }
    return false;
  }

  private isValidTabId(tabId: number): boolean {
    return Boolean(tabId && tabId > 0);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async ensureContentScriptReady(tabId: number): Promise<boolean> {
    if (await this.pingContentScript(tabId)) {
      return true;
    }

    console.warn(
      "TruthLens: Content script not ready, attempting to inject..."
    );

    if (!(await this.injectContentScript(tabId))) {
      return false;
    }

    await this.delay(this.INJECTION_DELAY);
    return await this.pingContentScript(tabId);
  }

  private async pingContentScript(tabId: number): Promise<boolean> {
    try {
      await chrome.tabs.sendMessage(tabId, {
        action: "ping",
      } as TruthLensMessage);
      return true;
    } catch (error) {
      return false;
    }
  }

  private async injectContentScript(tabId: number): Promise<boolean> {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["./dist/content.js"],
      });
      return true;
    } catch (error) {
      console.error("TruthLens: Failed to inject content script:", error);
      return false;
    }
  }

  private createContextMenu(): void {
    chrome.contextMenus.create({
      id: this.CONTEXT_MENU_ID,
      title: "Verify with TruthLens",
      contexts: ["selection"],
    });
  }

  private async onContextClick(
    info: chrome.contextMenus.OnClickData,
    tab?: chrome.tabs.Tab
  ): Promise<void> {
    if (!this.validateContextClick(info, tab)) {
      return;
    }

    const selectedText = info.selectionText!.trim();
    const tabId = tab!.id!;

    if (!(await this.ensureContentScriptReady(tabId))) {
      console.error("TruthLens: Cannot proceed - content script is not ready");
      return;
    }

    await this.safelySendMessage(tabId, {
      action: "verificationStarted",
      selectedText,
    });

    await this.verifyText(tab!.url || "", selectedText, tabId);
  }

  private validateContextClick(
    info: chrome.contextMenus.OnClickData,
    tab?: chrome.tabs.Tab
  ): boolean {
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

  private validateContent(content: string): {
    isValid: boolean;
    error?: string;
  } {
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

  private async sendErrorToTab(tabId: number, error: string): Promise<void> {
    await this.safelySendMessage(tabId, {
      action: "verificationComplete",
      error,
    });
  }

  private async sendErrorToPopup(error: string): Promise<void> {
    try {
      await chrome.storage.local.set({
        truthlens_popup_data: {
          action: "showPopup",
          error,
          timestamp: Date.now(),
        },
      });
    } catch (storageError) {
      console.error(
        "TruthLens: Failed to store error for popup:",
        storageError
      );
    }
  }

  private async verifyText(
    url: string,
    content: string,
    tabId?: number
  ): Promise<void> {
    const validation = this.validateContent(content);

    if (!validation.isValid) {
      console.error("TruthLens:", validation.error);

      if (tabId) {
        await this.sendErrorToTab(tabId, validation.error!);
      }
      return;
    }

    try {
      const result = await this.makeVerificationRequest(url, content.trim());

      if (tabId) {
        await this.safelySendMessage(tabId, {
          action: "verificationComplete",
          result,
        });
      }

      chrome.storage.local.set({
        truthlens_popup_data: {
          action: "showPopup",
          result,
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error("TruthLens: Verification error:", error);

      if (tabId) {
        await this.sendErrorToTab(tabId, errorMessage);
      }

      await this.sendErrorToPopup(errorMessage);
    }
  }

  private async makeVerificationRequest(
    url: string,
    content: string
  ): Promise<VerificationResult> {
    const requestBody: VerificationRequest = { url, content };

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

