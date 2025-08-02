"use client";

import React from "react";
import { Card, Input, Button, Space, Typography } from "antd";
import { SendOutlined } from "@ant-design/icons";
import type { ChatInputProps } from "@/types";

const { TextArea } = Input;
const { Text } = Typography;

const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Ask me anything about truth, facts, or verification...",
}) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        width: "100%",
        marginTop: "24px",
      }}
    >
      <Card
        style={{
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          border: "1px solid #e6f4ff",
        }}
      >
        <Space.Compact style={{ width: "100%" }}>
          <TextArea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{
              border: "none",
              resize: "none",
              fontSize: "16px",
            }}
            onPressEnter={handleKeyPress}
            disabled={disabled}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={onSend}
            style={{
              height: "auto",
              minHeight: "40px",
              borderRadius: "0 8px 8px 0",
            }}
            disabled={disabled || !value.trim()}
          />
        </Space.Compact>
      </Card>
      <Text
        type="secondary"
        style={{
          fontSize: "12px",
          display: "block",
          textAlign: "center",
          marginTop: "8px",
        }}
      >
        TruthLens AI can make mistakes. Verify important information.
      </Text>
    </div>
  );
};

export default ChatInput;

