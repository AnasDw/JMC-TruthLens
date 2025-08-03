import React from 'react';
import { Alert, Button, Typography, Space } from 'antd';
import { ExclamationCircleOutlined, ReloadOutlined, HomeOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';

const { Title, Text } = Typography;

interface FactCheckErrorFallbackProps {
  error?: Error;
  retry?: () => void;
}

export const FactCheckErrorFallback: React.FC<FactCheckErrorFallbackProps> = ({
  error,
  retry
}) => {
  const router = useRouter();

  return (
    <div style={{ 
      padding: '40px 20px', 
      maxWidth: '500px', 
      margin: '0 auto',
      textAlign: 'center' 
    }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <ExclamationCircleOutlined 
          style={{ fontSize: '48px', color: '#ff7875' }} 
        />
        
        <Title level={3} style={{ color: '#ff7875', margin: 0 }}>
          Fact Check Error
        </Title>
        
        <Alert
          message="Component Error"
          description="There was an error loading the fact-checking component. Please try refreshing or contact support if the problem persists."
          type="error"
          showIcon
          style={{ textAlign: 'left' }}
        />

        {process.env.NODE_ENV === 'development' && error && (
          <Alert
            message="Error Details (Development Only)"
            description={
              <div style={{ textAlign: 'left' }}>
                <Text code style={{ fontSize: '12px' }}>
                  {error.message}
                </Text>
                {error.stack && (
                  <pre style={{ 
                    fontSize: '10px', 
                    marginTop: '8px',
                    overflow: 'auto',
                    maxHeight: '100px'
                  }}>
                    {error.stack}
                  </pre>
                )}
              </div>
            }
            type="warning"
          />
        )}

        <Space wrap style={{ justifyContent: 'center' }}>
          {retry && (
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={retry}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '6px'
              }}
            >
              Try Again
            </Button>
          )}
          
          <Button 
            icon={<HomeOutlined />}
            onClick={() => router.push('/')}
            style={{ borderRadius: '6px' }}
          >
            Go Home
          </Button>
          
          <Button 
            onClick={() => window.location.reload()}
            style={{ borderRadius: '6px' }}
          >
            Refresh Page
          </Button>
        </Space>
      </Space>
    </div>
  );
};
