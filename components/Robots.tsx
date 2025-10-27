import React from 'react';

const Robots: React.FC = () => {
  // Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "YourSpace Analytics",
    "description": "AI-powered web traffic analytics tool that helps businesses understand their website visitors, optimize content, and grow their online presence with privacy-first, GDPR-compliant tracking.",
    "url": "https://yourspace-analytics.com",
    "logo": "https://yourspace-analytics.com/logo.png",
    "foundingDate": "2024",
    "founders": [
      {
        "@type": "Organization",
        "name": "YourSpace Analytics Team"
      }
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+1-555-0123",
      "contactType": "customer service",
      "availableLanguage": ["English", "French", "Spanish", "Chinese"]
    },
    "sameAs": [
      "https://web.facebook.com/profile.php?id=61582001723440",
      "https://www.linkedin.com/company/yourspace-analytics",
      "https://www.instagram.com/yourspaceanalytics/"
    ],
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "US"
    },
    "mission": "To democratize web analytics by providing enterprise-grade insights with consumer-grade simplicity. We believe every website owner deserves to understand their audience and optimize their digital presence without needing a data science degree."
  };

  // Product Schema
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "YourSpace Analytics",
    "description": "Powerful, privacy-focused analytics with AI-powered insights to help you understand visitors, optimize content, and grow your online presence.",
    "applicationCategory": "WebApplication",
    "operatingSystem": "Web Browser",
    "offers": [
      {
        "@type": "Offer",
        "name": "Free Plan",
        "price": "0",
        "priceCurrency": "USD",
        "description": "Basic visitor analytics, 7-day data retention, real-time dashboard, top pages & referrers"
      },
      {
        "@type": "Offer",
        "name": "Starter Plan",
        "price": "9",
        "priceCurrency": "USD",
        "description": "Everything in Free, 30-day data retention, email reports, goal tracking, custom events"
      },
      {
        "@type": "Offer",
        "name": "Pro Plan",
        "price": "19",
        "priceCurrency": "USD",
        "description": "Everything in Starter, 6-month data retention, advanced filters, API access, white-label reports, priority support"
      },
      {
        "@type": "Offer",
        "name": "Business Plan",
        "price": "49",
        "priceCurrency": "USD",
        "description": "Everything in Pro, 1-year data retention, unlimited team members, custom domains, SAML/SSO, dedicated support"
      }
    ],
    "featureList": [
      "Real-time Analytics",
      "AI-Powered Insights",
      "Privacy-First Tracking",
      "GDPR Compliant",
      "Visitor Behavior Analysis",
      "Conversion Tracking",
      "Weekly Action Reports",
      "Multi-Website Support",
      "Custom Events",
      "Goal Tracking",
      "API Access",
      "White-label Reports"
    ],
    "screenshot": "https://yourspace-analytics.com/dashboard-screenshot.png",
    "softwareVersion": "1.0.0",
    "author": {
      "@type": "Organization",
      "name": "YourSpace Analytics"
    }
  };

  // WebSite Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "YourSpace Analytics",
    "url": "https://yourspace-analytics.com",
    "description": "AI-powered web traffic analytics for understanding website visitors and optimizing online presence",
    "publisher": {
      "@type": "Organization",
      "name": "YourSpace Analytics"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://yourspace-analytics.com/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  // FAQ Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is YourSpace Analytics?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "YourSpace Analytics is an AI-powered web traffic analytics tool that helps businesses understand their website visitors, optimize content, and grow their online presence with privacy-first, GDPR-compliant tracking."
        }
      },
      {
        "@type": "Question",
        "name": "How does the free trial work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We offer a 14-day free trial for our Starter, Pro, and Business plans. No credit card required to start. You can upgrade, downgrade, or cancel anytime during your trial."
        }
      },
      {
        "@type": "Question",
        "name": "Is YourSpace Analytics GDPR compliant?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, YourSpace Analytics is fully GDPR compliant. We prioritize user privacy with no unnecessary data collection, end-to-end encryption, and regular security audits."
        }
      },
      {
        "@type": "Question",
        "name": "What makes YourSpace Analytics different from Google Analytics?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "YourSpace Analytics combines powerful analytics with AI-powered insights to provide specific recommendations like 'Your checkout page has a 67% drop-off rate - here's how to fix it'. We're privacy-first and don't collect personal data."
        }
      }
    ]
  };

  return (
    <>
      {/* Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema)
        }}
      />

      {/* Product Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema)
        }}
      />

      {/* Website Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema)
        }}
      />

      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema)
        }}
      />
    </>
  );
};

export default Robots;
