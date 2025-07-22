function handlePopupMessage(message, sender, sendResponse) {
    const resultDiv = document.getElementById('result');
    const statusDot = document.getElementById('status-dot');
    
    if (message.action === "showPopup") {
        console.log("Received message in popup:", message);
        
        // Handle loading state
        if (message.loading) {
            statusDot.style.background = 'var(--warning-color)';
            showLoadingState(resultDiv);
            return;
        }
        
        // Handle results
        if (message.error) {
            showErrorState(resultDiv, message.error);
            statusDot.style.background = 'var(--error-color)';
        } else if (message.result) {
            showResults(resultDiv, message.result);
            statusDot.style.background = message.result.isSafe ? 'var(--accent-color)' : 'var(--error-color)';
        }
    }
}

function showLoadingState(container) {
    console.log("Showing loading state in popup");
    
    container.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
        </div>
        <div style="text-align: center; margin-top: 16px;">
            <h3 style="color: var(--text-secondary); font-size: var(--font-size-base); font-weight: 500;">
                Analyzing content...
            </h3>
        </div>
    `;
}

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

function showResults(container, result) {
    console.log("Showing results in popup", result);
    
    // Create the main verification result card
    const verificationCard = createResultCard(
        'Verification Result',
        result.label,
        result.response,
        getVerificationStatus(result.label)
    );
    
    container.appendChild(verificationCard);
    
    // Create safety assessment card
    const safetyCard = createResultCard(
        'Safety Assessment',
        result.isSafe ? 'Safe' : 'Potentially Unsafe',
        getSafetyDescription(result.isSafe),
        result.isSafe ? 'verified' : 'warning'
    );
    
    container.appendChild(safetyCard);
    
    // Add archive information if available
    if (result.archive && result.archive !== "None") {
        const archiveCard = createResultCard(
            'Archive Information',
            'Available',
            result.archive,
            'verified'
        );
        container.appendChild(archiveCard);
    }
    
    // Add references if available
    if (result.references && result.references.trim() !== '') {
        const referencesCard = createResultCard(
            'References',
            'Sources Found',
            result.references,
            'verified'
        );
        container.appendChild(referencesCard);
    }
}

function createResultCard(title, label, content, status) {
    const card = document.createElement('div');
    card.className = 'result-card';
    
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

function getVerificationStatus(label) {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('true') || lowerLabel.includes('verified') || lowerLabel.includes('accurate')) {
        return 'verified';
    } else if (lowerLabel.includes('false') || lowerLabel.includes('misleading') || lowerLabel.includes('incorrect')) {
        return 'false';
    } else {
        return 'warning';
    }
}

function getSafetyDescription(isSafe) {
    return isSafe 
        ? 'This content appears to be safe and trustworthy based on our analysis.'
        : 'This content may contain misleading or false information. Please verify from additional sources.';
}

// Initialize the popup
document.addEventListener('DOMContentLoaded', function() {
    // Set initial status
    const statusDot = document.getElementById('status-dot');
    statusDot.style.background = 'var(--accent-color)';
    
    // Add some interactive effects
    const header = document.querySelector('.header');
    if (header) {
        header.addEventListener('click', function() {
            // Easter egg: clicking the header cycles through color themes
            const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
            const currentColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
            const currentIndex = colors.indexOf(currentColor);
            const nextColor = colors[(currentIndex + 1) % colors.length];
            
            document.documentElement.style.setProperty('--primary-color', nextColor);
            document.documentElement.style.setProperty('--primary-hover', nextColor);
        });
    }
});

chrome.runtime.onMessage.addListener(handlePopupMessage);
