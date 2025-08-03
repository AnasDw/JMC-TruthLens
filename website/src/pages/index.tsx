import React, { useEffect, useState, useRef } from "react";
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

  // Separate effect to handle router readiness
  useEffect(() => {
    if (router.isReady) {
      setIsRouterReady(true);
    }
  }, [router.isReady]);

  // Separate effect to handle task_id changes
  const previousTaskIdRef = useRef(factCheckTaskId);

  useEffect(() => {
    if (!isRouterReady) {
      return;
    }

    const currentTaskId = typeof task_id === "string" ? task_id.trim() : null;

    if (!currentTaskId) {
      // Only clear if we previously had a task ID
      if (previousTaskIdRef.current) {
        clearState();
        previousTaskIdRef.current = null;
      }
      return;
    }

    // Only update if the task ID is different from previous
    if (currentTaskId !== previousTaskIdRef.current) {
      setFactCheckTaskId(currentTaskId);
      previousTaskIdRef.current = currentTaskId;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRouterReady, task_id]); // Intentionally excluding clearState and setFactCheckTaskId to prevent infinite loop

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
                height: "calc(100vh - 56px)",
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

