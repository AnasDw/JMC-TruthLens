import React, { useEffect, useState } from "react";
import { Layout } from "antd";
import {
  FactCheckTaskComponent,
  FactCheckWelcome,
  useFactCheck,
} from "../features/fact-check";
import { ChatHeader } from "@/features/components";
import { useRouter } from "next/router";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { FactCheckErrorFallback } from "../components/FactCheckErrorFallback";

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

  // Track if we're still processing the router query
  const [isRouterReady, setIsRouterReady] = useState(false);

  useEffect(() => {
    // Wait for router to be ready
    if (!router.isReady) {
      return;
    }

    setIsRouterReady(true);

    if (!task_id) {
      clearState();
      return;
    }

    // Validate task_id is a string and not an array
    const validTaskId = typeof task_id === 'string' ? task_id.trim() : null;
    
    // Update task ID if it's different from the current one
    if (validTaskId && validTaskId !== factCheckTaskId) {
      setFactCheckTaskId(validTaskId);
    }
  }, [router.isReady, task_id, factCheckTaskId, clearState, setFactCheckTaskId]);

  // Don't render anything until router is ready
  if (!isRouterReady) {
    return null;
  }

  return (
    <>
      {contextHolder}
      <ErrorBoundary>
        <Layout
          style={{ 
            height: "100vh", 
            background: "#fafafa", 
            overflow: "hidden",
          }}
        >
          <ErrorBoundary>
            <ChatHeader />
          </ErrorBoundary>
          <Layout style={{ flexDirection: "column" }}>
            <Content
              style={{
                display: "flex",
                flexDirection: "column",
                height: "calc(100vh - 56px)", // Subtract smaller header height
                padding: "clamp(4px, 1vw, 8px)",
                overflow: "auto",
              }}
            >
              <ErrorBoundary fallback={FactCheckErrorFallback}>
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
              </ErrorBoundary>
            </Content>
          </Layout>
        </Layout>
      </ErrorBoundary>
    </>
  );
}

