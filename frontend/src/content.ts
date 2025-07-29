interface VerificationResult {
  label: string;
  response: string;
  isSafe: boolean;
  references?: string;
  archive?: string;
}

type ContentMessageAction =
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
  action: ContentMessageAction;
  selectedText?: string;
  result?: VerificationResult;
  loading?: boolean;
  error?: string;
  message?: string;
}

class TruthLensContent {
  private highlightedElements: HTMLSpanElement[] = [];
  private stylesInjected = false;
  private readonly HIGHLIGHT_CLASS = "truthlens-highlight";
  private readonly BADGE_CLASS = "truthlens-verification-badge";
  private readonly RESULT_BADGE_CLASS = "truthlens-result-badge";
  private readonly LOADING_CLASS = "truthlens-loading";

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.injectLoadingStyles();
    this.setupMessageListener();
    this.injectBootstrap();
  }

  private injectLoadingStyles(): void {
    if (this.stylesInjected || document.getElementById("truthlens-styles"))
      return;

    const link = document.createElement("link");
    link.id = "truthlens-styles";
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("css/content.css");
    document.head.appendChild(link);
    this.stylesInjected = true;
  }

  private injectBootstrap(): void {
    if (document.getElementById("bootstrap-css")) return;

    const bootstrapLink = document.createElement("link");
    bootstrapLink.id = "bootstrap-css";
    bootstrapLink.rel = "stylesheet";
    bootstrapLink.href = chrome.runtime.getURL("css/bootstrap.min.css");
    document.head.appendChild(bootstrapLink);

    const iconsLink = document.createElement("link");
    iconsLink.id = "bootstrap-icons-css";
    iconsLink.rel = "stylesheet";
    iconsLink.href = chrome.runtime.getURL("css/bootstrap-icons.min.css");
    document.head.appendChild(iconsLink);

    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("js/bootstrap.bundle.min.js");
    script.onload = () => {
      console.log("Bootstrap loaded successfully");
    };
    document.body.appendChild(script);
  }

  private setLoadingCursor(): void {
    document.body.classList.add(this.LOADING_CLASS);
  }

  private removeLoadingCursor(): void {
    document.body.classList.remove(this.LOADING_CLASS);
  }

  private getTextNodes(): Text[] {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node: Text): number => {
          const parent = node.parentElement;
          if (
            parent?.matches("script, style, noscript, .truthlens-highlight")
          ) {
            return NodeFilter.FILTER_REJECT;
          }
          return node.textContent?.trim()
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        },
      }
    );

    const textNodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      textNodes.push(node as Text);
    }
    return textNodes;
  }

  private createHighlightSpan(): HTMLSpanElement {
    const span = document.createElement("span");
    span.className = this.HIGHLIGHT_CLASS;
    return span;
  }

  private createVerificationBadge(): HTMLSpanElement {
    const badge = document.createElement("span");
    badge.className = this.BADGE_CLASS;
    badge.innerHTML = "🔍";
    return badge;
  }

  private removeExistingResultBadges(): void {
    document
      .querySelectorAll(`.${this.RESULT_BADGE_CLASS}`)
      .forEach((badge) => {
        badge.remove();
      });
  }

  private highlightSelectedText(selectedText: string): void {
    if (!selectedText?.trim()) return;

    this.removeTextHighlighting();
    this.removeExistingResultBadges();

    const searchText = selectedText.trim();

    if (this.highlightTextAcrossElements(searchText)) {
      return;
    }

    this.highlightTextInSingleNode(searchText);
  }

  private highlightTextAcrossElements(searchText: string): boolean {
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

  private createCrossElementHighlight(searchText: string): boolean {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node: Text): number => {
          const parent = node.parentElement;
          if (
            parent?.matches("script, style, noscript, .truthlens-highlight")
          ) {
            return NodeFilter.FILTER_REJECT;
          }
          return node.textContent?.trim()
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        },
      }
    );

    const textNodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      textNodes.push(node as Text);
    }

    let completeText = "";
    let normalizedCompleteText = "";
    const nodeMap: Array<{
      node: Text;
      startPos: number;
      endPos: number;
      normalizedStartPos: number;
      normalizedEndPos: number;
      text: string;
      normalizedText: string;
    }> = [];

    for (const textNode of textNodes) {
      const nodeText = textNode.textContent || "";
      const normalizedNodeText = nodeText.replace(/\s+/g, " ").trim();

      if (normalizedNodeText) {
        const startPos = completeText.length;
        const normalizedStartPos = normalizedCompleteText.length;

        const needsSpace =
          completeText.length > 0 &&
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

    const affectedNodes = nodeMap.filter(
      (nodeInfo) =>
        nodeInfo.normalizedStartPos < searchEnd &&
        nodeInfo.normalizedEndPos > searchStart
    );

    if (affectedNodes.length === 0) {
      return false;
    }

    let badgeCreated = false;
    let totalHighlights = 0;
    let firstHighlightSpan: HTMLSpanElement | null = null;

    for (const nodeInfo of affectedNodes) {
      const normalizedNodeStart = Math.max(
        0,
        searchStart - nodeInfo.normalizedStartPos
      );
      const normalizedNodeEnd = Math.min(
        nodeInfo.normalizedText.length,
        searchEnd - nodeInfo.normalizedStartPos
      );

      if (
        normalizedNodeStart >= 0 &&
        normalizedNodeEnd <= nodeInfo.normalizedText.length &&
        normalizedNodeStart < normalizedNodeEnd
      ) {
        const originalText = nodeInfo.text;
        const normalizedText = nodeInfo.normalizedText;

        let originalStart = 0;
        let originalEnd = originalText.length;

        if (normalizedNodeStart > 0) {
          originalStart = Math.floor(
            (normalizedNodeStart / normalizedText.length) * originalText.length
          );
        }
        if (normalizedNodeEnd < normalizedText.length) {
          originalEnd = Math.ceil(
            (normalizedNodeEnd / normalizedText.length) * originalText.length
          );
        }

        originalStart = Math.max(
          0,
          Math.min(originalStart, originalText.length)
        );
        originalEnd = Math.max(
          originalStart,
          Math.min(originalEnd, originalText.length)
        );

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
        } catch (error) {
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

  private tryFragmentedHighlight(
    searchText: string,
    textNodes: Text[]
  ): boolean {
    const words = searchText
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3);
    const minWordsToMatch = Math.max(2, Math.floor(words.length * 0.3));

    let badgeCreated = false;
    let totalHighlights = 0;
    let firstHighlightSpan: HTMLSpanElement | null = null;

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
        } catch (error) {
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

  private createHighlightFromTextWalker(searchText: string): boolean {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node: Text): number => {
          const parent = node.parentElement;
          if (
            parent?.matches("script, style, noscript, .truthlens-highlight")
          ) {
            return NodeFilter.FILTER_REJECT;
          }
          return node.textContent?.trim()
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        },
      }
    );

    const textNodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      textNodes.push(node as Text);
    }

    let badgeCreated = false;
    let totalHighlights = 0;
    let firstHighlightSpan: HTMLSpanElement | null = null;
    const normalizedSearchText = searchText.toLowerCase();

    for (const textNode of textNodes) {
      const textContent = textNode.textContent || "";
      const normalizedContent = textContent.toLowerCase();

      let searchIndex = 0;
      while (
        (searchIndex = normalizedContent.indexOf(
          normalizedSearchText,
          searchIndex
        )) !== -1
      ) {
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
        } catch (error) {
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

  private highlightTextInSingleNode(searchText: string): void {
    const textNodes = this.getTextNodes();

    for (const textNode of textNodes) {
      const textContent = textNode.textContent;
      if (!textContent) continue;

      const index = textContent.toLowerCase().indexOf(searchText.toLowerCase());
      if (index === -1) continue;

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
      } catch (error) {
        // Silently continue on error
      }
    }
  }

  private getResultColors(label: string): {
    background: string;
    boxShadow: string;
    icon: string;
  } {
    const lowerLabel = label.toLowerCase();

    if (
      lowerLabel.includes("true") ||
      lowerLabel.includes("verified") ||
      lowerLabel.includes("accurate")
    ) {
      return {
        background:
          "linear-gradient(120deg, rgba(16, 185, 129, 0.3) 0%, rgba(34, 197, 94, 0.3) 100%)",
        boxShadow: "0 0 0 2px rgba(16, 185, 129, 0.4)",
        icon: "✅",
      };
    }

    if (
      lowerLabel.includes("false") ||
      lowerLabel.includes("misleading") ||
      lowerLabel.includes("incorrect")
    ) {
      return {
        background:
          "linear-gradient(120deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.3) 100%)",
        boxShadow: "0 0 0 2px rgba(239, 68, 68, 0.4)",
        icon: "❌",
      };
    }

    return {
      background:
        "linear-gradient(120deg, rgba(245, 158, 11, 0.3) 0%, rgba(217, 119, 6, 0.3) 100%)",
      boxShadow: "0 0 0 2px rgba(245, 158, 11, 0.4)",
      icon: "⚠️",
    };
  }

  private createResultBadge(result: VerificationResult): HTMLDivElement {
    const colors = this.getResultColors(result.label);
    const resultBadge = document.createElement("div");

    const modalId = `truthlensModal-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    resultBadge.className = `${this.RESULT_BADGE_CLASS}`;

    resultBadge.innerHTML = `
     <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#${modalId}" style="background: linear-gradient(45deg, #6366f1, #8b5cf6);">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-list-check" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5M3.854 2.146a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708 0l-.5-.5a.5.5 0 1 1 .708-.708L2 3.293l1.146-1.147a.5.5 0 0 1 .708 0m0 4a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708 0l-.5-.5a.5.5 0 1 1 .708-.708L2 7.293l1.146-1.147a.5.5 0 0 1 .708 0m0 4a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708 0l-.5-.5a.5.5 0 0 1 .708-.708l.146.147 1.146-1.147a.5.5 0 0 1 .708 0"/>
        </svg>
        See Verification Details
    </button>
    `;

    // Create modal and append to body to avoid z-index issues
    const modal = document.createElement("div");
    modal.className = "modal fade";
    modal.id = modalId;
    modal.setAttribute("tabindex", "-1");
    modal.setAttribute("aria-labelledby", `${modalId}Label`);
    modal.setAttribute("aria-hidden", "true");
    modal.setAttribute("data-bs-backdrop", "true");
    modal.setAttribute("data-bs-keyboard", "true");

    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-scrollable modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-light">
            <h5 class="modal-title" id="${modalId}Label">
              TruthLens Verification Result
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-12">
                <div class="alert ${this.getBootstrapAlertClass(
                  result.label
                )} mb-3" role="alert">
                  <h6 class="alert-heading mb-0">
                    <i class="me-2">${colors.icon}</i>
                    Verification Status: <strong>${result.label}</strong>
                  </h6>
                </div>
              </div>
            </div>
            
            <div class="row">
              <div class="col-12">
                <h6 class="text-muted mb-2">Analysis Result:</h6>
                <p class="fs-6 lh-base">${result.response}</p>
              </div>
            </div>

            ${
              result.references
                ? `
            <div class="row mt-3">
              <div class="col-12">
                <h6 class="text-muted mb-2">Sources:</h6>
                <div class="card border-light">
                  <div class="card-body py-2">
                    <small class="text-muted">${result.references}</small>
                  </div>
                </div>
              </div>
            </div>
            `
                : ""
            }

            ${
              result.archive
                ? `
            <div class="row mt-3">
              <div class="col-12">
                <h6 class="text-muted mb-2">Archive Link:</h6>
                <div class="d-grid">
                  <a href="${result.archive}" target="_blank" class="btn btn-outline-secondary btn-sm">
                    <i class="me-1">🔗</i>
                    View Archived Version
                  </a>
                </div>
              </div>
            </div>
            `
                : ""
            }
          </div>
          <div class="modal-footer bg-light">
            <small class="text-muted me-auto">Powered by TruthLens</small>
            <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    `;

    // Append modal to body
    document.body.appendChild(modal);

    // Don't remove modal when hidden - just keep it for reuse
    // The modal will be cleaned up when the page is refreshed or when text highlighting is removed

    return resultBadge;
  }

  private getBootstrapAlertClass(label: string): string {
    const lowerLabel = label.toLowerCase();

    if (
      lowerLabel.includes("true") ||
      lowerLabel.includes("verified") ||
      lowerLabel.includes("accurate")
    ) {
      return "alert-success";
    }

    if (
      lowerLabel.includes("false") ||
      lowerLabel.includes("misleading") ||
      lowerLabel.includes("incorrect")
    ) {
      return "alert-danger";
    }

    return "alert-warning";
  }

  private showVerificationResult(result: VerificationResult): void {
    const colors = this.getResultColors(result.label);
    let resultBadgeCreated = false;

    this.highlightedElements.forEach((element, index) => {
      const badge = element.querySelector(`.${this.BADGE_CLASS}`);
      badge?.remove();

      const existingResultBadge = element.querySelector(
        `.${this.RESULT_BADGE_CLASS}`
      );
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

  private removeElementSafely(element: Element): void {
    const parent = element.parentNode;
    if (!parent) return;

    while (element.firstChild) {
      if (
        (element.firstChild as HTMLElement).classList?.contains(
          this.BADGE_CLASS
        )
      ) {
        element.removeChild(element.firstChild);
      } else {
        parent.insertBefore(element.firstChild, element);
      }
    }
    parent.removeChild(element);
    parent.normalize();
  }

  private removeTextHighlighting(): void {
    this.highlightedElements.forEach((element) => {
      try {
        this.removeElementSafely(element);
      } catch (error) {
        // Silently continue on error
      }
    });

    document.querySelectorAll(`.${this.HIGHLIGHT_CLASS}`).forEach((element) => {
      try {
        this.removeElementSafely(element);
      } catch (error) {
        // Silently continue on error
      }
    });

    document.querySelectorAll(`.${this.BADGE_CLASS}`).forEach((badge) => {
      badge.remove();
    });

    this.removeExistingResultBadges();

    // Clean up any TruthLens modals
    document.querySelectorAll('[id^="truthlensModal-"]').forEach((modal) => {
      modal.remove();
    });

    this.highlightedElements = [];
  }

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener(
      (
        request: TruthLensMessage,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response?: any) => void
      ): boolean => {
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
      }
    );
  }
}

new TruthLensContent();

