"use client";

import React from 'react';
import { Alert, Button, Space } from 'antd';
import { ExclamationCircleOutlined, ReloadOutlined } from '@ant-design/icons';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry?: () => void }>;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }
    
    // Here you could also send error to logging service
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
      }

      // Default fallback UI
      return (
        <div style={{ 
          padding: '40px', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: '400px'
        }}>
          <Alert
            icon={<ExclamationCircleOutlined />}
            message="Something went wrong"
            description={
              <div>
                <p>An unexpected error occurred in the application.</p>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details style={{ marginTop: '16px' }}>
                    <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
                      Error Details (Development Mode)
                    </summary>
                    <pre style={{ 
                      fontSize: '12px', 
                      backgroundColor: '#f5f5f5', 
                      padding: '8px',
                      borderRadius: '4px',
                      maxHeight: '200px',
                      overflow: 'auto'
                    }}>
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            }
            type="error"
            showIcon
            style={{ maxWidth: '600px' }}
            action={
              <Space direction="vertical">
                <Button 
                  type="primary" 
                  icon={<ReloadOutlined />}
                  onClick={this.handleRetry}
                >
                  Try Again
                </Button>
                <Button 
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
              </Space>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC wrapper for functional components
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error?: Error; retry?: () => void }>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default ErrorBoundary;
