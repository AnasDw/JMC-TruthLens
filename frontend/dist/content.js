"use strict";
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
                if (parent?.matches("script, style, noscript, .truthlens-highlight")) {
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
        return span;
    }
    createVerificationBadge() {
        const badge = document.createElement("span");
        badge.className = this.BADGE_CLASS;
        badge.innerHTML = "🔍";
        return badge;
    }
    removeExistingResultBadges() {
        document
            .querySelectorAll(`.${this.RESULT_BADGE_CLASS}`)
            .forEach((badge) => {
            badge.remove();
        });
    }
    highlightSelectedText(selectedText) {
        if (!selectedText?.trim())
            return;
        this.removeTextHighlighting();
        this.removeExistingResultBadges();
        const searchText = selectedText.trim();
        if (this.highlightTextAcrossElements(searchText)) {
            return;
        }
        this.highlightTextInSingleNode(searchText);
    }
    highlightTextAcrossElements(searchText) {
        const pageText = document.body.innerText || document.body.textContent || "";
        const normalizedPageText = pageText.toLowerCase().replace(/\s+/g, " ");
        const normalizedSearchText = searchText.toLowerCase().replace(/\s+/g, " ");
        const index = normalizedPageText.indexOf(normalizedSearchText);
        if (index === -1) {
            return false;
        }
        const individualNodeResult = this.createHighlightFromTextWalker(searchText);
        if (individualNodeResult) {
            return true;
        }
        return this.createCrossElementHighlight(searchText);
    }
    createCrossElementHighlight(searchText) {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) => {
                const parent = node.parentElement;
                if (parent?.matches("script, style, noscript, .truthlens-highlight")) {
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
        let completeText = "";
        let normalizedCompleteText = "";
        const nodeMap = [];
        for (const textNode of textNodes) {
            const nodeText = textNode.textContent || "";
            const normalizedNodeText = nodeText.replace(/\s+/g, " ").trim();
            if (normalizedNodeText) {
                const startPos = completeText.length;
                const normalizedStartPos = normalizedCompleteText.length;
                const needsSpace = completeText.length > 0 &&
                    !completeText.endsWith(" ") &&
                    !normalizedNodeText.startsWith(" ");
                completeText += (needsSpace ? " " : "") + nodeText;
                normalizedCompleteText +=
                    (normalizedCompleteText.length > 0 ? " " : "") + normalizedNodeText;
                const endPos = completeText.length;
                const normalizedEndPos = normalizedCompleteText.length;
                nodeMap.push({
                    node: textNode,
                    startPos,
                    endPos,
                    normalizedStartPos,
                    normalizedEndPos,
                    text: nodeText,
                    normalizedText: normalizedNodeText,
                });
            }
        }
        const normalizedSearch = searchText
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
        const normalizedCompleteTextLower = normalizedCompleteText.toLowerCase();
        const searchStart = normalizedCompleteTextLower.indexOf(normalizedSearch);
        if (searchStart === -1) {
            return this.tryFragmentedHighlight(searchText, textNodes);
        }
        const searchEnd = searchStart + normalizedSearch.length;
        const affectedNodes = nodeMap.filter((nodeInfo) => nodeInfo.normalizedStartPos < searchEnd &&
            nodeInfo.normalizedEndPos > searchStart);
        if (affectedNodes.length === 0) {
            return false;
        }
        let badgeCreated = false;
        let totalHighlights = 0;
        let firstHighlightSpan = null;
        for (const nodeInfo of affectedNodes) {
            const normalizedNodeStart = Math.max(0, searchStart - nodeInfo.normalizedStartPos);
            const normalizedNodeEnd = Math.min(nodeInfo.normalizedText.length, searchEnd - nodeInfo.normalizedStartPos);
            if (normalizedNodeStart >= 0 &&
                normalizedNodeEnd <= nodeInfo.normalizedText.length &&
                normalizedNodeStart < normalizedNodeEnd) {
                const originalText = nodeInfo.text;
                const normalizedText = nodeInfo.normalizedText;
                let originalStart = 0;
                let originalEnd = originalText.length;
                if (normalizedNodeStart > 0) {
                    originalStart = Math.floor((normalizedNodeStart / normalizedText.length) * originalText.length);
                }
                if (normalizedNodeEnd < normalizedText.length) {
                    originalEnd = Math.ceil((normalizedNodeEnd / normalizedText.length) * originalText.length);
                }
                originalStart = Math.max(0, Math.min(originalStart, originalText.length));
                originalEnd = Math.max(originalStart, Math.min(originalEnd, originalText.length));
                try {
                    const range = document.createRange();
                    range.setStart(nodeInfo.node, originalStart);
                    range.setEnd(nodeInfo.node, originalEnd);
                    const highlightSpan = this.createHighlightSpan();
                    range.surroundContents(highlightSpan);
                    if (!firstHighlightSpan) {
                        firstHighlightSpan = highlightSpan;
                    }
                    this.highlightedElements.push(highlightSpan);
                    totalHighlights++;
                }
                catch (error) {
                    // Silently continue on error
                }
            }
        }
        if (firstHighlightSpan && !badgeCreated) {
            const badge = this.createVerificationBadge();
            firstHighlightSpan.appendChild(badge);
            badgeCreated = true;
        }
        return totalHighlights > 0;
    }
    tryFragmentedHighlight(searchText, textNodes) {
        const words = searchText
            .toLowerCase()
            .split(/\s+/)
            .filter((word) => word.length > 3);
        const minWordsToMatch = Math.max(2, Math.floor(words.length * 0.3));
        let badgeCreated = false;
        let totalHighlights = 0;
        let firstHighlightSpan = null;
        for (const textNode of textNodes) {
            const textContent = (textNode.textContent || "").toLowerCase();
            const matchingWords = words.filter((word) => textContent.includes(word));
            if (matchingWords.length >= minWordsToMatch) {
                try {
                    const range = document.createRange();
                    range.selectNodeContents(textNode);
                    const highlightSpan = this.createHighlightSpan();
                    range.surroundContents(highlightSpan);
                    if (!firstHighlightSpan) {
                        firstHighlightSpan = highlightSpan;
                    }
                    this.highlightedElements.push(highlightSpan);
                    totalHighlights++;
                }
                catch (error) {
                    // Silently continue on error
                }
            }
        }
        if (firstHighlightSpan && !badgeCreated) {
            const badge = this.createVerificationBadge();
            firstHighlightSpan.appendChild(badge);
            badgeCreated = true;
        }
        return totalHighlights > 0;
    }
    createHighlightFromTextWalker(searchText) {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) => {
                const parent = node.parentElement;
                if (parent?.matches("script, style, noscript, .truthlens-highlight")) {
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
        let badgeCreated = false;
        let totalHighlights = 0;
        let firstHighlightSpan = null;
        const normalizedSearchText = searchText.toLowerCase();
        for (const textNode of textNodes) {
            const textContent = textNode.textContent || "";
            const normalizedContent = textContent.toLowerCase();
            let searchIndex = 0;
            while ((searchIndex = normalizedContent.indexOf(normalizedSearchText, searchIndex)) !== -1) {
                try {
                    const range = document.createRange();
                    range.setStart(textNode, searchIndex);
                    range.setEnd(textNode, searchIndex + searchText.length);
                    const highlightSpan = this.createHighlightSpan();
                    range.surroundContents(highlightSpan);
                    if (!firstHighlightSpan) {
                        firstHighlightSpan = highlightSpan;
                    }
                    this.highlightedElements.push(highlightSpan);
                    totalHighlights++;
                    searchIndex += searchText.length;
                }
                catch (error) {
                    searchIndex += 1;
                }
            }
        }
        if (firstHighlightSpan && !badgeCreated) {
            const badge = this.createVerificationBadge();
            firstHighlightSpan.appendChild(badge);
            badgeCreated = true;
        }
        return totalHighlights > 0;
    }
    highlightTextInSingleNode(searchText) {
        const textNodes = this.getTextNodes();
        for (const textNode of textNodes) {
            const textContent = textNode.textContent;
            if (!textContent)
                continue;
            const index = textContent.toLowerCase().indexOf(searchText.toLowerCase());
            if (index === -1)
                continue;
            try {
                const range = document.createRange();
                range.setStart(textNode, index);
                range.setEnd(textNode, index + searchText.length);
                const highlightSpan = this.createHighlightSpan();
                range.surroundContents(highlightSpan);
                const badge = this.createVerificationBadge();
                highlightSpan.appendChild(badge);
                this.highlightedElements.push(highlightSpan);
                break;
            }
            catch (error) {
                // Silently continue on error
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
        // Add base class and result-specific class
        let cssClass = this.RESULT_BADGE_CLASS;
        if (colors.icon === "✅") {
            cssClass += " result-true";
        }
        else if (colors.icon === "❌") {
            cssClass += " result-false";
        }
        else {
            cssClass += " result-warning";
        }
        resultBadge.className = cssClass;
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
        let resultBadgeCreated = false;
        this.highlightedElements.forEach((element, index) => {
            const badge = element.querySelector(`.${this.BADGE_CLASS}`);
            badge?.remove();
            const existingResultBadge = element.querySelector(`.${this.RESULT_BADGE_CLASS}`);
            existingResultBadge?.remove();
            element.style.background = colors.background;
            element.style.boxShadow = colors.boxShadow;
            element.style.animation = "none";
            if (index === 0 && !resultBadgeCreated) {
                const resultBadge = this.createResultBadge(result);
                element.appendChild(resultBadge);
                resultBadgeCreated = true;
            }
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
                // Silently continue on error
            }
        });
        document.querySelectorAll(`.${this.HIGHLIGHT_CLASS}`).forEach((element) => {
            try {
                this.removeElementSafely(element);
            }
            catch (error) {
                // Silently continue on error
            }
        });
        document.querySelectorAll(`.${this.BADGE_CLASS}`).forEach((badge) => {
            badge.remove();
        });
        this.removeExistingResultBadges();
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