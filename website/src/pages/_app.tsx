import "../styles/globals.css";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ConfigProvider } from "antd";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import LoadingScreen from "../features/components/LoadingScreen";
import ErrorBoundary from "../components/ErrorBoundary";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 2,
          },
        },
      })
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </Head>
      <QueryClientProvider client={queryClient}>
        <AntdRegistry>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: "#764ba2",
              },
            }}
          >
            <ErrorBoundary>
              <Component {...pageProps} />
            </ErrorBoundary>
          </ConfigProvider>
        </AntdRegistry>
      </QueryClientProvider>
    </>
  );
}

