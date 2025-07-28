"use strict";
/// <reference types="chrome"/>
class TruthLensContent {
    constructor() {
        this.highlightedElements = [];
        this.stylesInjected = false;
        this.HIGHLIGHT_CLASS = "truthlens-highlight";
        this.BADGE_CLASS = "truthlens-verification-badge";
        this.RESULT_BADGE_CLASS = "truthlens-result-badge";
        this.LOADING_CLASS = "truthlens-loading";
        this.initialize();
    }
    initialize() {
        this.injectLoadingStyles();
        this.setupMessageListener();
    }
    injectLoadingStyles() {
        if (this.stylesInjected || document.getElementById("truthlens-styles"))
            return;
        const link = document.createElement("link");
        link.id = "truthlens-styles";
        link.rel = "stylesheet";
        link.href = chrome.runtime.getURL("css/content.css");
        document.head.appendChild(link);
        this.stylesInjected = true;
    }
    setLoadingCursor() {
        document.body.classList.add(this.LOADING_CLASS);
    }
    removeLoadingCursor() {
        document.body.classList.remove(this.LOADING_CLASS);
    }
    getTextNodes() {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) => {
                const parent = node.parentElement;
                if (parent?.matches("script, style, noscript")) {
                    return NodeFilter.FILTER_REJECT;
                }
                return node.textContent?.trim()
                    ? NodeFilter.FILTER_ACCEPT
                    : NodeFilter.FILTER_REJECT;
            },
        });
        const textNodes = [];
        let node;
        while ((node = walker.nextNode())) {
            textNodes.push(node);
        }
        return textNodes;
    }
    createHighlightSpan() {
        const span = document.createElement("span");
        span.className = this.HIGHLIGHT_CLASS;
        span.style.cssText = `
      background: linear-gradient(120deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%) !important;
      border-radius: 3px !important;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2) !important;
      animation: truthlens-highlight-pulse 2s ease-in-out infinite !important;
      position: relative !important;
      padding: 1px 2px !important;
    `;
        return span;
    }
    createVerificationBadge() {
        const badge = document.createElement("span");
        badge.className = this.BADGE_CLASS;
        badge.innerHTML = "🔍";
        badge.style.cssText = `
      position: absolute !important;
      top: -8px !important;
      right: -8px !important;
      font-size: 12px !important;
      background: #6366f1 !important;
      color: white !important;
      border-radius: 50% !important;
      width: 16px !important;
      height: 16px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 1000000 !important;
      animation: truthlens-badge-spin 2s linear infinite !important;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
    `;
        return badge;
    }
    highlightSelectedText(selectedText) {
        if (!selectedText?.trim())
            return;
        this.removeTextHighlighting();
        const textNodes = this.getTextNodes();
        const searchText = selectedText.trim().toLowerCase();
        for (const textNode of textNodes) {
            const textContent = textNode.textContent;
            if (!textContent)
                continue;
            const index = textContent.toLowerCase().indexOf(searchText);
            if (index === -1)
                continue;
            try {
                const range = document.createRange();
                range.setStart(textNode, index);
                range.setEnd(textNode, index + selectedText.length);
                const highlightSpan = this.createHighlightSpan();
                range.surroundContents(highlightSpan);
                const badge = this.createVerificationBadge();
                highlightSpan.appendChild(badge);
                this.highlightedElements.push(highlightSpan);
                break;
            }
            catch (error) {
                console.warn("TruthLens: Could not highlight text:", error);
            }
        }
    }
    getResultColors(label) {
        const lowerLabel = label.toLowerCase();
        if (lowerLabel.includes("true") ||
            lowerLabel.includes("verified") ||
            lowerLabel.includes("accurate")) {
            return {
                background: "linear-gradient(120deg, rgba(16, 185, 129, 0.3) 0%, rgba(34, 197, 94, 0.3) 100%)",
                boxShadow: "0 0 0 2px rgba(16, 185, 129, 0.4)",
                icon: "✅",
            };
        }
        if (lowerLabel.includes("false") ||
            lowerLabel.includes("misleading") ||
            lowerLabel.includes("incorrect")) {
            return {
                background: "linear-gradient(120deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.3) 100%)",
                boxShadow: "0 0 0 2px rgba(239, 68, 68, 0.4)",
                icon: "❌",
            };
        }
        return {
            background: "linear-gradient(120deg, rgba(245, 158, 11, 0.3) 0%, rgba(217, 119, 6, 0.3) 100%)",
            boxShadow: "0 0 0 2px rgba(245, 158, 11, 0.4)",
            icon: "⚠️",
        };
    }
    createResultBadge(result) {
        const colors = this.getResultColors(result.label);
        const resultBadge = document.createElement("div");
        resultBadge.className = this.RESULT_BADGE_CLASS;
        resultBadge.innerHTML = `
      <div class="result-icon">${colors.icon}</div>
      <div class="result-text">${result.label}</div>
      <div class="result-details">
        <div class="result-response">${result.response}</div>
        ${result.references
            ? `<div class="result-sources">Sources: ${result.references}</div>`
            : ""}
      </div>
    `;
        const borderColor = colors.icon === "✅"
            ? "#10b981"
            : colors.icon === "❌"
                ? "#ef4444"
                : "#f59e0b";
        resultBadge.style.cssText = `
      position: absolute !important;
      top: -10px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      background: white !important;
      border: 2px solid ${borderColor} !important;
      border-radius: 8px !important;
      padding: 8px 12px !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
      z-index: 1000001 !important;
      min-width: 200px !important;
      max-width: 300px !important;
      font-size: 12px !important;
      line-height: 1.3 !important;
      opacity: 1 !important;
      animation: truthlens-result-appear 0.3s ease-out forwards !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    `;
        this.setupResultBadgeInteraction(resultBadge);
        return resultBadge;
    }
    setupResultBadgeInteraction(resultBadge) {
        let detailsVisible = false;
        const details = resultBadge.querySelector(".result-details");
        if (details) {
            details.style.display = "none";
            resultBadge.addEventListener("click", (e) => {
                e.stopPropagation();
                detailsVisible = !detailsVisible;
                details.style.display = detailsVisible ? "block" : "none";
                resultBadge.style.maxWidth = detailsVisible ? "400px" : "300px";
            });
        }
    }
    showVerificationResult(result) {
        const colors = this.getResultColors(result.label);
        this.highlightedElements.forEach((element) => {
            const badge = element.querySelector(`.${this.BADGE_CLASS}`);
            badge?.remove();
            element.style.background = colors.background;
            element.style.boxShadow = colors.boxShadow;
            element.style.animation = "none";
            const resultBadge = this.createResultBadge(result);
            element.appendChild(resultBadge);
        });
    }
    removeElementSafely(element) {
        const parent = element.parentNode;
        if (!parent)
            return;
        while (element.firstChild) {
            if (element.firstChild.classList?.contains(this.BADGE_CLASS)) {
                element.removeChild(element.firstChild);
            }
            else {
                parent.insertBefore(element.firstChild, element);
            }
        }
        parent.removeChild(element);
        parent.normalize();
    }
    removeTextHighlighting() {
        this.highlightedElements.forEach((element) => {
            try {
                this.removeElementSafely(element);
            }
            catch (error) {
                console.warn("TruthLens: Error removing highlight:", error);
            }
        });
        document.querySelectorAll(`.${this.HIGHLIGHT_CLASS}`).forEach((element) => {
            try {
                this.removeElementSafely(element);
            }
            catch (error) {
                console.warn("TruthLens: Error removing existing highlight:", error);
            }
        });
        document.querySelectorAll(`.${this.BADGE_CLASS}`).forEach((badge) => {
            badge.remove();
        });
        this.highlightedElements = [];
    }
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case "ping":
                    sendResponse({ status: "ready" });
                    return true;
                case "verificationStarted":
                    if (request.selectedText) {
                        this.setLoadingCursor();
                        this.highlightSelectedText(request.selectedText);
                    }
                    break;
                case "verificationComplete":
                    if (request.result) {
                        this.removeLoadingCursor();
                        this.showVerificationResult(request.result);
                    }
                    break;
            }
            return false;
        });
    }
}
new TruthLensContent();
//# sourceMappingURL=content.js.map