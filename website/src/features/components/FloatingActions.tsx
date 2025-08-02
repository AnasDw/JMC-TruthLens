"use client";

import React from "react";
import { FloatButton, Popover, Tag, Flex, Typography } from "antd";
import { BulbOutlined } from "@ant-design/icons";
import type { FloatingActionsProps } from "@/types";

const { Text } = Typography;

const FloatingActions: React.FC<FloatingActionsProps> = ({ onTipsClick }) => {
  const samplePrompts = [
    "Climate change is causing more frequent hurricanes in the Atlantic",
    "COVID-19 vaccines contain microchips for tracking people",
    "5G networks cause cancer and other health problems",
    "The 2020 US election was rigged with widespread voter fraud",
  ];

  const handlePromptClick = (prompt: string) => {
    // This will trigger the onTipsClick with the selected prompt
    if (onTipsClick) {
      onTipsClick(prompt);
    }
  };

  const tipsContent = (
    <div style={{ maxWidth: "min-content", padding: 8 }}>
      <Text
        style={{
          color: "#64748b",
          fontSize: "14px",
          fontWeight: 500,
          display: "block",
          marginBottom: 12,
        }}
      >
        💡 Not sure where to start? Try one of these:
      </Text>
      <Flex wrap gap={8}>
        {samplePrompts.map((prompt, index) => (
          <Tag
            style={{
              borderRadius: "16px",
              padding: "6px 12px",
              color: "#475569",
              cursor: "pointer",
              border: "1px solid #e2e8f0",
              background: "rgba(255, 255, 255, 0.9)",
              fontSize: "12px",
              fontWeight: 500,
              transition: "all 0.2s ease",
              marginBottom: 4,
              lineHeight: 1.3,
            }}
            key={index}
            onClick={() => handlePromptClick(prompt)}
            onMouseEnter={(e) => {
              const target = e.target as HTMLElement;
              target.style.background =
                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
              target.style.color = "white";
              target.style.transform = "scale(1.02)";
              target.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)";
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLElement;
              target.style.background = "rgba(255, 255, 255, 0.9)";
              target.style.color = "#475569";
              target.style.transform = "scale(1)";
              target.style.boxShadow = "none";
            }}
          >
            {prompt}
          </Tag>
        ))}
      </Flex>
    </div>
  );

  return (
    <FloatButton.Group>
      <Popover
        content={tipsContent}
        trigger="click"
        placement="leftTop"
        styles={{
          body: {
            borderRadius: 12,
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.15)",
          },
        }}
        style={{
          zIndex: 1000,
        }}
      >
        <FloatButton icon={<BulbOutlined />} tooltip="Tips & Examples" />
      </Popover>
    </FloatButton.Group>
  );
};

export default FloatingActions;

