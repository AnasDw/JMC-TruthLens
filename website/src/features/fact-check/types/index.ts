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

export interface UseFactCheckReturn {
  title: string;
  content: string;
  result: FactCheckResult | null;
  loading: boolean;
  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  submitFactCheck: (showNotifications?: boolean) => Promise<void>;
  resetForm: () => void;
}

