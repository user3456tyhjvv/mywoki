import React from 'react';
import { RefreshIcon } from './Icons';

interface AuthTimeoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const AuthTimeoutModal: React.FC<AuthTimeoutModalProps> = ({ isOpen, onClose, onRefresh }) => {
  if (!isOpen) return null;

  const handleRefresh = () => {
    onClose();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Timed Out</h2>

          <p className="text-gray-600 mb-6 leading-relaxed">
            Your authentication request has timed out. This may be due to a slow network connection or server issues. Please refresh the page to try again.
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <RefreshIcon className="w-5 h-5" />
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthTimeoutModal;
