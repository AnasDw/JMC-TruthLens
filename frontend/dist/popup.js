/**
 * Handle messages sent to the popup from the background script
 */
function handlePopupMessage(message, _, __) {
    if (message.action !== "showPopup")
        return;
    const resultDiv = document.getElementById("result");
    const statusDot = document.getElementById("status-dot");
    const popupContainer = document.getElementById("popup-container");
    if (!resultDiv || !statusDot || !popupContainer)
        return;
    if (message.loading) {
        statusDot.style.background = "var(--warning-color)";
        popupContainer.classList.add("popup-loading");
        showLoadingState(resultDiv);
        return;
    }
    popupContainer.classList.remove("popup-loading");
    if (message.error) {
        showErrorState(resultDiv, message.error);
        statusDot.style.background = "var(--error-color)";
    }
    else if (message.result) {
        showSuccessMessage(resultDiv, message.message || "Verification complete!");
        statusDot.style.background = message.result.isSafe
            ? "var(--accent-color)"
            : "var(--error-color)";
    }
}
/**
 * Show loading state with spinner and message
 */
function showLoadingState(container) {
    console.log("Showing loading state in popup");
    container.innerHTML = `
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
/**
 * Show success message with verification completion hint
 */
function showSuccessMessage(container, message) {
    console.log("Showing success message in popup:", message);
    container.innerHTML = `
        <div class="success-message">
            <div class="success-icon">✨</div>
            <h3>Success!</h3>
            <p>${message}</p>
            <div class="success-hint">
                💡 Look for the colored highlight on the webpage for detailed verification results
            </div>
        </div>
    `;
}
/**
 * Show error state with error message
 */
function showErrorState(container, error) {
    console.log("Showing error state in popup", error);
    container.innerHTML = `
        <div class="result-card">
            <div class="result-header">
                <span class="result-label false">Error</span>
            </div>
            <div class="result-content">
                <strong>Something went wrong:</strong><br>
                ${error}
            </div>
        </div>
    `;
}
/**
 * Show full verification results (legacy function, not currently used)
 */
function showResults(container, result) {
    const verificationCard = createResultCard("Verification Result", result.label, result.response, getVerificationStatus(result.label));
    container.appendChild(verificationCard);
    const safetyCard = createResultCard("Safety Assessment", result.isSafe ? "Safe" : "Potentially Unsafe", getSafetyDescription(result.isSafe), result.isSafe ? "verified" : "warning");
    container.appendChild(safetyCard);
    if (result.archive && result.archive !== "None") {
        const archiveCard = createResultCard("Archive Information", "Available", result.archive, "verified");
        container.appendChild(archiveCard);
    }
}
/**
 * Create a result card element for displaying verification information
 */
function createResultCard(title, label, content, status) {
    const card = document.createElement("div");
    card.className = "result-card";
    card.innerHTML = `
        <div class="result-header">
            <span class="result-label ${status}">${label}</span>
        </div>
        <div class="result-content">
            <strong>${title}:</strong><br>
            ${content}
        </div>
    `;
    return card;
}
/**
 * Determine verification status based on label text
 */
function getVerificationStatus(label) {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes("true") ||
        lowerLabel.includes("verified") ||
        lowerLabel.includes("accurate")) {
        return "verified";
    }
    else if (lowerLabel.includes("false") ||
        lowerLabel.includes("misleading") ||
        lowerLabel.includes("incorrect")) {
        return "false";
    }
    else {
        return "warning";
    }
}
/**
 * Get safety description based on safety status
 */
function getSafetyDescription(isSafe) {
    return isSafe
        ? "This content appears to be safe and trustworthy based on our analysis."
        : "This content may contain misleading or false information. Please verify from additional sources.";
}
// Initialize popup when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
    // Set initial status
    const statusDot = document.getElementById("status-dot");
    if (statusDot) {
        statusDot.style.background = "var(--accent-color)";
    }
    // Add some interactive effects
    const header = document.querySelector(".header");
    if (header) {
        header.addEventListener("click", function () {
            // Easter egg: clicking the header cycles through color themes
            const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
            const currentColor = getComputedStyle(document.documentElement)
                .getPropertyValue("--primary-color")
                .trim();
            const currentIndex = colors.indexOf(currentColor);
            const nextColor = colors[(currentIndex + 1) % colors.length];
            document.documentElement.style.setProperty("--primary-color", nextColor);
            document.documentElement.style.setProperty("--primary-hover", nextColor);
        });
    }
});
// Listen for messages from the background script
chrome.runtime.onMessage.addListener(handlePopupMessage);
export {};
//# sourceMappingURL=popup.js.map