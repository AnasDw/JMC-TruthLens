export type TaskStatus =
  | "pending"
  | "processing"
  | "summarizing"
  | "fact_checking"
  | "completed"
  | "failed";

export interface FactCheckTask {
  task_id: string;
  status: TaskStatus;
  message: string;
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
  result: FactCheckTask;
  onNewCheck?: () => void;
}

export interface UseFactCheckReturn {
  title: string;
  content: string;
  result: FactCheckTask | null;
  loading: boolean;
  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  submitFactCheck: (showNotifications?: boolean) => Promise<void>;
  resetForm: () => void;
}

