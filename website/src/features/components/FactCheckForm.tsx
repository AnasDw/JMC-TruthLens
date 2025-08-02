"use client";

import React from "react";
import { Card, Input, Button, Typography, Form } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { FactCheckFormProps } from "@/types";

const { TextArea } = Input;
const { Text } = Typography;

const FactCheckForm: React.FC<FactCheckFormProps> = ({
  title,
  content,
  onTitleChange,
  onContentChange,
  onSubmit,
  loading = false,
}) => {
  const [form] = Form.useForm();

  const handleSubmit = () => {
    form.validateFields().then(() => {
      onSubmit();
    });
  };

  const isDisabled = loading || !title.trim() || !content.trim();

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      <Card
        style={{
          borderRadius: "16px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
          border: "1px solid #e6f4ff",
        }}
        styles={{ body: { padding: "32px" } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label={
              <Text strong style={{ fontSize: "16px" }}>
                Title or Claim
              </Text>
            }
            name="title"
            rules={[
              {
                required: true,
                message: "Please enter a title or claim to verify",
              },
              { min: 10, message: "Title should be at least 10 characters" },
            ]}
          >
            <Input
              size="large"
              placeholder="e.g., 'Climate change is causing more frequent hurricanes'"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              style={{
                borderRadius: "8px",
                fontSize: "16px",
              }}
            />
          </Form.Item>

          <Form.Item
            label={
              <Text strong style={{ fontSize: "16px" }}>
                Full Text or Context
              </Text>
            }
            name="content"
            rules={[
              {
                required: true,
                message: "Please provide the full text or context",
              },
              { min: 20, message: "Content should be at least 20 characters" },
            ]}
          >
            <TextArea
              size="large"
              placeholder="Paste the article, statement, or provide additional context for fact-checking..."
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              autoSize={{ minRows: 4, maxRows: 8 }}
              style={{
                borderRadius: "8px",
                fontSize: "16px",
                lineHeight: 1.6,
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "center" }}>
            <Button
              type="primary"
              size="large"
              icon={<SearchOutlined />}
              onClick={handleSubmit}
              loading={loading}
              disabled={isDisabled}
              style={{
                borderRadius: "8px",
                height: "48px",
                fontSize: "16px",
                fontWeight: 600,
                paddingLeft: "32px",
                paddingRight: "32px",
                background: isDisabled ? undefined : "#1677ff",
                borderColor: isDisabled ? undefined : "#1677ff",
              }}
            >
              {loading ? "Analyzing..." : "Verify Truth"}
            </Button>
          </Form.Item>
        </Form>

        <Text
          type="secondary"
          style={{
            fontSize: "12px",
            display: "block",
            textAlign: "center",
            marginTop: "16px",
          }}
        >
          Analysis powered by AI • Results may require human verification for
          critical decisions
        </Text>
      </Card>
    </div>
  );
};

export default FactCheckForm;

