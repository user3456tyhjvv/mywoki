import React, { useState } from 'react';
import { CopyIcon, CheckIcon, CodeIcon, HelpCircleIcon, ExternalLinkIcon } from './Icons';
import HelpRequestModal from './HelpRequestModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface CodeSnippetProps {
    domain: string;
    onAddHelpRequest: (domain: string) => void;
}

type Tab = 'html' | 'wordpress' | 'nextjs' | 'shopify';

interface InstallationGuide {
    title: string;
    steps: string[];
    codeExample?: string;
}

const CodeSnippet: React.FC<CodeSnippetProps> = ({ domain, onAddHelpRequest }) => {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('html');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const snippet = `<script async src="https://tooler-io.onrender.com/tracker.js" data-site-id="${domain}"></script>`;

    const handleCopy = () => {
        navigator.clipboard.writeText(snippet);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    const handleHelpRequestSubmit = () => {
        onAddHelpRequest(domain);
    }

    const installationGuides: Record<Tab, InstallationGuide> = {
        html: {
            title: "HTML Website",
            steps: [
                "Click the copy button above to copy the tracking code",
                "Open the main HTML file of your website (usually index.html)",
                "Paste the code just before the closing </head> tag",
                "Save the file and deploy your website",
                "Data will start appearing within minutes"
            ]
        },
        wordpress: {
            title: "WordPress",
            steps: [
                "Install and activate the 'Header and Footer Scripts' plugin",
                "Go to Settings → Header and Footer Scripts",
                "Paste the tracking code in the 'Header Scripts' section",
                "Save changes and clear your cache if needed",
                "Your analytics will be active immediately"
            ]
        },
        nextjs: {
            title: "Next.js",
            steps: [
                "Copy the tracking code above",
                "Open your _document.js or _document.tsx file",
                "Add the script inside the <Head> component",
                "Import Head from 'next/head' if not already imported",
                "Restart your development server"
            ],
            codeExample: `import Head from 'next/head'

export default function Document() {
  return (
    <Head>
      <script async src="https://tooler-io.onrender.com/tracker.js" data-site-id="${domain}"></script>
    </Head>
  )
}`
        },
        shopify: {
            title: "Shopify",
            steps: [
                "From your Shopify admin, go to Online Store → Themes",
                "Click Actions → Edit code",
                "Open the theme.liquid file",
                "Paste the tracking code just before the closing </head> tag",
                "Save your changes"
            ]
        }
    };

    return (
        <>
            <HelpRequestModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleHelpRequestSubmit}
                domain={domain}
            />
            
            <div id="code-snippet-section" className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-700">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                    <div className="flex items-center gap-3 mb-4 lg:mb-0">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <CodeIcon className="w-6 h-6 text-white"/>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Install Tracking Code</h3>
                            <p className="text-slate-400 text-sm">Add real-time analytics to your website</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            copied ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                            {copied ? '✓ Copied!' : 'Ready to Install'}
                        </div>
                    </div>
                </div>

                {/* Code Snippet Box */}
                <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-slate-400 text-sm font-mono">tracking-script.js</span>
                        <button 
                            onClick={handleCopy} 
                            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors text-sm font-medium"
                        >
                            {copied ? (
                                <>
                                    <CheckIcon className="w-4 h-4 text-green-400" />
                                    <span>Copied!</span>
                                </>
                            ) : (
                                <>
                                    <CopyIcon className="w-4 h-4" />
                                    <span>Copy Code</span>
                                </>
                            )}
                        </button>
                    </div>
                    <div className="bg-black/50 rounded-lg p-4 font-mono text-sm">
                        <code className="text-green-400 break-all">
                            {snippet}
                        </code>
                    </div>
                </div>

                {/* Platform Tabs */}
                <div className="mb-6">
                    <div className="border-b border-slate-700">
                        <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Platforms">
                            {(Object.keys(installationGuides) as Tab[]).map((tab) => (
                                <button 
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                                        activeTab === tab 
                                            ? 'border-blue-500 text-blue-400' 
                                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
                                    }`}
                                >
                                    {installationGuides[tab].title}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Installation Guide */}
                    <div className="mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                                    <HelpCircleIcon className="w-5 h-5 text-blue-400" />
                                    Installation Steps
                                </h4>
                                <ol className="space-y-3">
                                    {installationGuides[activeTab].steps.map((step, index) => (
                                        <li key={index} className="flex items-start gap-3 text-slate-300">
                                            <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full text-sm flex items-center justify-center font-medium mt-0.5">
                                                {index + 1}
                                            </span>
                                            <span>{step}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>

                            {/* Code Example for Specific Platforms */}
                            {installationGuides[activeTab].codeExample && (
                                <div>
                                    <h4 className="font-semibold text-white mb-3">Code Example</h4>
                                    <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                                        <pre className="text-sm text-green-400 overflow-x-auto">
                                            <code>{installationGuides[activeTab].codeExample}</code>
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Help Section */}
                <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-xl p-6 border border-blue-500/20">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                                <HelpCircleIcon className="w-5 h-5 text-blue-400" />
                                Need Professional Help?
                            </h4>
                            <p className="text-blue-200 text-sm">
                                Our team can install the tracking code for you and ensure everything works perfectly.
                            </p>
                        </div>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            data-help-button
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg whitespace-nowrap"
                        >
                            <HelpCircleIcon className="w-5 h-5" />
                            Request Installation Help
                        </button>
                    </div>
                </div>

                {/* Documentation Link */}
                <div className="mt-4 text-center">
                    <a 
                        href="https://yourspaceanalytics.info/docs" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
                    >
                        <span>View full documentation</span>
                        <ExternalLinkIcon className="w-4 h-4" />
                    </a>
                </div>
            </div>
        </>
    );
};

export default CodeSnippet;