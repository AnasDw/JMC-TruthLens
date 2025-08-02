"use client";

import React from "react";
import {
  Layout,
  Space,
  Typography,
  Avatar,
  Button,
  Dropdown,
  Tooltip,
} from "antd";
import {
  RobotOutlined,
  ShareAltOutlined,
  HistoryOutlined,
  UserOutlined,
  SettingOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import type { ChatHeaderProps } from "@/types";

const { Header } = Layout;
const { Title } = Typography;

const ChatHeader: React.FC<ChatHeaderProps> = ({
  title = "TruthLens AI",
  onShareConversation,
  onViewHistory,
  onUserMenuClick,
}) => {
  const userMenuItems: MenuProps["items"] = [
    {
      key: "1",
      icon: <UserOutlined />,
      label: "Profile",
    },
    {
      key: "2",
      icon: <SettingOutlined />,
      label: "Settings",
    },
    {
      type: "divider",
    },
    {
      key: "3",
      label: "Sign out",
    },
  ];

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    onUserMenuClick?.(key);
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
      <Space>
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
        <Tooltip title="Share conversation">
          <Button
            icon={<ShareAltOutlined />}
            type="text"
            onClick={onShareConversation}
          />
        </Tooltip>
        <Tooltip title="Conversation history">
          <Button
            icon={<HistoryOutlined />}
            type="text"
            onClick={onViewHistory}
          />
        </Tooltip>
      </Space>
    </Header>
  );
};

export default ChatHeader;

