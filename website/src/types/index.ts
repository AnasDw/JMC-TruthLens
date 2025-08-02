// Common types used across the application

export interface Message {
  id: number;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export interface FactCheckResult {
  id: string;
  title: string;
  content: string;
  veracity: "true" | "partially-true" | "false" | "misleading";
  confidence: number;
  sources: Array<{
    title: string;
    url: string;
    credibility: number;
  }>;
  explanation: string;
  timestamp: Date;
}

export interface ChatSidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  conversationHistory: string[];
  onNewChat?: () => void;
}

export interface ChatHeaderProps {
  title?: string;
  onShareConversation?: () => void;
}

export interface WelcomeScreenProps {
  samplePrompts?: string[];
  onPromptClick: (prompt: string) => void;
  injectedText?: string;
}

export interface FactCheckFormProps {
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onSubmit: () => void;
  loading?: boolean;
}

export interface FactCheckResultProps {
  result: FactCheckResult;
  onNewCheck?: () => void;
}

export interface ChatMessagesProps {
  messages: Message[];
}

export interface MessageBubbleProps {
  message: Message;
}

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export interface FloatingActionsProps {
  onTipsClick: (prompt: string) => void;
}

