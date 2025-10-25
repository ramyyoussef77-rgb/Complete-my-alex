
import React, { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, State> {
  public state: State = { hasError: false };

  // FIX: Removed redundant constructor. The `props` are correctly managed by `React.Component` base class without an explicit constructor if only `super(props)` is called.
  // constructor(props: ErrorBoundaryProps) {
  //   super(props);
  // }

  static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    const { children } = this.props; 
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

    return children;
  }
}

export default ErrorBoundary;