import React, { useState, useEffect, useCallback } from "react";
import {
  Steps,
  Card,
  Button,
  Alert,
  Typography,
  Flex,
  Tag,
  Space,
  Spin,
  Badge,
  Tooltip,
  Row,
  Col,
} from "antd";
import {
  CheckCircleOutlined,
  LoadingOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  LinkOutlined,
  EyeOutlined,
  BookOutlined,
  BulbOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  RobotOutlined,
  FileTextOutlined,
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
  reasoningAnalysis?: ReasoningIssueAnalysis;
  onNewCheck: () => void;
}> = ({ result, reasoningAnalysis, onNewCheck }) => {
  return (
    <div
      style={{
        height: "100%",
        background: "linear-gradient(135deg, #f6f9fc 0%, #eef4f7 100%)",
        padding: "32px 24px",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* Header Section */}
        <div
          style={{
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              background: `linear-gradient(135deg, ${getLabelColor(
                result.label
              )}15, ${getLabelColor(result.label)}05)`,
              borderRadius: "16px",
              padding: "16px",
              border: `2px solid ${getLabelColor(result.label)}30`,
              display: "inline-block",
              minWidth: "200px",
              textAlign: "center",
              width: "100%",
            }}
          >
            <Title
              level={3}
              style={{
                margin: 0,
                color: getLabelColor(result.label),
                fontSize: "24px",
                fontWeight: 700,
              }}
            >
              {getLabelText(result.label)}
            </Title>
          </div>
        </div>

        <Row gutter={[24, 24]}>
          {/* Main Content */}
          <Col xs={24} lg={16}>
            {/* Statement Card */}
            <Card
              style={{
                borderRadius: "16px",
                border: "1px solid #e8f0fe",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                marginBottom: "24px",
                background: "#ffffff",
              }}
              bodyStyle={{ padding: "24px" }}
            >
              <Flex align="center" gap={12} style={{ marginBottom: "16px" }}>
                <FileTextOutlined
                  style={{ fontSize: "20px", color: "#667eea" }}
                />
                <Title level={4} style={{ margin: 0, color: "#1f2937" }}>
                  Statement Analyzed
                </Title>
                <Badge
                  color="#667eea"
                  text={new Date(result.updatedAt).toLocaleDateString()}
                  style={{ marginLeft: "auto" }}
                />
              </Flex>

              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "20px",
                  borderLeft: "4px solid #667eea",
                }}
              >
                <Text
                  style={{
                    fontSize: "16px",
                    lineHeight: 1.7,
                    color: "#374151",
                    fontWeight: 500,
                  }}
                >
                  &ldquo;{result.summary}&rdquo;
                </Text>
              </div>
            </Card>

            {/* Analysis Card */}
            <Card
              style={{
                borderRadius: "16px",
                border: "1px solid #e8f0fe",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                marginBottom: "24px",
                background: "#ffffff",
              }}
              bodyStyle={{ padding: "24px" }}
            >
              <Flex align="center" gap={12} style={{ marginBottom: "16px" }}>
                <BulbOutlined style={{ fontSize: "20px", color: "#f59e0b" }} />
                <Title level={4} style={{ margin: 0, color: "#1f2937" }}>
                  AI Analysis
                </Title>
              </Flex>

              <div
                style={{
                  background: "#fffbeb",
                  border: "1px solid #fed7aa",
                  borderRadius: "12px",
                  padding: "20px",
                  maxHeight: "300px",
                  overflowY: "auto",
                }}
              >
                <Paragraph
                  style={{
                    fontSize: "15px",
                    lineHeight: 1.8,
                    margin: 0,
                    color: "#92400e",
                  }}
                >
                  {result.response}
                </Paragraph>
              </div>
            </Card>

            {/* Reasoning Analysis */}
            {reasoningAnalysis && (
              <Card
                style={{
                  borderRadius: "16px",
                  border: "1px solid #e8f0fe",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  marginBottom: "24px",
                  background: "#ffffff",
                }}
                bodyStyle={{ padding: "24px" }}
              >
                <Flex align="center" gap={12} style={{ marginBottom: "20px" }}>
                  <InfoCircleOutlined
                    style={{ fontSize: "20px", color: "#8b5cf6" }}
                  />
                  <Title level={4} style={{ margin: 0, color: "#1f2937" }}>
                    Reasoning Analysis
                  </Title>
                </Flex>

                <Space
                  direction="vertical"
                  size="large"
                  style={{ width: "100%" }}
                >
                  {/* Fallacies */}
                  {reasoningAnalysis.fallacies &&
                    reasoningAnalysis.fallacies.length > 0 && (
                      <div>
                        <Flex
                          align="center"
                          gap={8}
                          style={{ marginBottom: "12px" }}
                        >
                          <WarningOutlined style={{ color: "#d97706" }} />
                          <Text strong style={{ color: "#92400e" }}>
                            Logical Fallacies Detected
                          </Text>
                        </Flex>
                        <div
                          style={{
                            background: "#fef3c7",
                            borderRadius: "12px",
                            padding: "16px",
                            border: "1px solid #fcd34d",
                          }}
                        >
                          <Space wrap>
                            {reasoningAnalysis.fallacies.map(
                              (fallacy: string, index: number) => (
                                <Tag
                                  key={index}
                                  style={{
                                    background: "#f59e0b",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "20px",
                                    padding: "6px 14px",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                  }}
                                >
                                  {fallacy}
                                </Tag>
                              )
                            )}
                          </Space>
                        </div>
                      </div>
                    )}

                  {/* Bias Indicators */}
                  {reasoningAnalysis.bias_indicators &&
                    reasoningAnalysis.bias_indicators.length > 0 && (
                      <div>
                        <Flex
                          align="center"
                          gap={8}
                          style={{ marginBottom: "12px" }}
                        >
                          <ExclamationCircleOutlined
                            style={{ color: "#dc2626" }}
                          />
                          <Text strong style={{ color: "#991b1b" }}>
                            Bias Indicators Found
                          </Text>
                        </Flex>
                        <div
                          style={{
                            background: "#fef2f2",
                            borderRadius: "12px",
                            padding: "16px",
                            border: "1px solid #fca5a5",
                          }}
                        >
                          <Space wrap>
                            {reasoningAnalysis.bias_indicators.map(
                              (bias: string, index: number) => (
                                <Tag
                                  key={index}
                                  style={{
                                    background: "#dc2626",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "20px",
                                    padding: "6px 14px",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                  }}
                                >
                                  {bias}
                                </Tag>
                              )
                            )}
                          </Space>
                        </div>
                      </div>
                    )}

                  {/* Explanation */}
                  {reasoningAnalysis.explanation && (
                    <div
                      style={{
                        background: "#eff6ff",
                        borderRadius: "12px",
                        padding: "20px",
                        border: "1px solid #93c5fd",
                      }}
                    >
                      <Flex align="flex-start" gap={12}>
                        <InfoCircleOutlined
                          style={{
                            color: "#1d4ed8",
                            fontSize: "16px",
                            marginTop: "2px",
                          }}
                        />
                        <Text
                          style={{
                            color: "#1e40af",
                            fontSize: "15px",
                            lineHeight: 1.7,
                            fontWeight: 500,
                          }}
                        >
                          {reasoningAnalysis.explanation}
                        </Text>
                      </Flex>
                    </div>
                  )}
                </Space>
              </Card>
            )}
          </Col>

          {/* Sidebar */}
          <Col xs={24} lg={8}>
            {/* Safety Badge */}
            <Card
              style={{
                borderRadius: "16px",
                border: "1px solid #e8f0fe",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                marginBottom: "24px",
                background: "#ffffff",
              }}
              bodyStyle={{ padding: "20px", textAlign: "center" }}
            >
              <div
                style={{
                  background: result.isSafe
                    ? "linear-gradient(135deg, #10b981, #059669)"
                    : "linear-gradient(135deg, #ef4444, #dc2626)",
                  borderRadius: "50px",
                  padding: "12px 24px",
                  display: "inline-block",
                  marginBottom: "12px",
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontWeight: 600,
                    fontSize: "14px",
                  }}
                >
                  {result.isSafe ? "✓ Safe Content" : "⚠ Potentially Unsafe"}
                </Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  Content Safety Assessment
                </Text>
              </div>
            </Card>

            {/* References */}
            {result.references && result.references.length > 0 && (
              <Card
                style={{
                  borderRadius: "16px",
                  border: "1px solid #e8f0fe",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  marginBottom: "24px",
                  background: "#ffffff",
                }}
                bodyStyle={{ padding: "20px" }}
              >
                <Flex align="center" gap={12} style={{ marginBottom: "16px" }}>
                  <BookOutlined
                    style={{ fontSize: "18px", color: "#667eea" }}
                  />
                  <Title level={5} style={{ margin: 0, color: "#1f2937" }}>
                    Sources & References
                  </Title>
                  <Badge
                    count={result.references.length}
                    style={{
                      backgroundColor: "#667eea",
                      marginLeft: "auto",
                    }}
                  />
                </Flex>

                <Space
                  direction="vertical"
                  style={{ width: "100%" }}
                  size="small"
                >
                  {result.references.slice(0, 3).map((ref, index) => (
                    <Tooltip
                      key={index}
                      title="Click to open source"
                      placement="top"
                    >
                      <div
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          padding: "12px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          borderLeft: "3px solid #667eea",
                        }}
                        onClick={() => window.open(ref, "_blank")}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateX(4px)";
                          e.currentTarget.style.boxShadow =
                            "0 4px 12px rgba(102, 126, 234, 0.15)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateX(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <Flex align="center" gap={8}>
                          <LinkOutlined
                            style={{ color: "#667eea", fontSize: "14px" }}
                          />
                          <Text
                            style={{
                              color: "#667eea",
                              fontSize: "13px",
                              fontWeight: 500,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              flex: 1,
                            }}
                          >
                            Source {index + 1}
                          </Text>
                          <EyeOutlined
                            style={{ color: "#9ca3af", fontSize: "12px" }}
                          />
                        </Flex>
                      </div>
                    </Tooltip>
                  ))}

                  {result.references.length > 3 && (
                    <Text
                      type="secondary"
                      style={{
                        fontSize: "12px",
                        textAlign: "center",
                        display: "block",
                      }}
                    >
                      +{result.references.length - 3} more sources
                    </Text>
                  )}
                </Space>
              </Card>
            )}

            {/* Action Button */}
            <Button
              type="primary"
              size="large"
              onClick={onNewCheck}
              style={{
                width: "100%",
                height: "56px",
                borderRadius: "16px",
                fontSize: "16px",
                fontWeight: 600,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                boxShadow: "0 8px 32px rgba(102, 126, 234, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              icon={<RobotOutlined />}
            >
              New Analysis
            </Button>
          </Col>
        </Row>
      </div>
    </div>
  );
};

interface ReasoningIssueAnalysis {
  fallacies: string[];
  bias_indicators: string[];
  explanation: string;
}

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
  fallacy_result?: ReasoningIssueAnalysis;
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
    // Don't start if we don't have a valid task ID
    if (!factCheckTaskId || factCheckTaskId.trim() === "") {
      return;
    }

    // Reset state when factCheckTaskId changes
    setTaskStatus(null);
    setError(null);

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
  }, [fetchTaskStatus, factCheckTaskId]);

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
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f6f9fc 0%, #eef4f7 100%)",
          padding: "32px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Card
          style={{
            maxWidth: 500,
            width: "100%",
            borderRadius: "20px",
            border: "none",
            boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
            background: "#ffffff",
            textAlign: "center",
          }}
        >
          <Alert
            message="Connection Error"
            description={error}
            type="error"
            showIcon
            style={{
              marginBottom: 24,
              borderRadius: "12px",
              border: "1px solid #fecaca",
            }}
          />
          <Button
            onClick={resetForm}
            type="primary"
            size="large"
            style={{
              borderRadius: "12px",
              height: "48px",
              paddingLeft: "32px",
              paddingRight: "32px",
              fontSize: "16px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              boxShadow: "0 4px 16px rgba(102, 126, 234, 0.3)",
            }}
          >
            Start New Analysis
          </Button>
        </Card>
      </div>
    );
  }

  // Show results if task is completed and we have result data
  if (taskStatus?.status === "completed" && taskStatus.result) {
    return (
      <FactCheckResults
        result={taskStatus.result}
        reasoningAnalysis={taskStatus.fallacy_result}
        onNewCheck={resetForm}
      />
    );
  }

  // Show loading state if we haven't fetched task data yet
  if (!taskStatus && !error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f6f9fc 0%, #eef4f7 100%)",
          padding: "32px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Card
          style={{
            maxWidth: 500,
            width: "100%",
            borderRadius: "20px",
            border: "none",
            boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
            background: "#ffffff",
            textAlign: "center",
          }}
        >
          <div style={{ padding: "40px 20px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                background: "rgba(118, 75, 162, 0.1)",
                padding: "16px 24px",
                borderRadius: "50px",
                marginBottom: "24px",
              }}
            >
              <RobotOutlined style={{ fontSize: "24px", color: "#764ba2" }} />
              <Text
                style={{ fontSize: "18px", fontWeight: 600, color: "#764ba2" }}
              >
                Connecting to AI
              </Text>
            </div>

            <Spin
              size="large"
              style={{ display: "block", marginBottom: "16px" }}
            />

            <Text type="secondary" style={{ fontSize: "14px" }}>
              Initializing analysis pipeline...
            </Text>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f6f9fc 0%, #eef4f7 100%)",
        padding: "32px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card
        style={{
          maxWidth: 650,
          width: "100%",
          borderRadius: "20px",
          border: "none",
          boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
          background: "#ffffff",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "12px",
              background: "rgba(118, 75, 162, 0.1)",
              padding: "16px 24px",
              borderRadius: "50px",
              marginBottom: "16px",
            }}
          >
            <RobotOutlined style={{ fontSize: "24px", color: "#764ba2" }} />
            <Text
              style={{ fontSize: "18px", fontWeight: 600, color: "#764ba2" }}
            >
              AI Fact-Checking in Progress
            </Text>
          </div>
        </div>

        {taskStatus?.status === "failed" && (
          <Alert
            message="Analysis Failed"
            description={taskStatus.message}
            type="error"
            showIcon
            style={{
              marginBottom: 32,
              borderRadius: "12px",
              border: "1px solid #fecaca",
            }}
          />
        )}

        <Steps
          direction="vertical"
          current={Math.max(0, currentStep)}
          status={taskStatus?.status === "failed" ? "error" : "process"}
          items={stepsWithStatus.map((step, index) => ({
            ...step,
            description: (
              <div
                style={{
                  color: index <= currentStep ? "#374151" : "#9ca3af",
                  fontSize: "14px",
                  marginTop: "4px",
                }}
              >
                {step.description}
              </div>
            ),
          }))}
          style={{ marginBottom: 32 }}
        />

        <div style={{ textAlign: "center" }}>
          {taskStatus?.status === "completed" && (
            <Button
              onClick={resetForm}
              type="primary"
              size="large"
              style={{
                borderRadius: "12px",
                height: "48px",
                paddingLeft: "32px",
                paddingRight: "32px",
                fontSize: "16px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                boxShadow: "0 4px 16px rgba(102, 126, 234, 0.3)",
              }}
            >
              Start New Analysis
            </Button>
          )}

          {(taskStatus?.status === "failed" || error) && (
            <Button
              onClick={resetForm}
              type="primary"
              size="large"
              style={{
                borderRadius: "12px",
                height: "48px",
                paddingLeft: "32px",
                paddingRight: "32px",
                fontSize: "16px",
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                border: "none",
                boxShadow: "0 4px 16px rgba(239, 68, 68, 0.3)",
              }}
            >
              Try Again
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

