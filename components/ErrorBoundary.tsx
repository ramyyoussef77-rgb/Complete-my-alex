import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  // FIX: Refactor state initialization to a class property to resolve transpilation issue.
  state: State = { hasError: false };

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
            <h1 className="text-2xl font-bold text-accent">Something went wrong.</h1>
            <p className="mt-2 text-base-content/80 dark:text-base-content-dark/80">
                An unexpected error occurred. Please try refreshing the page.
            </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;