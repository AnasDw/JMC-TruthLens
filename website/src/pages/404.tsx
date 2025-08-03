import React from "react";
import { Button, Typography } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import { Layout } from "antd";
import Head from "next/head";
import Image from "next/image";

const { Paragraph } = Typography;
const { Content } = Layout;

export default function Custom404() {
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <>
      <Head>
        <title>404 - Page Not Found | TruthLens AI</title>
        <meta
          name="description"
          content="The page you're looking for doesn't exist. Return to TruthLens AI to continue fact-checking."
        />
      </Head>

      <Layout style={{ minHeight: "100vh", background: "#fafafa" }}>
        <Content
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px",
          }}
        >
          <div style={{ maxWidth: "600px", textAlign: "center" }}>
            <div
              style={{
                fontSize: "120px",
                marginBottom: "20px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontWeight: "bold",
                lineHeight: 1,
              }}
            >
              404
            </div>

            <Paragraph
              style={{
                fontSize: "18px",
                color: "#64748b",
                marginBottom: "32px",
                lineHeight: 1.6,
                maxWidth: 450,
              }}
            >
              Sorry! We can&apos;t find this page. Don&apos;t worry, our
              fact-checking still works great!
            </Paragraph>

            {/* Single Action Button */}
            <Button
              type="primary"
              size="large"
              icon={<HomeOutlined />}
              onClick={handleGoHome}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                borderRadius: "8px",
                height: "48px",
                paddingLeft: "32px",
                paddingRight: "32px",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              Back to Dashboard
            </Button>
          </div>
        </Content>
      </Layout>
    </>
  );
}

