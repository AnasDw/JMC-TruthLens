import React, { use, useEffect } from "react";
import { Layout } from "antd";
import {
  FactCheckTaskComponent,
  FactCheckWelcome,
  useFactCheck,
} from "../features/fact-check";
import { ChatHeader } from "@/features/components";
import { useRouter } from "next/router";

const { Content } = Layout;

export default function Home() {
  const router = useRouter();
  const { task_id } = router.query;

  const {
    content,
    factCheckTaskId,
    loading,
    hasInputError,
    submitFactCheck,
    resetForm,
    clearState,
    contextHolder,
    setFactCheckTaskId,
  } = useFactCheck();

  useEffect(() => {
    if (!task_id) {
      clearState();
    }

    if (task_id && !factCheckTaskId) {
      setFactCheckTaskId(task_id as string);
    }
  }, [task_id, factCheckTaskId, clearState, setFactCheckTaskId]);

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
              height: "100%",
            }}
          >
            {factCheckTaskId ? (
              <FactCheckTaskComponent
                resetForm={resetForm}
                factCheckTaskId={factCheckTaskId}
              />
            ) : (
              <FactCheckWelcome
                injectedText={content}
                submitFactCheck={submitFactCheck}
                loading={loading}
                hasInputError={hasInputError}
              />
            )}
          </Content>
        </Layout>
      </Layout>
    </>
  );
}

