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
        // Use setAttribute to ensure styles are applied
        span.setAttribute("style", `
      background: linear-gradient(120deg, rgba(99, 102, 241, 0.8) 0%, rgba(139, 92, 246, 0.8) 100%) !important;
      border-radius: 4px !important;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.4) !important;
      animation: truthlens-highlight-pulse 2s ease-in-out infinite !important;
      position: relative !important;
      padding: 2px 4px !important;
      color: white !important;
      font-weight: 500 !important;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
      display: inline !important;
      z-index: 999999 !important;
    `
            .replace(/\s+/g, " ")
            .trim());
        // Also set via style.cssText as backup
        span.style.cssText = `
      background: linear-gradient(120deg, rgba(99, 102, 241, 0.8) 0%, rgba(139, 92, 246, 0.8) 100%) !important;
      border-radius: 4px !important;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.4) !important;
      animation: truthlens-highlight-pulse 2s ease-in-out infinite !important;
      position: relative !important;
      padding: 2px 4px !important;
      color: white !important;
      font-weight: 500 !important;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
      display: inline !important;
      z-index: 999999 !important;
    `;
        // Add an immediate visual indicator for debugging
        span.style.setProperty("background-color", "#6366f1", "important");
        span.style.setProperty("color", "white", "important");
        span.style.setProperty("padding", "2px 4px", "important");
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
        console.log("TruthLens: Searching for text:", searchText);
        // Try to find the text using a more sophisticated approach
        if (this.highlightTextAcrossElements(searchText)) {
            console.log("TruthLens: Successfully highlighted text across elements");
            return;
        }
        // Fallback: Try the original single-node approach
        this.highlightTextInSingleNode(searchText);
    }
    highlightTextAcrossElements(searchText) {
        // Get all text content from the page
        const pageText = document.body.innerText || document.body.textContent || "";
        const normalizedPageText = pageText.toLowerCase().replace(/\s+/g, " ");
        const normalizedSearchText = searchText.toLowerCase().replace(/\s+/g, " ");
        console.log("TruthLens: Page text length:", pageText.length);
        console.log("TruthLens: Searching for normalized text:", normalizedSearchText);
        const index = normalizedPageText.indexOf(normalizedSearchText);
        if (index === -1) {
            console.log("TruthLens: Text not found in page content");
            return false;
        }
        console.log("TruthLens: Found text at normalized index:", index);
        // Try both approaches: individual nodes and cross-element
        const individualNodeResult = this.createHighlightFromTextWalker(searchText);
        if (individualNodeResult) {
            return true;
        }
        // If individual node approach failed, try cross-element approach
        return this.createCrossElementHighlight(searchText);
    }
    createCrossElementHighlight(searchText) {
        console.log("TruthLens: Attempting cross-element highlighting");
        // Build a map of all text content with positions
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
        // Build complete text and track positions - use same normalization as page text
        let completeText = "";
        let normalizedCompleteText = "";
        const nodeMap = [];
        for (const textNode of textNodes) {
            const nodeText = textNode.textContent || "";
            const normalizedNodeText = nodeText.replace(/\s+/g, " ").trim();
            if (normalizedNodeText) {
                const startPos = completeText.length;
                const normalizedStartPos = normalizedCompleteText.length;
                // Add space only if we're not at the beginning and the previous text doesn't end with space
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
        console.log("TruthLens: Built complete text of length:", completeText.length);
        console.log("TruthLens: Normalized complete text length:", normalizedCompleteText.length);
        // Find the search text using the same normalization as the page check
        const normalizedSearch = searchText
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
        const normalizedCompleteTextLower = normalizedCompleteText.toLowerCase();
        console.log("TruthLens: Searching in normalized text for:", normalizedSearch);
        console.log("TruthLens: First 500 chars of normalized text:", normalizedCompleteTextLower.slice(0, 500));
        const searchStart = normalizedCompleteTextLower.indexOf(normalizedSearch);
        if (searchStart === -1) {
            console.log("TruthLens: Search text not found in normalized complete text");
            // Try a more flexible approach - split search text and look for fragments
            return this.tryFragmentedHighlight(searchText, textNodes);
        }
        const searchEnd = searchStart + normalizedSearch.length;
        console.log("TruthLens: Found cross-element text at normalized positions:", searchStart, "to", searchEnd);
        // Find all nodes that contain part of the search text in normalized space
        const affectedNodes = nodeMap.filter((nodeInfo) => nodeInfo.normalizedStartPos < searchEnd &&
            nodeInfo.normalizedEndPos > searchStart);
        console.log("TruthLens: Cross-element affected nodes:", affectedNodes.length);
        if (affectedNodes.length === 0) {
            return false;
        }
        // Highlight the relevant parts in each affected node
        let badgeCreated = false;
        let totalHighlights = 0;
        let firstHighlightSpan = null;
        for (const nodeInfo of affectedNodes) {
            // Calculate the portion of this node that should be highlighted in normalized space
            const normalizedNodeStart = Math.max(0, searchStart - nodeInfo.normalizedStartPos);
            const normalizedNodeEnd = Math.min(nodeInfo.normalizedText.length, searchEnd - nodeInfo.normalizedStartPos);
            if (normalizedNodeStart >= 0 &&
                normalizedNodeEnd <= nodeInfo.normalizedText.length &&
                normalizedNodeStart < normalizedNodeEnd) {
                // Map back to original text positions (approximately)
                const originalText = nodeInfo.text;
                const normalizedText = nodeInfo.normalizedText;
                // Find the corresponding positions in the original text
                let originalStart = 0;
                let originalEnd = originalText.length;
                // Simple mapping - this could be improved but works for most cases
                if (normalizedNodeStart > 0) {
                    originalStart = Math.floor((normalizedNodeStart / normalizedText.length) * originalText.length);
                }
                if (normalizedNodeEnd < normalizedText.length) {
                    originalEnd = Math.ceil((normalizedNodeEnd / normalizedText.length) * originalText.length);
                }
                // Ensure we don't exceed bounds
                originalStart = Math.max(0, Math.min(originalStart, originalText.length));
                originalEnd = Math.max(originalStart, Math.min(originalEnd, originalText.length));
                console.log(`TruthLens: Highlighting in node from ${originalStart} to ${originalEnd}:`, originalText.slice(originalStart, originalEnd));
                try {
                    const range = document.createRange();
                    range.setStart(nodeInfo.node, originalStart);
                    range.setEnd(nodeInfo.node, originalEnd);
                    const highlightSpan = this.createHighlightSpan();
                    range.surroundContents(highlightSpan);
                    // Store the first highlight span for badge placement
                    if (!firstHighlightSpan) {
                        firstHighlightSpan = highlightSpan;
                    }
                    this.highlightedElements.push(highlightSpan);
                    totalHighlights++;
                    console.log("TruthLens: Successfully highlighted cross-element portion");
                }
                catch (error) {
                    console.warn("TruthLens: Could not highlight cross-element portion:", error);
                }
            }
        }
        // Add verification badge only once to the first highlight span
        if (firstHighlightSpan && !badgeCreated) {
            const badge = this.createVerificationBadge();
            firstHighlightSpan.appendChild(badge);
            badgeCreated = true;
            console.log("TruthLens: Added verification badge to first highlight span");
        }
        console.log(`TruthLens: Cross-element highlights created: ${totalHighlights}`);
        return totalHighlights > 0;
    }
    tryFragmentedHighlight(searchText, textNodes) {
        console.log("TruthLens: Trying fragmented highlighting approach");
        // Split the search text into meaningful chunks
        const words = searchText
            .toLowerCase()
            .split(/\s+/)
            .filter((word) => word.length > 3); // Only use words longer than 3 chars
        const minWordsToMatch = Math.max(2, Math.floor(words.length * 0.3)); // Match at least 30% of words
        console.log("TruthLens: Looking for fragments:", words.slice(0, 5)); // Log first 5 words
        let badgeCreated = false;
        let totalHighlights = 0;
        let firstHighlightSpan = null;
        for (const textNode of textNodes) {
            const textContent = (textNode.textContent || "").toLowerCase();
            // Count how many of our search words appear in this node
            const matchingWords = words.filter((word) => textContent.includes(word));
            if (matchingWords.length >= minWordsToMatch) {
                console.log(`TruthLens: Found ${matchingWords.length} matching words in node:`, textNode.parentElement);
                // Highlight the entire text node content
                try {
                    const range = document.createRange();
                    range.selectNodeContents(textNode);
                    const highlightSpan = this.createHighlightSpan();
                    range.surroundContents(highlightSpan);
                    // Store the first highlight span for badge placement
                    if (!firstHighlightSpan) {
                        firstHighlightSpan = highlightSpan;
                    }
                    this.highlightedElements.push(highlightSpan);
                    totalHighlights++;
                    console.log("TruthLens: Successfully highlighted fragment");
                }
                catch (error) {
                    console.warn("TruthLens: Could not highlight fragment:", error);
                }
            }
        }
        // Add verification badge only once to the first highlight span
        if (firstHighlightSpan && !badgeCreated) {
            const badge = this.createVerificationBadge();
            firstHighlightSpan.appendChild(badge);
            badgeCreated = true;
            console.log("TruthLens: Added verification badge to first fragment highlight");
        }
        console.log(`TruthLens: Fragmented highlights created: ${totalHighlights}`);
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
        console.log("TruthLens: Text nodes found:", textNodes.length);
        // Find ALL instances of the search text in individual text nodes
        let badgeCreated = false;
        let totalHighlights = 0;
        let firstHighlightSpan = null;
        const normalizedSearchText = searchText.toLowerCase();
        for (const textNode of textNodes) {
            const textContent = textNode.textContent || "";
            const normalizedContent = textContent.toLowerCase();
            // Find all occurrences in this text node
            let searchIndex = 0;
            while ((searchIndex = normalizedContent.indexOf(normalizedSearchText, searchIndex)) !== -1) {
                console.log(`TruthLens: Found text "${searchText}" in node:`, textNode.parentElement);
                console.log("TruthLens: Parent element classes:", textNode.parentElement?.className);
                console.log("TruthLens: Parent element tag and attributes:", textNode.parentElement?.outerHTML?.slice(0, 200));
                try {
                    const range = document.createRange();
                    range.setStart(textNode, searchIndex);
                    range.setEnd(textNode, searchIndex + searchText.length);
                    const highlightSpan = this.createHighlightSpan();
                    // Add debug logging
                    console.log("TruthLens: Creating highlight span with text:", range.toString());
                    range.surroundContents(highlightSpan);
                    // Verify the element was added to DOM
                    console.log("TruthLens: Highlight span in DOM:", document.contains(highlightSpan));
                    console.log("TruthLens: Highlight span parent:", highlightSpan.parentElement);
                    // Store the first highlight span for badge placement
                    if (!firstHighlightSpan) {
                        firstHighlightSpan = highlightSpan;
                    }
                    this.highlightedElements.push(highlightSpan);
                    totalHighlights++;
                    console.log("TruthLens: Highlighted text in node at position:", searchIndex);
                    // Move to next potential occurrence (avoid infinite loop)
                    searchIndex += searchText.length;
                }
                catch (error) {
                    console.warn("TruthLens: Could not highlight text in node:", error);
                    // Move past this occurrence and try the next one
                    searchIndex += 1;
                }
            }
        }
        // Add verification badge only once to the first highlight span
        if (firstHighlightSpan && !badgeCreated) {
            const badge = this.createVerificationBadge();
            firstHighlightSpan.appendChild(badge);
            badgeCreated = true;
            console.log("TruthLens: Added verification badge to first highlight span");
        }
        console.log(`TruthLens: Total highlights created: ${totalHighlights}`);
        return totalHighlights > 0;
    }
    highlightTextInSingleNode(searchText) {
        console.log("TruthLens: Trying single-node highlighting");
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
                console.log("TruthLens: Successfully highlighted in single node");
                break;
            }
            catch (error) {
                console.warn("TruthLens: Could not highlight text in single node:", error);
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
        let resultBadgeCreated = false;
        this.highlightedElements.forEach((element, index) => {
            // Remove any existing badges
            const badge = element.querySelector(`.${this.BADGE_CLASS}`);
            badge?.remove();
            const existingResultBadge = element.querySelector(`.${this.RESULT_BADGE_CLASS}`);
            existingResultBadge?.remove();
            // Update the visual style for all elements
            element.style.background = colors.background;
            element.style.boxShadow = colors.boxShadow;
            element.style.animation = "none";
            // Add result badge only to the first element
            if (index === 0 && !resultBadgeCreated) {
                const resultBadge = this.createResultBadge(result);
                element.appendChild(resultBadge);
                resultBadgeCreated = true;
                console.log("TruthLens: Added result badge to first highlighted element");
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