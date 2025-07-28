// TruthLens Extension Type Definitions

declare global {
  interface VerificationResult {
    label: string;
    response: string;
    isSafe: boolean;
    references?: string;
    archive?: string;
  }

  interface VerificationRequest {
    url: string;
    content: string;
  }

  type MessageAction =
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
    action: MessageAction;
    selectedText?: string;
    result?: VerificationResult;
    loading?: boolean;
    error?: string;
    message?: string;
  }

  interface ContentScriptElement extends HTMLElement {
    className: string;
  }

  interface HighlightElement extends HTMLSpanElement {
    style: CSSStyleDeclaration;
  }

  interface MessageSender extends chrome.runtime.MessageSender {
    tab?: chrome.tabs.Tab;
  }

  interface ContextMenuInfo {
    selectionText?: string;
    pageUrl?: string;
    menuItemId?: string | number;
  }

  type SafeMessageSender = (
    tabId: number,
    message: TruthLensMessage,
    retries?: number
  ) => Promise<boolean>;

  type MessageHandler = (
    request: TruthLensMessage,
    sender: MessageSender,
    sendResponse: (response?: any) => void
  ) => boolean | void;
}

