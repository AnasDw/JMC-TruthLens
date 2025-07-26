// TruthLens Extension Type Definitions

export interface VerificationResult {
  label: string;
  response: string;
  isSafe: boolean;
  references?: string;
  archive?: string;
}

export interface VerificationRequest {
  url: string;
  content: string;
}

export interface TruthLensMessage {
  action:
    | "ping"
    | "setHighlightSelectedText"
    | "setLoadingCursor"
    | "removeLoadingCursor"
    | "removeHighlightSelectedText"
    | "showVerificationResult"
    | "verificationComplete"
    | "verificationStarted"
    | "showPopup";
  selectedText?: string;
  result?: VerificationResult;
  loading?: boolean;
  error?: string;
  message?: string;
}

export interface ContentScriptElement extends HTMLElement {
  className: string;
}

export interface HighlightElement extends HTMLSpanElement {
  style: CSSStyleDeclaration;
}

export interface MessageSender extends chrome.runtime.MessageSender {
  tab?: chrome.tabs.Tab;
}

// Context menu click information
export interface ContextMenuInfo {
  selectionText?: string;
  pageUrl?: string;
  menuItemId?: string | number;
}

export type SafeMessageSender = (
  tabId: number,
  message: TruthLensMessage,
  retries?: number
) => Promise<boolean>;

export type MessageHandler = (
  request: TruthLensMessage,
  sender: MessageSender,
  sendResponse: (response?: any) => void
) => boolean | void;

