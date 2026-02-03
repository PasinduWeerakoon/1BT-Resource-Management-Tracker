/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing
 */

import React from 'react';
import { Result, Button } from 'antd';
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons';
import logger from '@utils/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to error reporting service
    logger.error('ErrorBoundary caught an error:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      error,
      errorInfo,
    });

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Optionally reload the page
    if (this.props.resetOnReload) {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default fallback UI
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          backgroundColor: '#f5f5f5',
        }}>
          <Result
            status="500"
            title="500"
            subTitle={
              this.props.showDetails && this.state.error
                ? this.state.error.toString()
                : "Sorry, something went wrong. We're working on fixing this issue."
            }
            extra={[
              <Button
                type="primary"
                key="reload"
                icon={<ReloadOutlined />}
                onClick={this.handleReset}
              >
                Try Again
              </Button>,
              <Button
                key="home"
                icon={<HomeOutlined />}
                onClick={this.handleGoHome}
              >
                Go Home
              </Button>,
            ]}
          >
            {this.props.showDetails && this.state.errorInfo && (
              <div style={{
                marginTop: 20,
                padding: 16,
                backgroundColor: '#fff',
                borderRadius: 4,
                maxHeight: 300,
                overflow: 'auto',
                textAlign: 'left',
              }}>
                <details>
                  <summary style={{ cursor: 'pointer', marginBottom: 8 }}>
                    Error Details (Click to expand)
                  </summary>
                  <pre style={{
                    fontSize: 12,
                    color: '#666',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {this.state.error && this.state.error.toString()}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              </div>
            )}
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
