import React from 'react';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="text-sm text-slate-400 mr-2">Theme:</span>
      <div className="flex bg-slate-800/50 rounded-lg p-1">
        <button
          className="flex items-center gap-1 px-3 py-1 text-xs rounded-md bg-blue-600 text-white shadow-lg"
          disabled
          title="Dark theme (disabled)"
        >
          <span>🌙</span>
          <span className="hidden sm:inline">Dark</span>
        </button>
      </div>
    </div>
  );
};

export default ThemeToggle;
