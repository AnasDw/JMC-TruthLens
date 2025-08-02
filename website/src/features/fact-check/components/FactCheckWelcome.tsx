"use client";

import React, { useState } from "react";
import { Typography, Card, Flex, Button, Grid } from "antd";
import {
  CheckCircleOutlined,
  EyeOutlined,
  SendOutlined,
  StarOutlined,
} from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import Image from "next/image";
import { FloatingActions } from "@/features/components";

const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

interface FactCheckWelcomeProps {
  injectedText?: string;
  submitFactCheck: (inputValue: string) => Promise<void>;
  loading: boolean;
}

export const FactCheckWelcome: React.FC<FactCheckWelcomeProps> = ({
  injectedText,
  submitFactCheck,
  loading,
}) => {
  const [inputValue, setInputValue] = useState("");

  const { lg } = useBreakpoint();

  React.useEffect(() => {
    if (injectedText) {
      setInputValue(injectedText);
    }
  }, [injectedText]);

  const handleSubmit = () => {
    if (inputValue.trim()) {
      submitFactCheck(inputValue);
    }
  };

  const features = [
    {
      icon: <CheckCircleOutlined style={{ fontSize: 20, color: "#52c41a" }} />,
      title: "AI-Powered Verification",
      description: "Advanced fact-checking with multiple source verification",
    },
    {
      icon: <StarOutlined style={{ fontSize: 20, color: "#1677ff" }} />,
      title: "Instant Analysis",
      description: "Get comprehensive results in seconds",
    },
    {
      icon: <EyeOutlined style={{ fontSize: 20, color: "#722ed1" }} />,
      title: "Transparent Sources",
      description: "Clear attribution and credibility scores",
    },
  ];

  return (
    <Flex
      align="center"
      justify="center"
      style={{
        padding: "40px 20px",
        height: "100%",
      }}
    >
      <Flex
        align="center"
        justify="center"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <Flex vertical align="center" justify="center" gap={48}>
          {/* Hero Section */}
          <Flex
            justify="center"
            align="center"
            vertical
            gap={24}
            style={{ textAlign: "center" }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: "20px",
                padding: "8px",
                marginBottom: "16px",
                boxShadow: "0 10px 30px rgba(102, 126, 234, 0.3)",
              }}
            >
              <Image
                src="/eye.gif"
                alt="TruthLens Eye"
                width={48}
                height={48}
                style={{
                  objectFit: "contain",
                }}
                unoptimized
              />
            </div>

            <Title
              level={1}
              style={{
                margin: 0,
                fontSize: "56px",
                fontWeight: 700,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                lineHeight: 1.2,
              }}
            >
              TruthLens AI
            </Title>

            <Paragraph
              style={{
                fontSize: "20px",
                color: "#64748b",
                margin: 0,
                maxWidth: "600px",
                lineHeight: 1.6,
              }}
            >
              Verify the truthfulness of any statement, news article, or claim
              with cutting-edge AI-powered fact-checking technology
            </Paragraph>
          </Flex>

          {lg && (
            <Flex
              wrap
              gap={24}
              justify="center"
              style={{ width: "100%", maxWidth: "900px" }}
            >
              {features.map((feature, index) => (
                <Card
                  key={index}
                  style={{
                    borderRadius: "16px",
                    border: "none",
                    background: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                    minWidth: "280px",
                    flex: 1,
                  }}
                  styles={{ body: { padding: "24px", textAlign: "center" } }}
                >
                  <Flex vertical align="center" gap={12}>
                    <div
                      style={{
                        background: "#f8fafc",
                        borderRadius: "12px",
                        padding: "12px",
                        marginBottom: "8px",
                      }}
                    >
                      {feature.icon}
                    </div>
                    <Title level={5} style={{ margin: 0, color: "#1e293b" }}>
                      {feature.title}
                    </Title>
                    <Text style={{ color: "#64748b", fontSize: "14px" }}>
                      {feature.description}
                    </Text>
                  </Flex>
                </Card>
              ))}
            </Flex>
          )}

          {/* Input Section */}
          <div style={{ width: "100%", maxWidth: "700px" }}>
            <Flex vertical gap={16}>
              <div style={{ position: "relative" }}>
                <TextArea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Enter any statement, claim, or news article you want to verify..."
                  style={{
                    height: 140,
                    resize: "none",
                    borderRadius: "16px",
                    border: "2px solid #e2e8f0",
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(10px)",
                    boxShadow:
                      "-8px -8px 32px 0 rgba(103, 89, 223, 0.15), 8px 8px 24px 0 rgba(239, 185, 253, 0.6)",
                    fontSize: "16px",
                    padding: "16px",
                    transition: "all 0.3s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.boxShadow =
                      "-8px -8px 32px 0 rgba(103, 89, 223, 0.25), 8px 8px 24px 0 rgba(239, 185, 253, 0.8), 0 0 0 3px rgba(102, 126, 234, 0.1)";
                  }}
                  readOnly={loading}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.boxShadow =
                      "-8px -8px 32px 0 rgba(103, 89, 223, 0.15), 8px 8px 24px 0 rgba(239, 185, 253, 0.6)";
                  }}
                />

                <Button
                  type="primary"
                  size="large"
                  icon={<SendOutlined />}
                  onClick={handleSubmit}
                  disabled={!inputValue.trim()}
                  loading={loading}
                  style={{
                    position: "absolute",
                    bottom: "16px",
                    right: "16px",
                    borderRadius: "12px",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    ...(inputValue.trim() && {
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      boxShadow: "0 4px 16px rgba(102, 126, 234, 0.3)",
                      transform: "scale(1.02)",
                    }),
                    border: "none",
                    height: "44px",
                    paddingLeft: "20px",
                    paddingRight: "20px",
                  }}
                />
              </div>
            </Flex>
          </div>
        </Flex>
      </Flex>
      <FloatingActions onTipsClick={setInputValue} />
    </Flex>
  );
};

