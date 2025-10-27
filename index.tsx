import React from 'react';
import ReactDOM from 'react-dom/client';
import App1 from './App1';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NetworkProvider } from './contexts/NetworkContext';
import ErrorBoundary from './components/ErrorBoundary';

// if (process.env.NODE_ENV === 'production') {
//   // Override console methods to hide logs in production
//   if (typeof window !== 'undefined') {
//     window.console.log = () => {};
//     window.console.info = () => {};
//     window.console.warn = () => {};
//     window.console.error = () => {};
//     window.console.debug = () => {};
//   }
// }

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        <NetworkProvider>
          <AuthProvider>
            <App1 />
          </AuthProvider>
        </NetworkProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </React.StrictMode>
);
