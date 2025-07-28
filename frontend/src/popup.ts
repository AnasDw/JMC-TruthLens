/// <reference types="chrome"/>

interface VerificationResult {
  label: string;
  response: string;
  isSafe: boolean;
  references?: string;
  archive?: string;
}

type PopupMessageAction =
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
  action: PopupMessageAction;
  selectedText?: string;
  result?: VerificationResult;
  loading?: boolean;
  error?: string;
  message?: string;
}

interface PopupMessage extends TruthLensMessage {
  loading?: boolean;
  error?: string;
  message?: string;
  result?: VerificationResult & { isSafe?: boolean };
}

type VerificationStatus = "verified" | "false" | "warning";

class TruthLensPopup {
  private readonly THEME_COLORS = [
    "#6366f1",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
  ];
  private readonly DEFAULT_SUCCESS_MESSAGE = "Verification complete!";

  private resultDiv: HTMLElement | null = null;
  private statusDot: HTMLElement | null = null;
  private popupContainer: HTMLElement | null = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.cacheElements();
    this.setupEventListeners();
    this.setInitialStatus();
  }

  private cacheElements(): void {
    this.resultDiv = document.getElementById("result");
    this.statusDot = document.getElementById("status-dot");
    this.popupContainer = document.getElementById("popup-container");
  }

  private setupEventListeners(): void {
    document.addEventListener("DOMContentLoaded", () =>
      this.onDOMContentLoaded()
    );
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) =>
      this.handlePopupMessage(message, sender, sendResponse)
    );
  }

  private onDOMContentLoaded(): void {
    this.setInitialStatus();
    this.setupThemeToggle();
  }

  private setInitialStatus(): void {
    if (this.statusDot) {
      this.updateStatusDot("var(--accent-color)");
    }
  }

  private setupThemeToggle(): void {
    const header = document.querySelector(".header") as HTMLElement;
    if (header) {
      header.addEventListener("click", () => this.cycleTheme());
    }
  }

  private cycleTheme(): void {
    const currentColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--primary-color")
      .trim();

    const currentIndex = this.THEME_COLORS.indexOf(currentColor);
    const nextColor =
      this.THEME_COLORS[(currentIndex + 1) % this.THEME_COLORS.length];

    this.setThemeColor(nextColor);
  }

  private setThemeColor(color: string): void {
    document.documentElement.style.setProperty("--primary-color", color);
    document.documentElement.style.setProperty("--primary-hover", color);
  }

  private updateStatusDot(color: string): void {
    if (this.statusDot) {
      this.statusDot.style.background = color;
    }
  }

  private updateLoadingState(isLoading: boolean): void {
    if (this.popupContainer) {
      this.popupContainer.classList.toggle("popup-loading", isLoading);
    }
  }

  private validateElements(): boolean {
    return Boolean(this.resultDiv && this.statusDot && this.popupContainer);
  }

  private handlePopupMessage(
    message: PopupMessage,
    _: chrome.runtime.MessageSender,
    __: (response?: any) => void
  ): void {
    if (message.action !== "showPopup" || !this.validateElements()) {
      return;
    }

    if (message.loading) {
      this.handleLoadingState();
    } else if (message.error) {
      this.handleErrorState(message.error);
    } else if (message.result) {
      this.handleSuccessState(message.result, message.message);
    }
  }

  private handleLoadingState(): void {
    this.updateStatusDot("var(--warning-color)");
    this.updateLoadingState(true);
    this.showLoadingState();
  }

  private handleErrorState(error: string): void {
    this.updateLoadingState(false);
    this.updateStatusDot("var(--error-color)");
    this.showErrorState(error);
  }

  private handleSuccessState(
    result: VerificationResult & { isSafe?: boolean },
    message?: string
  ): void {
    this.updateLoadingState(false);

    const statusColor = result.isSafe
      ? "var(--accent-color)"
      : "var(--error-color)";
    this.updateStatusDot(statusColor);

    const successMessage = message || this.DEFAULT_SUCCESS_MESSAGE;
    this.showSuccessMessage(successMessage);
  }

  private showLoadingState(): void {
    if (!this.resultDiv) return;

    console.log("Showing loading state in popup");

    this.resultDiv.innerHTML = this.createLoadingHTML();
  }

  private createLoadingHTML(): string {
    return `
      <div class="loading">
        <div class="loading-spinner"></div>
      </div>
      <div style="text-align: center; margin-top: 16px;">
        <h3 style="color: var(--text-secondary); font-size: var(--font-size-base); font-weight: 500;">
          🔍 Analyzing content...
        </h3>
        <p style="color: var(--text-light); font-size: var(--font-size-sm); margin-top: 8px;">
          Please wait while we verify the information
        </p>
      </div>
    `;
  }

  private showSuccessMessage(message: string): void {
    if (!this.resultDiv) return;

    console.log("Showing success message in popup:", message);

    this.resultDiv.innerHTML = this.createSuccessHTML(message);
  }

  private createSuccessHTML(message: string): string {
    return `
      <div class="success-message">
        <div class="success-icon">✨</div>
        <h3>Success!</h3>
        <p>${this.escapeHtml(message)}</p>
        <div class="success-hint">
          💡 Look for the colored highlight on the webpage for detailed verification results
        </div>
      </div>
    `;
  }

  private showErrorState(error: string): void {
    if (!this.resultDiv) return;

    console.log("Showing error state in popup", error);

    this.resultDiv.innerHTML = this.createErrorHTML(error);
  }

  private createErrorHTML(error: string): string {
    return `
      <div class="result-card">
        <div class="result-header">
          <span class="result-label false">Error</span>
        </div>
        <div class="result-content">
          <strong>Something went wrong:</strong><br>
          ${this.escapeHtml(error)}
        </div>
      </div>
    `;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  private getVerificationStatus(label: string): VerificationStatus {
    const lowerLabel = label.toLowerCase();

    if (
      lowerLabel.includes("true") ||
      lowerLabel.includes("verified") ||
      lowerLabel.includes("accurate")
    ) {
      return "verified";
    }

    if (
      lowerLabel.includes("false") ||
      lowerLabel.includes("misleading") ||
      lowerLabel.includes("incorrect")
    ) {
      return "false";
    }

    return "warning";
  }

  private getSafetyDescription(isSafe?: boolean): string {
    return isSafe
      ? "This content appears to be safe and trustworthy based on our analysis."
      : "This content may contain misleading or false information. Please verify from additional sources.";
  }

  private createResultCard(
    title: string,
    label: string,
    content: string,
    status: VerificationStatus
  ): HTMLElement {
    const card = document.createElement("div");
    card.className = "result-card";

    card.innerHTML = `
      <div class="result-header">
        <span class="result-label ${status}">${this.escapeHtml(label)}</span>
      </div>
      <div class="result-content">
        <strong>${this.escapeHtml(title)}:</strong><br>
        ${this.escapeHtml(content)}
      </div>
    `;

    return card;
  }

  public showResults(result: VerificationResult & { isSafe?: boolean }): void {
    if (!this.resultDiv) return;

    this.resultDiv.innerHTML = "";

    const verificationCard = this.createResultCard(
      "Verification Result",
      result.label,
      result.response,
      this.getVerificationStatus(result.label)
    );

    this.resultDiv.appendChild(verificationCard);

    const safetyCard = this.createResultCard(
      "Safety Assessment",
      result.isSafe ? "Safe" : "Potentially Unsafe",
      this.getSafetyDescription(result.isSafe),
      result.isSafe ? "verified" : "warning"
    );

    this.resultDiv.appendChild(safetyCard);

    if (result.archive && result.archive !== "None") {
      const archiveCard = this.createResultCard(
        "Archive Information",
        "Available",
        result.archive,
        "verified"
      );
      this.resultDiv.appendChild(archiveCard);
    }
  }
}

new TruthLensPopup();

