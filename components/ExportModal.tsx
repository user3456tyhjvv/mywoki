import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { sendAnalyticsReport, type EmailReportData } from '../services/emailService';
import { DownloadIcon, EnvelopeIcon, XIcon, CheckIcon } from './Icons';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain: string;
  timeRange: '24h' | '7d' | '30d';
  trafficData: any;
  chartData: any;
  onJsonExport: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  domain,
  timeRange,
  trafficData,
  chartData,
  onJsonExport
}) => {
  const { user } = useAuth();
  const [exportType, setExportType] = useState<'json' | 'email'>('json');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [emailMessage, setEmailMessage] = useState('');

  const handleEmailExport = async () => {
    if (!user?.email) {
      setEmailStatus('error');
      setEmailMessage('User email not found. Please update your profile.');
      return;
    }

    setEmailStatus('sending');
    setEmailMessage('');

    try {
      const emailData: EmailReportData = {
        domain,
        timeRange,
        trafficData,
        chartData,
        userEmail: user.email,
        userName: user.user_metadata?.full_name || user.email?.split('@')[0],
        // TODO: Add screenshot generation here
        // screenshots: await generateScreenshots()
      };

      const result = await sendAnalyticsReport(emailData);

      if (result.success) {
        setEmailStatus('success');
        setEmailMessage(result.message);
        // Auto close after success
        setTimeout(() => {
          onClose();
          setEmailStatus('idle');
          setEmailMessage('');
        }, 3000);
      } else {
        setEmailStatus('error');
        setEmailMessage(result.message);
      }
    } catch (error) {
      setEmailStatus('error');
      setEmailMessage('Failed to send email report. Please try again.');
    }
  };

  const handleJsonExport = () => {
    onJsonExport();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Export Analytics Data</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Export Type Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Choose Export Method
              </label>
              <div className="space-y-3">
                {/* JSON Export Option */}
                <div
                  onClick={() => setExportType('json')}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    exportType === 'json'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      exportType === 'json' ? 'bg-blue-500' : 'bg-slate-600'
                    }`}>
                      <DownloadIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">Download JSON</h3>
                      <p className="text-sm text-slate-400">
                        Download data as JSON file for local use
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email Export Option */}
                <div
                  onClick={() => setExportType('email')}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    exportType === 'email'
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      exportType === 'email' ? 'bg-purple-500' : 'bg-slate-600'
                    }`}>
                      <EnvelopeIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">Email Report</h3>
                      <p className="text-sm text-slate-400">
                        Send detailed report to {user?.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Status */}
            {exportType === 'email' && emailStatus !== 'idle' && (
              <div className={`p-4 rounded-lg border ${
                emailStatus === 'success'
                  ? 'border-green-500 bg-green-500/10'
                  : emailStatus === 'error'
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-blue-500 bg-blue-500/10'
              }`}>
                <div className="flex items-center gap-3">
                  {emailStatus === 'sending' && (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                  )}
                  {emailStatus === 'success' && (
                    <CheckIcon className="w-5 h-5 text-green-400" />
                  )}
                  {emailStatus === 'error' && (
                    <XIcon className="w-5 h-5 text-red-400" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${
                      emailStatus === 'success' ? 'text-green-400' :
                      emailStatus === 'error' ? 'text-red-400' : 'text-blue-400'
                    }`}>
                      {emailStatus === 'sending' ? 'Sending email...' :
                       emailStatus === 'success' ? 'Email sent successfully!' :
                       'Failed to send email'}
                    </p>
                    {emailMessage && (
                      <p className="text-xs text-slate-400 mt-1">{emailMessage}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Email Report Features */}
            {exportType === 'email' && (
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">Report Includes:</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• 📊 Key metrics and performance data</li>
                  <li>• 📈 Growth charts (7-day & 30-day views)</li>
                  <li>• 📋 Weekly summaries and insights</li>
                  <li>• 🎨 Professional branding and design</li>
                  <li>• 🔗 Direct support link</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={exportType === 'json' ? handleJsonExport : handleEmailExport}
            disabled={emailStatus === 'sending'}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {exportType === 'json' ? 'Download JSON' :
             emailStatus === 'sending' ? 'Sending...' : 'Send Email Report'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
