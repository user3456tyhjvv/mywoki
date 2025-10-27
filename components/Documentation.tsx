import { useState } from 'react';
import { CopyIcon, CheckIcon, CodeIcon, GlobeIcon, FrameworkIcon } from './Icons';
import React from 'react';
import { ArrowLeftIcon, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase'; // Adjust path as needed

const Documentation: React.FC = () => {
  const navigate = useNavigate();
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'docs' | 'contribute'>('docs');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    github: '',
    contribution_type: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const copyToClipboard = async (text: string, snippetName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSnippet(snippetName);
      setTimeout(() => setCopiedSnippet(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const { data, error } = await supabase
        .from('contributions')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            github_username: formData.github || null,
            contribution_type: formData.contribution_type,
            message: formData.message
          }
        ])
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        setSubmitStatus('error');
      } else {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          github: '',
          contribution_type: '',
          message: ''
        });
        console.log('✅ Contribution saved to Supabase:', data);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const installationSnippets = {
    basic: `<script src="https://tooler-io.onrender.com/tracker.js" data-site-id="YOUR_DOMAIN" async></script>`,
    nextjs: `import Script from 'next/script'

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Script
        src="https://tooler-io.onrender.com/tracker.js"
        data-site-id="YOUR_DOMAIN"
        strategy="afterInteractive"
      />
      <Component {...pageProps} />
    </>
  )
}`,
    react: `import { Helmet } from 'react-helmet'

function App() {
  return (
    <div>
      <Helmet>
        <script
          src="https://tooler-io.onrender.com/tracker.js"
          data-site-id="YOUR_DOMAIN"
          async
        />
      </Helmet>
      {/* Your app content */}
    </div>
  )
}`,
    vue: `// main.js
import { createApp } from 'vue'

const app = createApp(App)

// Add tracker
const script = document.createElement('script')
script.src = 'https://tooler-io.onrender.com/tracker.js'
script.setAttribute('data-site-id', 'YOUR_DOMAIN')
script.async = true
document.head.appendChild(script)

app.mount('#app')`,
    manual: `// For any JavaScript framework
(function() {
  const script = document.createElement('script');
  script.src = 'https://tooler-io.onrender.com/tracker.js';
  script.setAttribute('data-site-id', 'YOUR_DOMAIN');
  script.async = true;
  document.head.appendChild(script);
})();`,
    framer: `<script src="https://tooler-io.onrender.com/tracker.js" data-site-id="YOUR_DOMAIN" async></script>`,
    webflow: `<script src="https://tooler-io.onrender.com/tracker.js" data-site-id="YOUR_DOMAIN" async></script>`,
    wix: `<script src="https://tooler-io.onrender.com/tracker.js" data-site-id="YOUR_DOMAIN" async></script>`,
    squarespace: `<script src="https://tooler-io.onrender.com/tracker.js" data-site-id="YOUR_DOMAIN" async></script>`,
    wordpress: `<script src="https://tooler-io.onrender.com/tracker.js" data-site-id="YOUR_DOMAIN" async></script>`,
    shopify: `<script src="https://tooler-io.onrender.com/tracker.js" data-site-id="YOUR_DOMAIN" async></script>`,
    customEvents: `// Track custom events
window.insightAI.track('purchase', {
  productId: '123',
  amount: 99.99,
  currency: 'USD'
});

// Track form submissions
window.insightAI.track('form_submit', {
  formId: 'contact-form',
  formType: 'contact'
});

// Track user actions
window.insightAI.track('button_click', {
  buttonId: 'cta-button',
  section: 'hero'
});`
  };

  const sections = [
    { id: 'quick-start', title: 'Quick Start', keywords: 'installation basic setup start' },
    { id: 'framework-installation', title: 'Framework-Specific Installation', keywords: 'nextjs react vue manual framework' },
    { id: 'website-builders', title: 'Website Builders Installation', keywords: 'framer webflow wix squarespace wordpress shopify builders' },
    { id: 'custom-events', title: 'Custom Events Tracking', keywords: 'events track custom purchase form button' },
    { id: 'features', title: 'What Gets Tracked', keywords: 'features tracking analytics insights ai' },
    { id: 'faq', title: 'Frequently Asked Questions', keywords: 'faq questions data gdpr compliant update' },
    { id: 'support', title: 'Need Help?', keywords: 'support contact help' }
  ];

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.keywords.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const CodeSnippet: React.FC<{ title: string; code: string; language?: string; snippetName: string }> = ({
    title,
    code,
    language = 'html',
    snippetName
  }) => (
    <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
      <div className="flex justify-between items-center px-4 py-2 bg-gray-200 border-b border-gray-300">
        <div className="flex items-center gap-2">
          <CodeIcon className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">{title}</span>
        </div>
        <button
          onClick={() => copyToClipboard(code, snippetName)}
          className="flex items-center gap-2 px-3 py-1 text-xs bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md transition-colors"
        >
          {copiedSnippet === snippetName ? (
            <CheckIcon className="w-3 h-3 text-green-600" />
          ) : (
            <CopyIcon className="w-3 h-3" />
          )}
          {copiedSnippet === snippetName ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );

  const onNavigate = (route: string) => {
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <ArrowLeftIcon
                  className="w-6 h-6 cursor-pointer hover:text-brand-accent transition-colors mb-4"
                  onClick={() => onNavigate('/')}
                />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex-1"></div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab('docs')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'docs'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Documentation
          </button>
          <button
            onClick={() => setActiveTab('contribute')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'contribute'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Contribute & Feedback
          </button>
        </div>

        {activeTab === 'docs' ? (
          <>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Insight AI Documentation</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Comprehensive guide to implementing and using Insight AI analytics tracker
              </p>
            </div>

            {/* Quick Start Section */}
            {filteredSections.some(s => s.id === 'quick-start') && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <GlobeIcon className="w-6 h-6 text-blue-600" />
                  Quick Start
                </h2>
                <div className="bg-gray-100 rounded-lg p-6 border border-gray-300">
                  <p className="text-gray-700 mb-4">
                    Add this single line of code to your website to start tracking analytics immediately.
                    Replace <code className="bg-gray-200 px-1 rounded">YOUR_DOMAIN</code> with your actual domain name.
                  </p>
                  <CodeSnippet
                    title="Basic Installation"
                    code={installationSnippets.basic}
                    snippetName="basic"
                  />
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      <strong>Note:</strong> Incase you use another framework that is not listed contact us for guidance{' '}
                      <a 
                        href="/contact" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                      >
                        framework documentation ↗
                      </a>
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Framework-Specific Installation */}
            {filteredSections.some(s => s.id === 'framework-installation') && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <FrameworkIcon className="w-6 h-6 text-blue-600" />
                  Framework-Specific Installation
                </h2>

                <div className="space-y-6">
                  <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Next.js</h3>
                    <CodeSnippet 
                      title="Next.js App Router" 
                      code={installationSnippets.nextjs}
                      language="javascript"
                      snippetName="nextjs"
                    />
                    <p className="text-gray-600 text-sm mt-2">
                      Add this to your <code className="bg-gray-200 px-1 rounded">app/layout.js</code> or <code className="bg-gray-200 px-1 rounded">pages/_app.js</code>
                    </p>
                  </div>

                  <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">React</h3>
                    <CodeSnippet 
                      title="React with Helmet" 
                      code={installationSnippets.react}
                      language="javascript"
                      snippetName="react"
                    />
                    <p className="text-gray-600 text-sm mt-2">
                      For Create React App, you can also add the script tag directly to <code className="bg-gray-200 px-1 rounded">public/index.html</code>
                    </p>
                  </div>

                  <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Vue.js</h3>
                    <CodeSnippet 
                      title="Vue.js Installation" 
                      code={installationSnippets.vue}
                      language="javascript"
                      snippetName="vue"
                    />
                  </div>

                  <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Manual Installation</h3>
                    <CodeSnippet 
                      title="Any JavaScript Framework" 
                      code={installationSnippets.manual}
                      language="javascript"
                      snippetName="manual"
                    />
                    <p className="text-gray-600 text-sm mt-2">
                      Works with Angular, Svelte, Solid.js, and any other framework
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Custom Events */}
            {filteredSections.some(s => s.id === 'custom-events') && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Custom Events Tracking</h2>
                <div className="bg-gray-100 rounded-lg p-6 border border-gray-300">
                  <p className="text-gray-700 mb-4">
                    Track custom user interactions beyond page views. These events will appear in your analytics dashboard.
                  </p>
                  <CodeSnippet 
                    title="Custom Events Examples" 
                    code={installationSnippets.customEvents}
                    language="javascript"
                    snippetName="customEvents"
                  />
                </div>
              </section>
            )}

            {/* Features */}
            {filteredSections.some(s => s.id === 'features') && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">What Gets Tracked</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-100 rounded-lg p-6 border border-gray-300">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Automatic Tracking</h3>
                    <ul className="text-gray-700 space-y-2">
                      <li>• Page views and navigation</li>
                      <li>• Visitor identification</li>
                      <li>• Screen resolution</li>
                      <li>• Language and timezone</li>
                      <li>• Referrer information</li>
                      <li>• User engagement</li>
                      <li>• Page exit timing</li>
                    </ul>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-6 border border-gray-300">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">AI-Powered Insights</h3>
                    <ul className="text-gray-700 space-y-2">
                      <li>• Real-time visitor analytics</li>
                      <li>• Bounce rate analysis</li>
                      <li>• Session duration tracking</li>
                      <li>• Pages per visit metrics</li>
                      <li>• New vs returning visitors</li>
                      <li>• Automated improvement suggestions</li>
                      <li>• Weekly performance summaries</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* FAQ */}
            {filteredSections.some(s => s.id === 'faq') && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  <div className="bg-gray-100 rounded-lg p-6 border border-gray-300">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">What data do you collect?</h3>
                    <p className="text-gray-700">
                      We collect anonymous analytics data including page views, visitor behavior, device information, and engagement metrics. 
                      No personal identifiable information is stored.
                    </p>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-6 border border-gray-300">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Is it GDPR compliant?</h3>
                    <p className="text-gray-700">
                      Yes, our tracker is designed to be privacy-friendly and GDPR compliant. We don't use cookies for tracking and only collect anonymous data.
                    </p>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-6 border border-gray-300">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">How often is data updated?</h3>
                    <p className="text-gray-700">
                      Your dashboard updates every 30 seconds automatically. You can also manually refresh to see the latest data immediately.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Support */}
            {filteredSections.some(s => s.id === 'support') && (
              <section className="text-center">
                <div className="bg-gray-100 rounded-lg p-8 border border-gray-300">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Help?</h2>
                  <p className="text-gray-700 mb-6">
                    If you're having trouble with installation or have questions about features, 
                    our support team is here to help.
                  </p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                    Contact Support
                  </button>
                </div>
              </section>
            )}
          </>
        ) : (
          /* Contribute & Feedback Tab */
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Contribute & Feedback</h1>
              <p className="text-gray-600">
                Help us improve Insight AI! Share your ideas, report bugs, or contribute to our open-source project.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="github" className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub Username (Optional)
                </label>
                <input
                  type="text"
                  id="github"
                  name="github"
                  value={formData.github}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your GitHub username"
                />
              </div>

              <div>
                <label htmlFor="contribution_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Contribution Type *
                </label>
                <select
                  id="contribution_type"
                  name="contribution_type"
                  value={formData.contribution_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select contribution type</option>
                  <option value="bug_report">Bug Report</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="code_contribution">Code Contribution</option>
                  <option value="documentation">Documentation Improvement</option>
                  <option value="feedback">General Feedback</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your contribution, feedback, or issue..."
                />
              </div>

              {submitStatus === 'success' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">Thank you for your contribution! We'll review your submission soon.</p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">There was an error submitting your form. Please try again.</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Contribution'}
              </button>
            </form>

            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Open Source Contribution Guidelines</h3>
              <ul className="text-blue-800 space-y-2 text-sm">
                <li>• Fork our repository and create a feature branch</li>
                <li>• Follow our code style and conventions</li>
                <li>• Add tests for new functionality</li>
                <li>• Update documentation as needed</li>
                <li>• Submit a pull request with a clear description</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Documentation;