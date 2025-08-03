"use client";

import React, { memo, useCallback } from "react";
import { Card, Input, Button, Typography, Form } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { FactCheckFormProps } from "../types";

const { TextArea } = Input;
const { Text } = Typography;

export const FactCheckForm: React.FC<FactCheckFormProps> = memo(({
  title,
  content,
  onTitleChange,
  onContentChange,
  onSubmit,
  loading = false,
}) => {
  const [form] = Form.useForm();

  const handleSubmit = useCallback(() => {
    form.validateFields().then(() => {
      onSubmit();
    });
  }, [form, onSubmit]);

  const handleTitleChange = useCallback((value: string) => {
    onTitleChange(value);
  }, [onTitleChange]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onContentChange(e.target.value);
  }, [onContentChange]);

  const isDisabled = loading || !title.trim() || !content.trim();

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "0 auto",
        width: "100%",
        padding: "0 12px",
      }}
      role="main"
      aria-label="Fact-checking form"
    >
      <Card
        style={{
          borderRadius: "12px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          border: "1px solid #e6f4ff",
          width: "100%",
        }}
        styles={{ 
          body: { 
            padding: "clamp(12px, 3vw, 20px)",
          } 
        }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label={
              <Text strong style={{ fontSize: "clamp(14px, 2.5vw, 16px)" }}>
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
              onChange={(e) => handleTitleChange(e.target.value)}
              aria-label="Claim title input"
              aria-describedby="title-help"
              style={{
                borderRadius: "8px",
                fontSize: "clamp(13px, 2vw, 14px)",
                padding: "clamp(6px, 1.5vw, 8px) clamp(8px, 2vw, 12px)",
                minHeight: "40px",
              }}
            />
          </Form.Item>
          <div id="title-help" className="sr-only">
            Enter a clear, specific claim or statement that you want to fact-check
          </div>

          <Form.Item
            label={
              <Text strong style={{ fontSize: "clamp(14px, 2.5vw, 16px)" }}>
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
              onChange={handleContentChange}
              autoSize={{ minRows: 2, maxRows: 5 }}
              aria-label="Content or context input"
              aria-describedby="content-help"
              style={{
                borderRadius: "8px",
                fontSize: "clamp(13px, 2vw, 14px)",
                lineHeight: 1.4,
                padding: "clamp(6px, 1.5vw, 8px) clamp(8px, 2vw, 12px)",
              }}
            />
          </Form.Item>
          <div id="content-help" className="sr-only">
            Provide the full text, article, or additional context related to the claim you want to fact-check
          </div>

          <Form.Item style={{ marginBottom: 0, textAlign: "center" }}>
            <Button
              type="primary"
              size="large"
              icon={<SearchOutlined />}
              onClick={handleSubmit}
              loading={loading}
              disabled={isDisabled}
              aria-label={loading ? "Analyzing claim..." : "Start fact-checking verification"}
              aria-describedby="submit-help"
              style={{
                borderRadius: "8px",
                height: "clamp(36px, 6vw, 40px)",
                fontSize: "clamp(12px, 2vw, 14px)",
                fontWeight: 600,
                paddingLeft: "clamp(12px, 3vw, 20px)",
                paddingRight: "clamp(12px, 3vw, 20px)",
                background: isDisabled ? undefined : "#1677ff",
                borderColor: isDisabled ? undefined : "#1677ff",
                width: "100%",
                maxWidth: "200px",
              }}
            >
              {loading ? "Analyzing..." : "Verify Truth"}
            </Button>
          </Form.Item>
          <div id="submit-help" className="sr-only">
            Click to start the AI-powered fact-checking analysis of your claim
          </div>
        </Form>

        <Text
          type="secondary"
          style={{
            fontSize: "clamp(10px, 2vw, 12px)",
            display: "block",
            textAlign: "center",
            marginTop: "16px",
            lineHeight: 1.4,
            padding: "0 8px",
          }}
        >
          Analysis powered by AI • Results may require human verification for
          critical decisions
        </Text>
      </Card>
    </div>
  );
});

FactCheckForm.displayName = 'FactCheckForm';

