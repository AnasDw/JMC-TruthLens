"use client";

import React from "react";
import { Layout, Button, Input, Space, Divider, Typography } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import type { ChatSidebarProps } from "@/types";

const { Sider } = Layout;
const { Text } = Typography;

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  collapsed,
  onCollapse,
  conversationHistory,
  onNewChat,
}) => {
  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={280}
      style={{
        background: "#fff",
        borderRight: "1px solid #f0f0f0",
      }}
    >
      <div style={{ padding: "16px" }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            block
            size="large"
            style={{
              borderRadius: "8px",
              background: "#1677ff",
              border: "none",
            }}
            onClick={onNewChat}
          >
            {!collapsed && "New Chat"}
          </Button>

          {!collapsed && (
            <>
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search conversations"
                style={{ borderRadius: "6px" }}
              />

              <Divider style={{ margin: "12px 0" }} />

              <div>
                <Text
                  type="secondary"
                  style={{
                    fontSize: "12px",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  RECENT CONVERSATIONS
                </Text>
                <Space direction="vertical" style={{ width: "100%" }}>
                  {conversationHistory.map((chat, index) => (
                    <Button
                      key={index}
                      type="text"
                      style={{
                        textAlign: "left",
                        height: "auto",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontSize: "13px",
                        }}
                      >
                        {chat}
                      </div>
                    </Button>
                  ))}
                </Space>
              </div>
            </>
          )}
        </Space>
      </div>
    </Sider>
  );
};

export default ChatSidebar;

