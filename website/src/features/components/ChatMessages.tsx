"use client";

import React from "react";
import { Space } from "antd";
import MessageBubble from "./MessageBubble";
import type { ChatMessagesProps } from "@/types";

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        maxWidth: "800px",
        margin: "0 auto",
        width: "100%",
        paddingBottom: "20px",
      }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </Space>
    </div>
  );
};

export default ChatMessages;

