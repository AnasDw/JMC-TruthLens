"use client";

import React, { useState } from "react";
import { Layout, Space, Typography, Button, Tooltip } from "antd";
import { ShareAltOutlined, HistoryOutlined } from "@ant-design/icons";
import { VerificationHistory } from "../../components/VerificationHistory";

import type { ChatHeaderProps } from "@/types";
import { useRouter } from "next/router";

const { Header } = Layout;
const { Title } = Typography;

const ChatHeader: React.FC<ChatHeaderProps> = ({
  title = "TruthLens AI",
  onShareConversation,
}) => {
  const router = useRouter();
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleHistoryClick = () => {
    setHistoryOpen(true);
  };

  const handleTaskSelect = (taskId: string) => {
    router.push({
      pathname: "/",
      query: { task_id: taskId },
    });
  };

  return (
    <Header
      style={{
        background: "#fff",
        padding: "0 24px",
        borderBottom: "1px solid #f0f0f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Space onClick={() => router.push("/")} style={{ cursor: "pointer" }}>
        <Title
          level={4}
          style={{
            margin: 0,
            fontWeight: 700,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            lineHeight: 1.2,
          }}
        >
          {title}
        </Title>
      </Space>

      <Space>
        <Tooltip title="Share verification">
          <Button
            icon={<ShareAltOutlined />}
            type="text"
            onClick={onShareConversation}
          />
        </Tooltip>
        <Tooltip title="Verification history">
          <Button
            icon={<HistoryOutlined />}
            type="text"
            onClick={handleHistoryClick}
          />
        </Tooltip>
      </Space>

      <VerificationHistory
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelectTask={handleTaskSelect}
      />
    </Header>
  );
};

export default ChatHeader;

