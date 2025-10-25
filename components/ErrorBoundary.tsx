import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  // FIX: Initialize state as a class property. This is a common pattern for React class components and resolves issues with 'this.state' and 'this.props' not being recognized.
  public state: State = { hasError: false };

  static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
            <h1 className="text-2xl font-bold text-accent">Something went wrong.</h1>
            <p className="mt-2 text-base-content/80 dark:text-base-content-dark/80">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-secondary text-base-dark-100 font-semibold rounded-md"
            >
              Refresh
            </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
