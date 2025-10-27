import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundaryClass extends Component<Props & { resolvedTheme: 'light' | 'dark' }, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const { resolvedTheme } = this.props;
      return this.props.fallback || (
        <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'theme-bg-gradient'} flex items-center justify-center ${resolvedTheme === 'dark' ? 'text-white' : 'theme-text-primary'} font-sans p-4`}>
          <div className="max-w-md text-center">
            <div className="text-6xl mb-4"></div>
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className={`${resolvedTheme === 'dark' ? 'text-slate-400' : 'theme-text-secondary'} mb-6`}>
              We encountered an unexpected error. Please refresh the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Refresh Page
            </button>
            {/* {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-slate-400 hover:text-white">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 p-4 bg-slate-800 rounded text-sm text-red-400 overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )} */}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const ErrorBoundary: React.FC<Props> = ({ children, fallback }) => {
  const { resolvedTheme } = useTheme();
  return (
    <ErrorBoundaryClass resolvedTheme={resolvedTheme} fallback={fallback}>
      {children}
    </ErrorBoundaryClass>
  );
};

export default ErrorBoundary;
