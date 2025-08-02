"use client";

import React from "react";
import {
  Card,
  Typography,
  Progress,
  Tag,
  Button,
  Space,
  List,
  Divider,
} from "antd";
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  LinkOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { FactCheckResultProps } from "@/types";

const { Title, Text, Paragraph } = Typography;

const FactCheckResult: React.FC<FactCheckResultProps> = ({
  result,
  onNewCheck,
}) => {
  const getVeracityConfig = (veracity: string) => {
    switch (veracity) {
      case "true":
        return {
          color: "#52c41a",
          backgroundColor: "#f6ffed",
          borderColor: "#52c41a",
          icon: <CheckCircleOutlined />,
          label: "TRUE",
          description: "This statement is supported by credible sources",
        };
      case "partially-true":
        return {
          color: "#faad14",
          backgroundColor: "#fffbe6",
          borderColor: "#faad14",
          icon: <ExclamationCircleOutlined />,
          label: "PARTIALLY TRUE",
          description:
            "This statement has some truth but lacks context or has inaccuracies",
        };
      case "false":
        return {
          color: "#ff4d4f",
          backgroundColor: "#fff2f0",
          borderColor: "#ff4d4f",
          icon: <CloseCircleOutlined />,
          label: "FALSE",
          description: "This statement is contradicted by available evidence",
        };
      case "misleading":
        return {
          color: "#ff7a45",
          backgroundColor: "#fff2e8",
          borderColor: "#ff7a45",
          icon: <ExclamationCircleOutlined />,
          label: "MISLEADING",
          description:
            "This statement may be technically true but presented in a misleading way",
        };
      default:
        return {
          color: "#666",
          backgroundColor: "#f5f5f5",
          borderColor: "#d9d9d9",
          icon: <ExclamationCircleOutlined />,
          label: "UNKNOWN",
          description: "Unable to verify this statement",
        };
    }
  };

  const config = getVeracityConfig(result.veracity);

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      <Card
        style={{
          borderRadius: "16px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
          border: `2px solid ${config.borderColor}`,
          backgroundColor: config.backgroundColor,
        }}
        styles={{ body: { padding: "32px" } }}
      >
        {/* Header with result */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              fontSize: "48px",
              color: config.color,
              marginBottom: "16px",
            }}
          >
            {config.icon}
          </div>

          <Tag
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              padding: "8px 16px",
              border: `2px solid ${config.color}`,
              backgroundColor: config.backgroundColor,
              color: config.color,
            }}
          >
            {config.label}
          </Tag>

          <Paragraph
            style={{
              fontSize: "16px",
              color: "#666",
              marginTop: "12px",
              marginBottom: "0",
            }}
          >
            {config.description}
          </Paragraph>
        </div>

        {/* Confidence Score */}
        <div style={{ marginBottom: "32px" }}>
          <Text
            strong
            style={{ fontSize: "16px", display: "block", marginBottom: "8px" }}
          >
            Confidence Level
          </Text>
          <Progress
            percent={result.confidence}
            strokeColor={config.color}
            size="default"
            format={(percent) => `${percent}%`}
          />
        </div>

        <Divider />

        {/* Analyzed Content */}
        <div style={{ marginBottom: "32px" }}>
          <Title level={4} style={{ marginBottom: "16px" }}>
            📝 Analyzed Statement
          </Title>
          <Card
            size="small"
            style={{
              backgroundColor: "#fafafa",
              border: "1px solid #f0f0f0",
            }}
          >
            <Text
              strong
              style={{
                fontSize: "16px",
                display: "block",
                marginBottom: "8px",
              }}
            >
              {result.title}
            </Text>
            <Paragraph style={{ margin: 0, color: "#666" }}>
              {result.content}
            </Paragraph>
          </Card>
        </div>

        {/* Explanation */}
        <div style={{ marginBottom: "32px" }}>
          <Title level={4} style={{ marginBottom: "16px" }}>
            🔍 Analysis Explanation
          </Title>
          <Card
            size="small"
            style={{
              backgroundColor: "#fff",
              border: "1px solid #f0f0f0",
            }}
          >
            <Paragraph style={{ margin: 0, lineHeight: 1.6 }}>
              {result.explanation}
            </Paragraph>
          </Card>
        </div>

        {/* Sources */}
        {result.sources && result.sources.length > 0 && (
          <div style={{ marginBottom: "32px" }}>
            <Title level={4} style={{ marginBottom: "16px" }}>
              📚 Sources & References
            </Title>
            <List
              itemLayout="horizontal"
              dataSource={result.sources}
              renderItem={(source) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          backgroundColor: "#e6f4ff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <LinkOutlined style={{ color: "#1677ff" }} />
                      </div>
                    }
                    title={
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: "14px", fontWeight: 500 }}
                      >
                        {source.title}
                      </a>
                    }
                    description={
                      <div>
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          Credibility: {(source.credibility * 100).toFixed(0)}%
                        </Text>
                        <br />
                        <Text
                          type="secondary"
                          style={{ fontSize: "11px", wordBreak: "break-all" }}
                        >
                          {source.url}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        )}

        {/* Actions */}
        <div style={{ textAlign: "center", marginTop: "32px" }}>
          <Space size="large">
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              size="large"
              onClick={onNewCheck}
              style={{
                borderRadius: "8px",
                height: "48px",
                paddingLeft: "24px",
                paddingRight: "24px",
              }}
            >
              Check Another Statement
            </Button>
          </Space>
        </div>

        <Text
          type="secondary"
          style={{
            fontSize: "11px",
            display: "block",
            textAlign: "center",
            marginTop: "16px",
          }}
        >
          Analysis completed on {result.timestamp.toLocaleString()} • Always
          cross-reference with multiple sources for important decisions
        </Text>
      </Card>
    </div>
  );
};

export default FactCheckResult;

