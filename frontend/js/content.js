let highlightedElements = [];

function injectLoadingStyles() {
    if (!document.getElementById('truthlens-styles')) {
        const link = document.createElement('link');
        link.id = 'truthlens-styles';
        link.rel = 'stylesheet';
        link.href = chrome.runtime.getURL('css/content.css');
        document.head.appendChild(link);
    }
}

function setLoadingCursor() {
    document.body.classList.add('truthlens-loading');
}

function removeLoadingCursor() {
    document.body.classList.remove('truthlens-loading');
}

function highlightSelectedText(selectedText) {
    try {                
        removeTextHighlighting();
        
        if (!selectedText || selectedText.trim().length === 0) return;
        
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    const parent = node.parentElement;
                    if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return node.textContent.trim().length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                }
            }
        );
        
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        
        // Look for the selected text in text nodes
        const searchText = selectedText.trim();
        for (const textNode of textNodes) {
            const textContent = textNode.textContent;
            const index = textContent.toLowerCase().indexOf(searchText.toLowerCase());
            
            if (index !== -1) {
                // Create highlight span
                const range = document.createRange();
                range.setStart(textNode, index);
                range.setEnd(textNode, index + searchText.length);
                
                const highlightSpan = document.createElement('span');
                highlightSpan.className = 'truthlens-highlight';
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
                    const badge = document.createElement('span');
                    badge.className = 'truthlens-verification-badge';
                    badge.innerHTML = '🔍';
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
                } catch (e) {
                    // If surroundContents fails, try a different approach
                    console.warn('TruthLens: Could not highlight text directly, using fallback method');
                }
            }
        }
    } catch (error) {
        console.warn('TruthLens: Error highlighting text:', error);
    }
}

function removeTextHighlighting() {
    highlightedElements.forEach(element => {
        try {
            const parent = element.parentNode;
            if (parent) {
                // Remove the text content and put it back in the parent
                while (element.firstChild) {
                    if (element.firstChild.className === 'truthlens-verification-badge') {
                        // Remove the badge
                        element.removeChild(element.firstChild);
                    } else {
                        // Move text nodes back to parent
                        parent.insertBefore(element.firstChild, element);
                    }
                }
                // Remove the now-empty highlight span
                parent.removeChild(element);
                parent.normalize(); // Merge adjacent text nodes
            }
        } catch (e) {
            console.warn('TruthLens: Error removing highlight:', e);
        }
    });
    
    // Also remove any highlights that might have been added by class
    const existingHighlights = document.querySelectorAll('.truthlens-highlight');
    existingHighlights.forEach(element => {
        try {
            const parent = element.parentNode;
            if (parent) {
                while (element.firstChild) {
                    if (element.firstChild.className === 'truthlens-verification-badge') {
                        element.removeChild(element.firstChild);
                    } else {
                        parent.insertBefore(element.firstChild, element);
                    }
                }
                parent.removeChild(element);
                parent.normalize();
            }
        } catch (e) {
            console.warn('TruthLens: Error removing existing highlight:', e);
        }
    });
    
    // Remove any orphaned badges
    const orphanedBadges = document.querySelectorAll('.truthlens-verification-badge');
    orphanedBadges.forEach(badge => {
        try {
            if (badge.parentNode) {
                badge.parentNode.removeChild(badge);
            }
        } catch (e) {
            console.warn('TruthLens: Error removing orphaned badge:', e);
        }
    });
}

injectLoadingStyles();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "ping") {
        sendResponse({ status: "ready" });
        return true;
    } else if (request.action === "setHighlightSelectedText") {
        console.log("TruthLens: Highlighting selected text:", request.selectedText);
        highlightSelectedText(request.selectedText);
    } else if (request.action === "setLoadingCursor") {        
        setLoadingCursor();
    } else if (request.action === "removeLoadingCursor") {
        removeLoadingCursor();
    } else if (request.action === "removeHighlightSelectedText") {
        removeTextHighlighting();
    } else if (request.action === "verificationComplete") {
        removeLoadingCursor();
        // removeTextHighlighting();
    }
});
