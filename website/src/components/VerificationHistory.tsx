"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  List,
  Card,
  Tag,
  Typography,
  Space,
  Button,
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
  const [selectedTask, setSelectedTask] = useState<TaskStatusResponse | null>(
    null
  );

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

  const handleTaskClick = (task: TaskStatusResponse) => {
    setSelectedTask(task);
  };

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
                  cursor: "pointer",
                  borderRadius: "12px",
                  marginBottom: "12px",
                  background: "#fafafa",
                  border: "1px solid #f0f0f0",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f5f5f5";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fafafa";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                onClick={() => handleTaskClick(task)}
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

                    {task.status === "completed" && task.result && (
                      <Button
                        type="primary"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTask(task);
                        }}
                        style={{
                          background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          border: "none",
                          borderRadius: "6px",
                        }}
                      >
                        View Details
                      </Button>
                    )}
                  </Flex>
                </Card>
              </List.Item>
            )}
          />
        )}
      </Modal>

      {/* Task Detail Modal */}
      <Modal
        title="Task Details"
        open={!!selectedTask}
        onCancel={() => setSelectedTask(null)}
        footer={
          selectedTask?.status === "completed" && selectedTask.result ? (
            <Button
              type="primary"
              onClick={() => handleSelectTask(selectedTask)}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                borderRadius: "8px",
              }}
            >
              View Full Results
            </Button>
          ) : null
        }
        width={600}
      >
        {selectedTask && (
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <Flex gap={8}>
              <Tag color={getStatusColor(selectedTask.status)}>
                {selectedTask.status.toUpperCase()}
              </Tag>
              {selectedTask.result && (
                <Tag color={getLabelColor(selectedTask.result.label)}>
                  {getLabelText(selectedTask.result.label)}
                </Tag>
              )}
            </Flex>

            <div>
              <Text strong>Task ID:</Text>
              <br />
              <Text code style={{ fontSize: "12px" }}>
                {selectedTask.task_id}
              </Text>
            </div>

            {selectedTask.result?.summary && (
              <div>
                <Text strong>Statement:</Text>
                <br />
                <Text>{selectedTask.result.summary}</Text>
              </div>
            )}

            {selectedTask.result?.response && (
              <div>
                <Text strong>Analysis:</Text>
                <br />
                <Text>{selectedTask.result.response.substring(0, 200)}...</Text>
              </div>
            )}

            <div>
              <Text strong>Created:</Text>
              <br />
              <Text type="secondary">
                {new Date(selectedTask.created_at).toLocaleString()}
              </Text>
            </div>
          </Space>
        )}
      </Modal>
    </>
  );
};

