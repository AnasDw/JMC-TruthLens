"use client";

import React from "react";
import { Avatar, Card, Typography } from "antd";
import { UserOutlined, RobotOutlined } from "@ant-design/icons";
import type { MessageBubbleProps } from "@/types";

const { Paragraph, Text } = Typography;

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: message.isUser ? "flex-end" : "flex-start",
        width: "100%",
      }}
    >
      <div
        style={{
          maxWidth: "70%",
          display: "flex",
          gap: "12px",
          flexDirection: message.isUser ? "row-reverse" : "row",
        }}
      >
        <Avatar
          style={{
            backgroundColor: message.isUser ? "#52c41a" : "#1677ff",
            flexShrink: 0,
          }}
          icon={message.isUser ? <UserOutlined /> : <RobotOutlined />}
        />
        <Card
          style={{
            backgroundColor: message.isUser ? "#e6f4ff" : "#fff",
            border: message.isUser ? "1px solid #b7eb8f" : "1px solid #f0f0f0",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
          styles={{ body: { padding: "12px 16px" } }}
        >
          <Paragraph style={{ margin: 0, lineHeight: 1.6 }}>
            {message.content}
          </Paragraph>
          <Text
            type="secondary"
            style={{
              fontSize: "11px",
              marginTop: "4px",
              display: "block",
            }}
          >
            {message.timestamp.toLocaleTimeString()}
          </Text>
        </Card>
      </div>
    </div>
  );
};

export default MessageBubble;

