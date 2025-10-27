'use client'
import React from 'react';
import { 
  DownloadIcon, 
  CodeIcon, 
  QuestionMarkCircleIcon, 
  ShareIcon, 
  CalendarIcon,
  ChartBarIcon,
  RefreshIcon,

} from './Icons';

interface QuickActionsProps {
  domain: string;
  onExport: () => void;
  onAddHelpRequest: (domain: string) => void;
  hasRealData: boolean;
  onManualRefresh: () => void;
  refreshing: boolean;
}

const QuickActions: React.FC<QuickActionsProps> = ({ 
  domain, 
  onExport, 
  onAddHelpRequest, 
  hasRealData,
  onManualRefresh,
  refreshing
}) => {
  const scrollToCodeSnippet = () => {
    const codeSnippetSection = document.getElementById('code-snippet-section');
    if (codeSnippetSection) {
      codeSnippetSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const showInstallationHelp = () => {
    const codeSnippetSection = document.getElementById('code-snippet-section');
    if (codeSnippetSection) {
      codeSnippetSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      // Trigger the help modal after a short delay
      setTimeout(() => {
        const helpButton = document.querySelector('[data-help-button]') as HTMLButtonElement;
        if (helpButton) {
          helpButton.click();
        }
      }, 800);
    }
  };

  const actions = [
    {
      icon: <DownloadIcon className="w-5 h-5" />,
      title: "Export Data",
      description: "Download analytics as JSON",
      onClick: onExport,
      color: "from-green-500 to-emerald-600",
      textColor: "text-white"
    },
    {
      icon: <CodeIcon className="w-5 h-5" />,
      title: "Get Tracking Code",
      description: "Install real-time tracking",
      onClick: scrollToCodeSnippet,
      color: "from-blue-500 to-cyan-600",
      textColor: "text-white"
    },
    {
      icon: <RefreshIcon className="w-5 h-5" />,
      title: refreshing ? "Refreshing..." : "Refresh Now",
      description: "Update analytics data",
      onClick: onManualRefresh,
      disabled: refreshing,
      color: refreshing ? "from-gray-500 to-gray-600" : "from-purple-500 to-indigo-600",
      textColor: "text-white"
    },
    {
      icon: <QuestionMarkCircleIcon className="w-5 h-5" />,
      title: "Installation Help",
      description: "Get expert support",
      onClick: showInstallationHelp,
      color: "from-orange-500 to-red-600",
      textColor: "text-white"
    }
  ];

  const tips = hasRealData ? [
    {
      icon: "📊",
      text: "Real-time data is updating every 15 seconds"
    },
    {
      icon: "🎯",
      text: "Focus on pages with high exit rates first"
    },
    {
      icon: "📈",
      text: "Monitor traffic sources for best ROI"
    },
    {
      icon: "⏰",
      text: "Check analytics regularly for trends"
    }
  ] : [
    {
      icon: "🚀",
      text: "Install the tracking code to start collecting real data"
    },
    {
      icon: "📝",
      text: "Add the script to your website's head section"
    },
    {
      icon: "✅",
      text: "Data will appear here within minutes of installation"
    },
    {
      icon: "💡",
      text: "Need help? Request installation support"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="bg-slate-800/50 rounded-2xl p-6 shadow-2xl backdrop-blur-sm border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5 text-blue-400" />
          Quick Actions
        </h3>
        <div className="space-y-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
              className={`w-full flex items-center gap-3 p-3 bg-gradient-to-r ${action.color} rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105 group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
            >
              <div className="flex-shrink-0">
                {action.icon}
              </div>
              <div className="text-left flex-1">
                <div className={`font-semibold text-sm ${action.textColor}`}>
                  {action.title}
                </div>
                <div className="text-white/80 text-xs">
                  {action.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Data Status */}
      <div className="bg-slate-800/50 rounded-2xl p-6 shadow-2xl backdrop-blur-sm border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          Tracking Status
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 text-sm">Data Source</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              hasRealData 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}>
              {hasRealData ? 'Live Tracking' : 'Awaiting Data'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-slate-300 text-sm">Auto Refresh</span>
            <span className="text-green-400 text-sm">Every 15s</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-slate-300 text-sm">Data Freshness</span>
            <span className="text-blue-400 text-sm">Real-time</span>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-slate-800/50 rounded-2xl p-6 shadow-2xl backdrop-blur-sm border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          💡 {hasRealData ? 'Pro Tips' : 'Getting Started'}
        </h3>
        <div className="space-y-3">
          {tips.map((tip, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
              <span className="text-lg flex-shrink-0 mt-0.5">{tip.icon}</span>
              <p className="text-slate-300 text-sm leading-relaxed">{tip.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Support Card */}
      {!hasRealData && (
        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl p-6 shadow-2xl backdrop-blur-sm border border-blue-500/30">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <QuestionMarkCircleIcon className="w-6 h-6 text-blue-400" />
            </div>
            <h4 className="text-white font-semibold mb-2">Need Installation Help?</h4>
            <p className="text-blue-200 text-sm mb-4">
              Our experts can help you set up tracking in minutes
            </p>
            <button
              onClick={showInstallationHelp}
              className="w-full bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors border border-white/20"
            >
              Get Expert Support
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickActions;