"use strict";
/// <reference types="chrome"/>
/// <reference path="../types/chrome.d.ts"/>
class TruthLensPopup {
    constructor() {
        this.THEME_COLORS = [
            "#6366f1",
            "#10b981",
            "#f59e0b",
            "#ef4444",
            "#8b5cf6",
        ];
        this.DEFAULT_SUCCESS_MESSAGE = "Verification complete!";
        this.resultDiv = null;
        this.statusDot = null;
        this.popupContainer = null;
        this.initialize();
    }
    initialize() {
        this.cacheElements();
        this.setupEventListeners();
        this.setInitialStatus();
        this.checkForStoredData();
    }
    cacheElements() {
        this.resultDiv = document.getElementById("result");
        this.statusDot = document.getElementById("status-dot");
        this.popupContainer = document.getElementById("popup-container");
    }
    setupEventListeners() {
        document.addEventListener("DOMContentLoaded", () => this.onDOMContentLoaded());
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => this.handlePopupMessage(message, sender, sendResponse));
        // Listen for storage changes to get real-time updates
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === "local" && changes.truthlens_popup_data) {
                const data = changes.truthlens_popup_data.newValue;
                if (data) {
                    this.handlePopupMessage(data, {}, () => { });
                }
            }
        });
    }
    onDOMContentLoaded() {
        this.setInitialStatus();
        this.setupThemeToggle();
        this.checkForStoredData();
    }
    async checkForStoredData() {
        try {
            const result = await chrome.storage.local.get("truthlens_popup_data");
            if (result.truthlens_popup_data) {
                const data = result.truthlens_popup_data;
                // Only process recent data (within 30 seconds)
                if (Date.now() - data.timestamp < 30000) {
                    this.handlePopupMessage(data, {}, () => { });
                    // Clear the data after processing
                    await chrome.storage.local.remove("truthlens_popup_data");
                }
            }
        }
        catch (error) {
            console.error("TruthLens: Failed to check stored data:", error);
        }
    }
    setInitialStatus() {
        if (this.statusDot) {
            this.updateStatusDot("var(--accent-color)");
        }
    }
    setupThemeToggle() {
        const header = document.querySelector(".header");
        if (header) {
            header.addEventListener("click", () => this.cycleTheme());
        }
    }
    cycleTheme() {
        const currentColor = getComputedStyle(document.documentElement)
            .getPropertyValue("--primary-color")
            .trim();
        const currentIndex = this.THEME_COLORS.indexOf(currentColor);
        const nextColor = this.THEME_COLORS[(currentIndex + 1) % this.THEME_COLORS.length];
        this.setThemeColor(nextColor);
    }
    setThemeColor(color) {
        document.documentElement.style.setProperty("--primary-color", color);
        document.documentElement.style.setProperty("--primary-hover", color);
    }
    updateStatusDot(color) {
        if (this.statusDot) {
            this.statusDot.style.background = color;
        }
    }
    updateLoadingState(isLoading) {
        if (this.popupContainer) {
            this.popupContainer.classList.toggle("popup-loading", isLoading);
        }
    }
    validateElements() {
        return Boolean(this.resultDiv && this.statusDot && this.popupContainer);
    }
    handlePopupMessage(message, _, __) {
        if (message.action !== "showPopup" || !this.validateElements()) {
            return;
        }
        if (message.loading) {
            this.handleLoadingState();
        }
        else if (message.error) {
            this.handleErrorState(message.error);
        }
        else if (message.result) {
            this.handleSuccessState(message.result, message.message);
        }
    }
    handleLoadingState() {
        this.updateStatusDot("var(--warning-color)");
        this.updateLoadingState(true);
        this.showLoadingState();
    }
    handleErrorState(error) {
        this.updateLoadingState(false);
        this.updateStatusDot("var(--error-color)");
        this.showErrorState(error);
    }
    handleSuccessState(result, message) {
        this.updateLoadingState(false);
        const statusColor = result.isSafe
            ? "var(--accent-color)"
            : "var(--error-color)";
        this.updateStatusDot(statusColor);
        const successMessage = message || this.DEFAULT_SUCCESS_MESSAGE;
        this.showSuccessMessage(successMessage);
    }
    showLoadingState() {
        if (!this.resultDiv)
            return;
        console.log("Showing loading state in popup");
        this.resultDiv.innerHTML = this.createLoadingHTML();
    }
    createLoadingHTML() {
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
    showSuccessMessage(message) {
        if (!this.resultDiv)
            return;
        console.log("Showing success message in popup:", message);
        this.resultDiv.innerHTML = this.createSuccessHTML(message);
    }
    createSuccessHTML(message) {
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
    showErrorState(error) {
        if (!this.resultDiv)
            return;
        console.log("Showing error state in popup", error);
        this.resultDiv.innerHTML = this.createErrorHTML(error);
    }
    createErrorHTML(error) {
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
    escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }
    getVerificationStatus(label) {
        const lowerLabel = label.toLowerCase();
        if (lowerLabel.includes("true") ||
            lowerLabel.includes("verified") ||
            lowerLabel.includes("accurate")) {
            return "verified";
        }
        if (lowerLabel.includes("false") ||
            lowerLabel.includes("misleading") ||
            lowerLabel.includes("incorrect")) {
            return "false";
        }
        return "warning";
    }
    getSafetyDescription(isSafe) {
        return isSafe
            ? "This content appears to be safe and trustworthy based on our analysis."
            : "This content may contain misleading or false information. Please verify from additional sources.";
    }
    createResultCard(title, label, content, status) {
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
    showResults(result) {
        if (!this.resultDiv)
            return;
        this.resultDiv.innerHTML = "";
        const verificationCard = this.createResultCard("Verification Result", result.label, result.response, this.getVerificationStatus(result.label));
        this.resultDiv.appendChild(verificationCard);
        const safetyCard = this.createResultCard("Safety Assessment", result.isSafe ? "Safe" : "Potentially Unsafe", this.getSafetyDescription(result.isSafe), result.isSafe ? "verified" : "warning");
        this.resultDiv.appendChild(safetyCard);
        if (result.archive && result.archive !== "None") {
            const archiveCard = this.createResultCard("Archive Information", "Available", result.archive, "verified");
            this.resultDiv.appendChild(archiveCard);
        }
    }
}
new TruthLensPopup();
//# sourceMappingURL=popup.js.map