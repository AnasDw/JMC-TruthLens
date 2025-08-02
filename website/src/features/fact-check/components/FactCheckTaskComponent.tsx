import React, { useState, useEffect, useCallback } from "react";
import { Steps, Card, Button, Alert, Typography, Flex, Tag, Space } from "antd";
import {
  CheckCircleOutlined,
  LoadingOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  LinkOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { TaskStatus } from "../types";

const { Title, Paragraph, Text } = Typography;

const getLabelColor = (label: string) => {
  switch (label) {
    case "correct":
      return "#52c41a";
    case "incorrect":
      return "#ff4d4f";
    case "partially-correct":
      return "#faad14";
    case "misleading":
      return "#f759ab";
    default:
      return "#d9d9d9";
  }
};

const getLabelText = (label: string) => {
  switch (label) {
    case "correct":
      return "✓ Correct";
    case "incorrect":
      return "✗ Incorrect";
    case "partially-correct":
      return "⚡ Partially Correct";
    case "misleading":
      return "⚠ Misleading";
    default:
      return "❓ Unknown";
  }
};

const FactCheckResults: React.FC<{
  result: FactCheckResult;
  onNewCheck: () => void;
}> = ({ result, onNewCheck }) => {
  return (
    <Flex
      align="center"
      justify="center"
      style={{ minHeight: "100vh", padding: "20px" }}
    >
      <div style={{ maxWidth: "800px", width: "100%" }}>
        <Card
          style={{
            borderRadius: "20px",
            border: "none",
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
            marginBottom: "24px",
          }}
        >
          <Flex vertical gap={24}>
            <Flex vertical gap={16}>
              <Flex align="center" gap={8}>
                <Title level={4} style={{ color: "#1e293b", margin: 0 }}>
                  📝 Statement Analyzed
                </Title>
                <Tag
                  color="blue"
                  style={{
                    padding: "8px 16px",
                    borderRadius: "20px",
                    fontSize: "14px",
                    border: "none",
                  }}
                >
                  <CalendarOutlined />{" "}
                  {new Date(result.updatedAt).toLocaleDateString()}
                </Tag>
              </Flex>

              <Card
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                }}
              >
                <Text style={{ fontSize: "16px", lineHeight: 1.6 }}>
                  {result.summary}
                </Text>
              </Card>
            </Flex>

            {/* Analysis */}
            <div>
              <Title
                level={4}
                style={{ color: "#1e293b", marginBottom: "12px" }}
              >
                🔍 Analysis
              </Title>
              <Card
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  maxHeight: 200,
                  overflowY: "auto",
                }}
              >
                <Paragraph
                  style={{ fontSize: "16px", lineHeight: 1.7, margin: 0 }}
                >
                  {result.response}
                </Paragraph>
              </Card>
            </div>

            {/* References */}
            {result.references && result.references.length > 0 && (
              <Flex vertical gap={16}>
                <Flex align="center" gap={8}>
                  <Title style={{ margin: 0 }} level={4}>
                    🔗 Sources & References
                  </Title>
                  <Tag
                    color={result.isSafe ? "green" : "red"}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "20px",
                      fontSize: "14px",
                      border: "none",
                    }}
                  >
                    {result.isSafe ? "✓ Safe Content" : "⚠ Potentially Unsafe"}
                  </Tag>
                </Flex>

                <Space
                  direction="vertical"
                  style={{ width: "100%" }}
                  size="small"
                >
                  {result.references.map((ref, index) => (
                    <Card
                      key={index}
                      size="small"
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      hoverable
                      onClick={() => window.open(ref, "_blank")}
                    >
                      <Flex align="center" gap={8}>
                        <LinkOutlined style={{ color: "#667eea" }} />
                        <Text
                          style={{
                            color: "#667eea",
                            fontSize: "14px",
                            textDecoration: "underline",
                          }}
                        >
                          {ref}
                        </Text>
                      </Flex>
                    </Card>
                  ))}
                </Space>
              </Flex>
            )}

            {/* Action Button */}
            <Flex gap={16} style={{ width: "100%" }}>
              <div
                style={{
                  background: `linear-gradient(135deg, ${getLabelColor(
                    result.label
                  )}20, ${getLabelColor(result.label)}10)`,
                  borderRadius: "12px",
                  padding: "8px",
                  marginBottom: "20px",
                  border: `2px solid ${getLabelColor(result.label)}30`,
                  textAlign: "center",
                  flex: 1,
                }}
              >
                <Title
                  level={4}
                  style={{ margin: 0, color: getLabelColor(result.label) }}
                >
                  {getLabelText(result.label)}
                </Title>
              </div>

              <Button
                type="primary"
                size="large"
                onClick={onNewCheck}
                style={{
                  borderRadius: "12px",
                  height: "48px",
                  paddingLeft: "32px",
                  paddingRight: "32px",
                  fontSize: "16px",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                  boxShadow: "0 4px 16px rgba(102, 126, 234, 0.3)",
                }}
              >
                Start New Fact Check
              </Button>
            </Flex>
          </Flex>
        </Card>
      </div>
    </Flex>
  );
};

interface FactCheckResult {
  url: string | null;
  label: "correct" | "incorrect" | "partially-correct" | "misleading";
  summary: string;
  response: string;
  isSafe: boolean;
  archive: string | null;
  references: string[];
  updatedAt: string;
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

  // Show results if task is completed and we have result data
  if (taskStatus?.status === "completed" && taskStatus.result) {
    return (
      <FactCheckResults result={taskStatus.result} onNewCheck={resetForm} />
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

