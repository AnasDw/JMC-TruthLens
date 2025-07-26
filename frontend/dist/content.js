"use strict";
/// <reference types="chrome"/>
let highlightedElements = [];
/**
 * Inject the CSS styles for TruthLens loading animations
 */
function injectLoadingStyles() {
    if (!document.getElementById("truthlens-styles")) {
        const link = document.createElement("link");
        link.id = "truthlens-styles";
        link.rel = "stylesheet";
        link.href = chrome.runtime.getURL("css/content.css");
        document.head.appendChild(link);
    }
}
/**
 * Set loading cursor for the entire document
 */
function setLoadingCursor() {
    document.body.classList.add("truthlens-loading");
}
/**
 * Remove loading cursor from the document
 */
function removeLoadingCursor() {
    document.body.classList.remove("truthlens-loading");
}
/**
 * Highlight the selected text on the page with verification styling
 */
function highlightSelectedText(selectedText) {
    try {
        removeTextHighlighting();
        if (!selectedText || selectedText.trim().length === 0)
            return;
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
            acceptNode: function (node) {
                const parent = node.parentElement;
                if (parent &&
                    (parent.tagName === "SCRIPT" || parent.tagName === "STYLE")) {
                    return NodeFilter.FILTER_REJECT;
                }
                return node.textContent && node.textContent.trim().length > 0
                    ? NodeFilter.FILTER_ACCEPT
                    : NodeFilter.FILTER_REJECT;
            },
        });
        const textNodes = [];
        let node;
        while ((node = walker.nextNode())) {
            textNodes.push(node);
        }
        // Look for the selected text in text nodes
        const searchText = selectedText.trim();
        for (const textNode of textNodes) {
            const textContent = textNode.textContent;
            if (!textContent)
                continue;
            const index = textContent.toLowerCase().indexOf(searchText.toLowerCase());
            if (index !== -1) {
                // Create highlight span
                const range = document.createRange();
                range.setStart(textNode, index);
                range.setEnd(textNode, index + searchText.length);
                const highlightSpan = document.createElement("span");
                highlightSpan.className = "truthlens-highlight";
                highlightSpan.style.cssText = `
                    background: linear-gradient(120deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%) !important;
                    border-radius: 3px !important;
                    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2) !important;
                    animation: truthlens-highlight-pulse 2s ease-in-out infinite !important;
                    position: relative !important;
                    padding: 1px 2px !important;
                `;
                try {
                    range.surroundContents(highlightSpan);
                    // Add a small verification badge
                    const badge = document.createElement("span");
                    badge.className = "truthlens-verification-badge";
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
                    highlightSpan.appendChild(badge);
                    highlightedElements.push(highlightSpan);
                    break; // Only highlight the first occurrence
                }
                catch (e) {
                    // If surroundContents fails, try a different approach
                    console.warn("TruthLens: Could not highlight text directly, using fallback method");
                }
            }
        }
    }
    catch (error) {
        console.warn("TruthLens: Error highlighting text:", error);
    }
}
/**
 * Show the verification result with colored highlighting and contextual badges
 */
function showVerificationResult(result) {
    try {
        highlightedElements.forEach((element) => {
            if (element && element.parentNode) {
                const badge = element.querySelector(".truthlens-verification-badge");
                if (badge) {
                    badge.remove();
                }
                const isTrue = result.label.toLowerCase().includes("true") ||
                    result.label.toLowerCase().includes("verified") ||
                    result.label.toLowerCase().includes("accurate");
                const isFalse = result.label.toLowerCase().includes("false") ||
                    result.label.toLowerCase().includes("misleading") ||
                    result.label.toLowerCase().includes("incorrect");
                // Change highlight color based on verification result
                if (isTrue) {
                    element.style.background =
                        "linear-gradient(120deg, rgba(16, 185, 129, 0.3) 0%, rgba(34, 197, 94, 0.3) 100%)";
                    element.style.boxShadow = "0 0 0 2px rgba(16, 185, 129, 0.4)";
                }
                else if (isFalse) {
                    element.style.background =
                        "linear-gradient(120deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.3) 100%)";
                    element.style.boxShadow = "0 0 0 2px rgba(239, 68, 68, 0.4)";
                }
                else {
                    element.style.background =
                        "linear-gradient(120deg, rgba(245, 158, 11, 0.3) 0%, rgba(217, 119, 6, 0.3) 100%)";
                    element.style.boxShadow = "0 0 0 2px rgba(245, 158, 11, 0.4)";
                }
                console.log("TruthLens: Highlight updated with result:");
                // Remove the pulsing animation
                element.style.animation = "none";
                // Create a result tooltip/badge
                const resultBadge = document.createElement("div");
                resultBadge.className = "truthlens-result-badge";
                resultBadge.innerHTML = `
                    <div class="result-icon">${isTrue ? "✅" : isFalse ? "❌" : "⚠️"}</div>
                    <div class="result-text">${result.label}</div>
                    <div class="result-details">
                        <div class="result-response">${result.response}</div>
                        ${result.references
                    ? `<div class="result-sources">Sources: ${result.references}</div>`
                    : ""}
                    </div>
                `;
                resultBadge.style.cssText = `
                    position: absolute !important;
                    top: -10px !important;
                    left: 50% !important;
                    transform: translateX(-50%) !important;
                    background: white !important;
                    border: 2px solid ${isTrue ? "#10b981" : isFalse ? "#ef4444" : "#f59e0b"} !important;
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
                element.appendChild(resultBadge);
                // Add click handler to show/hide details
                let detailsVisible = false;
                const details = resultBadge.querySelector(".result-details");
                if (details) {
                    details.style.display = "none";
                }
                resultBadge.addEventListener("click", (e) => {
                    e.stopPropagation();
                    detailsVisible = !detailsVisible;
                    if (details) {
                        details.style.display = detailsVisible ? "block" : "none";
                    }
                    resultBadge.style.maxWidth = detailsVisible ? "400px" : "300px";
                });
                // Auto-hide after 10 seconds
                // setTimeout(() => {
                //   if (resultBadge && resultBadge.parentNode) {
                //     resultBadge.style.animation =
                //       "truthlens-result-fade 0.3s ease-out forwards";
                //     setTimeout(() => {
                //       if (resultBadge && resultBadge.parentNode) {
                //         resultBadge.remove();
                //       }
                //     }, 300);
                //   }
                // }, 10000);
            }
        });
    }
    catch (error) {
        console.warn("TruthLens: Error showing verification result:", error);
    }
}
/**
 * Remove all text highlighting and badges from the page
 */
function removeTextHighlighting() {
    highlightedElements.forEach((element) => {
        try {
            const parent = element.parentNode;
            if (parent) {
                // Remove the text content and put it back in the parent
                while (element.firstChild) {
                    if (element.firstChild.className ===
                        "truthlens-verification-badge") {
                        // Remove the badge
                        element.removeChild(element.firstChild);
                    }
                    else {
                        // Move text nodes back to parent
                        parent.insertBefore(element.firstChild, element);
                    }
                }
                // Remove the now-empty highlight span
                parent.removeChild(element);
                parent.normalize(); // Merge adjacent text nodes
            }
        }
        catch (e) {
            console.warn("TruthLens: Error removing highlight:", e);
        }
    });
    // Also remove any highlights that might have been added by class
    const existingHighlights = document.querySelectorAll(".truthlens-highlight");
    existingHighlights.forEach((element) => {
        try {
            const parent = element.parentNode;
            if (parent) {
                while (element.firstChild) {
                    if (element.firstChild.className ===
                        "truthlens-verification-badge") {
                        element.removeChild(element.firstChild);
                    }
                    else {
                        parent.insertBefore(element.firstChild, element);
                    }
                }
                parent.removeChild(element);
                parent.normalize();
            }
        }
        catch (e) {
            console.warn("TruthLens: Error removing existing highlight:", e);
        }
    });
    // Remove any orphaned badges
    const orphanedBadges = document.querySelectorAll(".truthlens-verification-badge");
    orphanedBadges.forEach((badge) => {
        try {
            if (badge.parentNode) {
                badge.parentNode.removeChild(badge);
            }
        }
        catch (e) {
            console.warn("TruthLens: Error removing orphaned badge:", e);
        }
    });
    // Clear the highlighted elements array
    highlightedElements = [];
}
// Initialize styles when the content script loads
injectLoadingStyles();
// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "ping") {
        sendResponse({ status: "ready" });
        return true;
    }
    else if (request.action === "verificationStarted" &&
        request.selectedText) {
        console.log("TruthLens: Verification started for text:", request.selectedText);
        setLoadingCursor();
        highlightSelectedText(request.selectedText);
        return false;
    }
    else if (request.action === "verificationComplete" && request.result) {
        removeLoadingCursor();
        showVerificationResult(request.result);
        return false;
    }
    return false;
});
//# sourceMappingURL=content.js.map