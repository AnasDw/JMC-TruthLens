import React, { useState, useEffect, useCallback } from "react";
import { Steps, Card, Button, Alert, Typography, Flex } from "antd";
import {
  CheckCircleOutlined,
  LoadingOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { TaskStatus } from "../types";

const { Title } = Typography;

interface FactCheckResult {
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

interface TaskStatusResponse {
  task_id: string;
  status: TaskStatus;
  message: string;
  result?: FactCheckResult;
  created_at: string;
  updated_at: string;
}

interface FactCheckTaskProps {
  resetForm: () => void;
  factCheckTaskId: string;
  onTaskComplete?: (result: FactCheckResult) => void;
}

type StepStatus = "finish" | "error" | "process" | "wait";

const getStepStatus = (
  status: TaskStatus,
  stepIndex: number,
  currentStep: number
): StepStatus => {
  if (stepIndex < currentStep) return "finish";
  if (stepIndex === currentStep) {
    if (status === "failed") return "error";
    if (status === "completed") return "finish";
    return "process";
  }
  return "wait";
};

const getStepIcon = (
  status: TaskStatus,
  stepIndex: number,
  currentStep: number
) => {
  if (stepIndex < currentStep) return <CheckCircleOutlined />;
  if (stepIndex === currentStep) {
    if (status === "failed") return <CloseCircleOutlined />;
    if (status === "completed") return <CheckCircleOutlined />;
    return <LoadingOutlined />;
  }
  return <ClockCircleOutlined />;
};

const getStepFromStatus = (status: TaskStatus): number => {
  switch (status) {
    case "pending":
      return 0;
    case "processing":
      return 1;
    case "summarizing":
      return 2;
    case "fact_checking":
      return 3;
    case "completed":
      return 4;
    case "failed":
      return -1;
    default:
      return 0;
  }
};

export const FactCheckTaskComponent: React.FC<FactCheckTaskProps> = ({
  resetForm,
  factCheckTaskId,
  onTaskComplete,
}) => {
  const [taskStatus, setTaskStatus] = useState<TaskStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTaskStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/task/${factCheckTaskId}/status`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: TaskStatusResponse = await response.json();
      setTaskStatus(data);
      setError(null);

      // If task is completed and we have a result, call the completion callback
      if (data.status === "completed" && data.result && onTaskComplete) {
        onTaskComplete(data.result);
      }

      // Stop polling if task is completed or failed
      if (data.status === "completed" || data.status === "failed") {
        return true; // Stop polling
      }

      return false; // Continue polling
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return true; // Stop polling on error
    }
  }, [factCheckTaskId, onTaskComplete]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const startPolling = async () => {
      // Initial fetch
      const shouldStop = await fetchTaskStatus();

      if (!shouldStop) {
        // Start polling every 2 seconds
        intervalId = setInterval(async () => {
          const shouldStopPolling = await fetchTaskStatus();
          if (shouldStopPolling) {
            clearInterval(intervalId);
          }
        }, 3000);
      }
    };

    startPolling();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchTaskStatus]);

  const currentStep = taskStatus ? getStepFromStatus(taskStatus.status) : 0;

  const steps = [
    {
      title: "Task Created",
      description:
        "Your fact-check request has been received and queued for processing.",
    },
    {
      title: "Processing",
      description: "Analyzing and gathering information about your statement.",
    },
    {
      title: "Summarizing",
      description: "Summarizing findings and cross-referencing sources.",
    },
    {
      title: "Fact Checking",
      description: "Performing detailed fact verification and analysis.",
    },
    {
      title: "Complete",
      description: "Analysis complete! Results are ready for review.",
    },
  ];

  const stepsWithStatus = steps.map((step, index) => ({
    ...step,
    status: getStepStatus(taskStatus?.status || "pending", index, currentStep),
    icon: getStepIcon(taskStatus?.status || "pending", index, currentStep),
  }));

  if (error) {
    return (
      <Card style={{ maxWidth: 600, margin: "0 auto" }}>
        <Alert
          message="Error Loading Task Status"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Button onClick={resetForm} type="primary">
          Start New Fact Check
        </Button>
      </Card>
    );
  }

  return (
    <Flex align="center" justify="center" style={{ height: "100%" }}>
      <Card style={{ maxWidth: 600, margin: "0 auto", height: "fit-content" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={3}>Fact Check Progress</Title>
        </div>

        {taskStatus?.status === "failed" && (
          <Alert
            message="Task Failed"
            description={taskStatus.message}
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        <Steps
          direction="vertical"
          current={Math.max(0, currentStep)}
          status={taskStatus?.status === "failed" ? "error" : "process"}
          items={stepsWithStatus}
          style={{ marginBottom: 24 }}
        />

        {taskStatus?.status === "completed" && (
          <div style={{ textAlign: "center" }}>
            <Button onClick={resetForm} type="primary" size="large">
              Start New Fact Check
            </Button>
          </div>
        )}

        {(taskStatus?.status === "failed" || error) && (
          <div style={{ textAlign: "center" }}>
            <Button onClick={resetForm} type="primary" size="large">
              Try Again
            </Button>
          </div>
        )}
      </Card>
    </Flex>
  );
};

