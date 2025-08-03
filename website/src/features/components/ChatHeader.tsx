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
    if (!taskId?.trim()) return;
    
    router.push({
      pathname: "/",
      query: { task_id: taskId.trim() },
    });
  };

  return (
    <Header
      style={{
        background: "#fff",
        padding: "0 clamp(8px, 2vw, 16px)",
        borderBottom: "1px solid #f0f0f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        height: "56px",
        gap: "4px",
      }}
    >
      <Space 
        onClick={() => router.push("/")} 
        style={{ 
          cursor: "pointer",
          flex: "1 1 auto",
          minWidth: "0",
        }}
      >
        <Title
          level={4}
          style={{
            margin: 0,
            fontWeight: 700,
            fontSize: "clamp(14px, 2.5vw, 18px)",
            color: "#764ba2",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            lineHeight: 1.1,
          }}
        >
          {title}
        </Title>
      </Space>

      <Space size="small" style={{ flexShrink: 0 }}>
        <Tooltip title="Share verification">
          <Button
            icon={<ShareAltOutlined />}
            type="text"
            onClick={onShareConversation}
            size="small"
            style={{
              fontSize: "clamp(14px, 2.5vw, 16px)",
              padding: "4px 8px",
            }}
          />
        </Tooltip>
        <Tooltip title="Verification history">
          <Button
            icon={<HistoryOutlined />}
            type="text"
            onClick={handleHistoryClick}
            size="small"
            style={{
              fontSize: "clamp(14px, 2.5vw, 16px)",
              padding: "4px 8px",
            }}
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

