import React from "react";
import { Layout } from "antd";
import {
  FactCheckForm,
  FactCheckResult,
  FactCheckWelcome,
  useFactCheck,
} from "../features/fact-check";
import { ChatHeader, FloatingActions } from "@/features/components";

const { Content } = Layout;

export default function Home() {
  const {
    content,
    result,
    loading,
    setContent,
    submitFactCheck,
    resetForm,
    contextHolder,
  } = useFactCheck();

  return (
    <>
      {contextHolder}
      <Layout
        style={{ height: "100vh", background: "#fafafa", overflow: "hidden" }}
      >
        <ChatHeader />
        <Layout>
          <Content
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            {true ? (
              <FactCheckWelcome
                injectedText={content}
                submitFactCheck={submitFactCheck}
                loading={loading}
              />
            ) : result ? (
              <FactCheckResult result={result} onNewCheck={resetForm} />
            ) : (
              <FactCheckForm
                title={"title"}
                content={content}
                onTitleChange={() => {}}
                onContentChange={setContent}
                onSubmit={() => submitFactCheck(content)}
                loading={loading}
              />
            )}
          </Content>
          <FloatingActions onTipsClick={setContent} />
        </Layout>
      </Layout>
    </>
  );
}

