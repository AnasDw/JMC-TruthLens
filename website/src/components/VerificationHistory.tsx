"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  List,
  Card,
  Tag,
  Typography,
  Space,
  Empty,
  Spin,
  Flex,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

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
  status:
    | "pending"
    | "processing"
    | "summarizing"
    | "fact_checking"
    | "completed"
    | "failed";
  message: string;
  result?: FactCheckResult;
  created_at: string;
  updated_at: string;
  fallacy_result?: ReasoningIssueAnalysis;
}

interface VerificationHistoryProps {
  open: boolean;
  onClose: () => void;
  onSelectTask?: (taskId: string) => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
    case "failed":
      return <CloseCircleOutlined style={{ color: "#ff4d4f" }} />;
    case "processing":
    case "summarizing":
    case "fact_checking":
      return <ClockCircleOutlined style={{ color: "#1677ff" }} />;
    default:
      return <ExclamationCircleOutlined style={{ color: "#faad14" }} />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "success";
    case "failed":
      return "error";
    case "processing":
    case "summarizing":
    case "fact_checking":
      return "processing";
    default:
      return "default";
  }
};

const getLabelColor = (label: string) => {
  switch (label) {
    case "correct":
      return "success";
    case "incorrect":
      return "error";
    case "partially-correct":
      return "warning";
    case "misleading":
      return "magenta";
    default:
      return "default";
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

export const VerificationHistory: React.FC<VerificationHistoryProps> = ({
  open,
  onClose,
  onSelectTask,
}) => {
  const [tasks, setTasks] = useState<TaskStatusResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:8000/api/tasks/?limit=50&skip=0"
      );
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchTasks();
    }
  }, [open]);

  const handleSelectTask = (task: TaskStatusResponse) => {
    if (onSelectTask) {
      onSelectTask(task.task_id);
    }
    onClose();
  };

  return (
    <>
      <Modal
        title={
          <Space>
            <span>Verification History</span>
          </Space>
        }
        open={open}
        onCancel={onClose}
        footer={null}
        width={800}
        style={{ top: 20 }}
        styles={{
          body: { maxHeight: "70vh", overflowY: "auto" },
        }}
      >
        {loading ? (
          <Flex justify="center" align="center" style={{ minHeight: "200px" }}>
            <Spin size="large" />
          </Flex>
        ) : tasks.length === 0 ? (
          <Empty
            description="No verification history found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={tasks}
            renderItem={(task) => (
              <List.Item
                style={{
                  cursor: task.status === "completed" && task.result ? "pointer" : "default",
                  borderRadius: "12px",
                  marginBottom: "12px",
                  background: "#fafafa",
                  border: "1px solid #f0f0f0",
                  transition: "all 0.2s ease",
                  opacity: task.status === "completed" && task.result ? 1 : 0.7,
                }}
                onMouseEnter={(e) => {
                  if (task.status === "completed" && task.result) {
                    e.currentTarget.style.background = "#f5f5f5";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (task.status === "completed" && task.result) {
                    e.currentTarget.style.background = "#fafafa";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
                onClick={() => {
                  // Only navigate if the task is completed and has results
                  if (task.status === "completed" && task.result) {
                    handleSelectTask(task);
                  }
                }}
              >
                <Card
                  size="small"
                  style={{
                    width: "100%",
                    border: "none",
                    background: "transparent",
                  }}
                  styles={{ body: { padding: "12px 16px" } }}
                >
                  <Flex justify="space-between" align="flex-start" gap={16}>
                    <div style={{ flex: 1 }}>
                      <Flex
                        align="center"
                        gap={8}
                        style={{ marginBottom: "8px" }}
                      >
                        {getStatusIcon(task.status)}
                        <Tag color={getStatusColor(task.status)}>
                          {task.status.toUpperCase()}
                        </Tag>
                        {task.result && (
                          <Tag color={getLabelColor(task.result.label)}>
                            {getLabelText(task.result.label)}
                          </Tag>
                        )}
                      </Flex>

                      <Text
                        strong
                        style={{
                          display: "block",
                          marginBottom: "4px",
                          fontSize: "14px",
                          lineHeight: 1.4,
                        }}
                      >
                        {task.result?.summary || "Processing..."}
                      </Text>

                      <Flex align="center" gap={8}>
                        <CalendarOutlined
                          style={{ color: "#999", fontSize: "12px" }}
                        />
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          {new Date(task.created_at).toLocaleDateString()}{" "}
                          {new Date(task.created_at).toLocaleTimeString()}
                        </Text>
                      </Flex>
                    </div>
                  </Flex>
                </Card>
              </List.Item>
            )}
          />
        )}
      </Modal>
    </>
  );
};

