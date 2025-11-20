export interface EmailReportData {
  domain: string;
  timeRange: '24h' | '7d' | '30d';
  trafficData: any;
  chartData: any;
  userEmail: string;
  userName?: string;
  screenshots?: {
    growth7d?: string;
    growth30d?: string;
    weeklySummary?: string;
  };
}

// Get backend URL - same as your other services
const getBackendUrl = () => {
  return process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
};

export const sendAnalyticsReport = async (data: EmailReportData): Promise<{ success: boolean; message: string }> => {
  try {
    const backendUrl = getBackendUrl();
    const apiUrl = `${backendUrl}/api/send-analytics-report`;
    
    console.log('📧 Sending analytics report to:', apiUrl);
    console.log('📧 Report data:', { 
      domain: data.domain, 
      timeRange: data.timeRange,
      userEmail: data.userEmail 
    });

    // Generate HTML email template
    const emailHtml = generateEmailTemplate(data);

    // Send email using backend API endpoint
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: data.userEmail,
        subject: `Analytics Report for ${data.domain} - ${data.timeRange}`,
        html: emailHtml,
        text: `Analytics Report for ${data.domain} - ${data.timeRange}` // Fallback text version
      })
    });

    console.log('📧 Email API response status:', response.status);
    
    // Handle non-JSON responses gracefully
    const responseText = await response.text();
    console.log('📧 Email API response text:', responseText);

    if (!response.ok) {
      let errorMessage = 'Failed to send email report';
      
      // Try to parse error response if it's JSON
      if (responseText.trim() && responseText.startsWith('{')) {
        try {
          const errorData = JSON.parse(responseText);
          console.error('Email sending error details:', errorData);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // If not JSON, use the text response
          console.error('Email sending error (non-JSON):', responseText);
          errorMessage = responseText || errorMessage;
        }
      } else {
        // Handle empty or non-JSON responses
        console.error('Email sending error (empty response):', response.status, response.statusText);
        errorMessage = `Server returned ${response.status}: ${response.statusText}`;
      }
      
      return { success: false, message: errorMessage };
    }

    let result;
    try {
      result = responseText ? JSON.parse(responseText) : {};
      console.log('✅ Email sent successfully:', result);
    } catch (parseError) {
      console.error('Failed to parse success response:', parseError);
      // If we can't parse JSON but the response was ok, assume success
      return { success: true, message: 'Analytics report sent successfully!' };
    }
    
    return { success: true, message: 'Analytics report sent successfully!' };
    
  } catch (error) {
    console.error('Email service error:', error);
    return { 
      success: false, 
      message: `Failed to send email report: ${error.message}` 
    };
  }
};

const generateEmailTemplate = (data: EmailReportData): string => {
  const { domain, timeRange, trafficData, userName } = data;

  const formatNumber = (num: number) => num.toLocaleString();
  const formatPercentage = (num: number) => `${num.toFixed(1)}%`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Analytics Report - ${domain}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #1a1a1a;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
                padding: 20px;
            }
            
            .email-wrapper {
                max-width: 650px;
                margin: 0 auto;
            }
            
            .container {
                background: #ffffff;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            
            /* Header with animated gradient */
            .header {
                background: linear-gradient(135deg, #0B3B66 0%, #1565C0 50%, #0B3B66 100%);
                background-size: 200% 200%;
                padding: 50px 40px;
                text-align: center;
                position: relative;
                overflow: hidden;
            }
            
            .header::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, rgba(79, 195, 247, 0.1) 0%, transparent 70%);
                animation: pulse 8s ease-in-out infinite;
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.5; }
                50% { transform: scale(1.1) rotate(180deg); opacity: 0.8; }
            }
            
            .logo-container {
                position: relative;
                z-index: 1;
                margin-bottom: 20px;
                display: inline-flex;
                align-items: center;
                gap: 12px;
                background: rgba(255, 255, 255, 0.1);
                padding: 12px 24px;
                border-radius: 50px;
                backdrop-filter: blur(10px);
            }
            
            .logo-icon {
                animation: float 3s ease-in-out infinite;
            }
            
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }
            
            .logo-text {
                color: #ffffff;
                font-size: 18px;
                font-weight: 600;
                letter-spacing: 0.5px;
            }
            
            .header-title {
                position: relative;
                z-index: 1;
                color: #ffffff;
                font-size: 36px;
                font-weight: 800;
                margin: 20px 0 10px;
                text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            }
            
            .header-subtitle {
                position: relative;
                z-index: 1;
                color: rgba(255, 255, 255, 0.95);
                font-size: 18px;
                font-weight: 500;
            }
            
            .domain-badge {
                display: inline-block;
                background: rgba(79, 195, 247, 0.3);
                color: #ffffff;
                padding: 8px 20px;
                border-radius: 20px;
                margin-top: 15px;
                font-weight: 600;
                border: 2px solid rgba(255, 255, 255, 0.3);
            }
            
            /* Content Section */
            .content {
                padding: 50px 40px;
                background: #ffffff;
            }
            
            .greeting {
                font-size: 20px;
                color: #1a1a1a;
                margin-bottom: 15px;
                font-weight: 600;
            }
            
            .intro-text {
                color: #555;
                font-size: 16px;
                line-height: 1.8;
                margin-bottom: 40px;
            }
            
            /* Metrics Grid with Hover Effects */
            .metrics-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                margin: 40px 0;
            }
            
            .metric-card {
                background: linear-gradient(135deg, #f8f9ff 0%, #e8f0fe 100%);
                border: 2px solid #e3e8ef;
                border-radius: 16px;
                padding: 28px;
                text-align: center;
                position: relative;
                overflow: hidden;
                transition: all 0.3s ease;
            }
            
            .metric-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 4px;
                background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                transform: scaleX(0);
                transition: transform 0.3s ease;
            }
            
            .metric-card:hover::before {
                transform: scaleX(1);
            }
            
            .metric-icon {
                font-size: 32px;
                margin-bottom: 12px;
                display: block;
            }
            
            .metric-value {
                font-size: 32px;
                font-weight: 800;
                color: #0B3B66;
                margin-bottom: 8px;
                background: linear-gradient(135deg, #0B3B66 0%, #1565C0 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .metric-label {
                font-size: 13px;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: 600;
            }
            
            /* Chart Section */
            .chart-section {
                margin: 50px 0;
                text-align: center;
            }
            
            .section-title {
                color: #1a1a1a;
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 25px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
            }
            
            .chart-placeholder {
                background: linear-gradient(135deg, #f8f9ff 0%, #e8f0fe 100%);
                border: 3px dashed #cbd5e1;
                border-radius: 16px;
                padding: 60px 40px;
                margin: 20px 0;
                color: #6b7280;
                font-size: 18px;
                position: relative;
                overflow: hidden;
            }
            
            .chart-placeholder::before {
                content: '📊';
                position: absolute;
                font-size: 120px;
                opacity: 0.05;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }
            
            /* Insights Section */
            .insights-section {
                background: linear-gradient(135deg, #fff9e6 0%, #ffe8cc 100%);
                border-left: 5px solid #ff9800;
                border-radius: 16px;
                padding: 35px;
                margin: 40px 0;
                box-shadow: 0 4px 15px rgba(255, 152, 0, 0.1);
            }
            
            .insights-title {
                font-size: 22px;
                font-weight: 700;
                color: #1a1a1a;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .insights-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .insights-list li {
                padding: 14px 0;
                color: #444;
                font-size: 15px;
                line-height: 1.7;
                border-bottom: 1px solid rgba(255, 152, 0, 0.2);
                position: relative;
                padding-left: 30px;
            }
            
            .insights-list li::before {
                content: '✓';
                position: absolute;
                left: 0;
                color: #ff9800;
                font-weight: bold;
                font-size: 18px;
            }
            
            .insights-list li:last-child {
                border-bottom: none;
            }
            
            /* CTA Section */
            .cta-section {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 16px;
                padding: 40px;
                text-align: center;
                margin: 40px 0;
                color: white;
            }
            
            .cta-title {
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 15px;
            }
            
            .cta-text {
                font-size: 16px;
                opacity: 0.95;
                margin-bottom: 25px;
            }
            
            .cta-button {
                display: inline-block;
                background: #ffffff;
                color: #667eea;
                text-decoration: none;
                padding: 16px 40px;
                border-radius: 30px;
                font-weight: 700;
                font-size: 16px;
                transition: all 0.3s ease;
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
            }
            
            .cta-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
            }
            
            /* Footer */
            .footer {
                background: #0B3B66;
                color: #ffffff;
                padding: 50px 40px 30px;
                text-align: center;
            }
            
            .footer-links {
                display: flex;
                justify-content: center;
                gap: 30px;
                margin: 30px 0;
                flex-wrap: wrap;
            }
            
            .footer-link {
                color: #4FC3F7;
                text-decoration: none;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.3s ease;
            }
            
            .footer-link:hover {
                color: #ffffff;
                text-decoration: underline;
            }
            
            .footer-divider {
                height: 1px;
                background: rgba(255, 255, 255, 0.2);
                margin: 30px 0;
            }
            
            .footer-branding {
                font-size: 13px;
                color: rgba(255, 255, 255, 0.7);
                margin-top: 20px;
            }
            
            .footer-logo {
                margin-bottom: 20px;
            }
            
            .social-links {
                margin: 25px 0;
                display: flex;
                justify-content: center;
                gap: 15px;
            }
            
            .timestamp {
                color: #9ca3af;
                font-size: 13px;
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
            }
            
            /* Responsive */
            @media only screen and (max-width: 600px) {
                .email-wrapper {
                    padding: 10px;
                }
                
                .header {
                    padding: 40px 25px;
                }
                
                .content {
                    padding: 35px 25px;
                }
                
                .header-title {
                    font-size: 28px;
                }
                
                .metrics-grid {
                    grid-template-columns: 1fr;
                    gap: 15px;
                }
                
                .footer-links {
                    flex-direction: column;
                    gap: 15px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-wrapper">
            <div class="container">
                <!-- Header -->
                <div class="header">
                    <div class="logo-container">
                        <svg xmlns="http://www.w3.org/2000/svg" 
                             width="32" height="32" viewBox="0 0 64 64" 
                             class="logo-icon">
                            <rect x="0" y="0" width="64" height="64" rx="10" ry="10" fill="#4FC3F7"/>
                            <circle cx="18" cy="16" r="4" fill="#0B3B66"/>
                            <rect x="14" y="18" width="6" height="28" rx="1.2" fill="#0B3B66"/>
                            <polygon points="34,18 46,18 52,46 46,46 44,36 36,36 34,46 28,46" fill="#0B3B66"/>
                        </svg>
                        <span class="logo-text">webInsight AI Yourspace</span>
                    </div>
                    <h1 class="header-title">📊 Analytics Report</h1>
                    <p class="header-subtitle">Your ${timeRange} Performance Overview</p>
                    <div class="domain-badge">${domain}</div>
                </div>

                <!-- Content -->
                <div class="content">
                    <p class="greeting">Hello ${userName || 'there'} 👋</p>
                    <p class="intro-text">
                        Here's your comprehensive analytics report for <strong>${domain}</strong> covering the last 
                        <strong>${timeRange === '24h' ? '24 hours' : timeRange === '7d' ? '7 days' : '30 days'}</strong>. 
                        Let's dive into your website's performance!
                    </p>

                    <!-- Metrics Grid -->
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <span class="metric-icon">👥</span>
                            <div class="metric-value">${formatNumber(trafficData.totalVisitors)}</div>
                            <div class="metric-label">Total Visitors</div>
                        </div>
                        <div class="metric-card">
                            <span class="metric-icon">✨</span>
                            <div class="metric-value">${formatNumber(trafficData.newVisitors)}</div>
                            <div class="metric-label">New Visitors</div>
                        </div>
                        <div class="metric-card">
                            <span class="metric-icon">🔄</span>
                            <div class="metric-value">${formatNumber(trafficData.returningVisitors)}</div>
                            <div class="metric-label">Returning Visitors</div>
                        </div>
                        <div class="metric-card">
                            <span class="metric-icon">📈</span>
                            <div class="metric-value">${formatPercentage(trafficData.bounceRate)}</div>
                            <div class="metric-label">Bounce Rate</div>
                        </div>
                    </div>

                    <!-- Chart Section -->
                    <div class="chart-section">
                        <h3 class="section-title">
                            <span>📊</span> Visitor Growth Trends
                        </h3>
                        <div class="chart-placeholder">
                            <strong>Growth charts visualization</strong>
                            <br><small>7-day and 30-day performance trends included</small>
                        </div>
                    </div>

                    <!-- Insights Section -->
                    <div class="insights-section">
                        <div class="insights-title">
                            <span>💡</span> Key Insights & Recommendations
                        </div>
                        <ul class="insights-list">
                            <li>Your website received <strong>${formatNumber(trafficData.totalVisitors)}</strong> visitors this ${timeRange === '24h' ? 'day' : timeRange === '7d' ? 'week' : 'month'}</li>
                            <li>${trafficData.newVisitors > trafficData.returningVisitors ? 'New visitors are driving most of your traffic - great for growth!' : 'Returning visitors show strong engagement - your content is resonating!'}</li>
                            <li>Bounce rate of <strong>${formatPercentage(trafficData.bounceRate)}</strong> ${trafficData.bounceRate < 40 ? 'indicates excellent engagement 🎉' : trafficData.bounceRate < 70 ? 'is within normal range ✓' : 'may need attention - consider improving landing pages'}</li>
                            <li>Average session duration: <strong>${Math.floor(trafficData.avgSessionDuration / 60)}m ${trafficData.avgSessionDuration % 60}s</strong></li>
                            <li>Visitors viewed an average of <strong>${trafficData.pagesPerVisit} pages</strong> per session</li>
                        </ul>
                    </div>

                    <!-- CTA Section -->
                    <div class="cta-section">
                        <h3 class="cta-title">Need Help Optimizing Your Website?</h3>
                        <p class="cta-text">Our support team is ready to help you maximize your website's potential</p>
                        <a href="https://www.yourspaceanalytics.info/contact" class="cta-button">Get Expert Support</a>
                    </div>

                    <div class="timestamp">
                        Report generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString()}
                    </div>
                </div>

                <!-- Footer -->
                <div class="footer">
                    <div class="footer-logo">
                        <svg xmlns="http://www.w3.org/2000/svg" 
                             width="40" height="40" viewBox="0 0 64 64">
                            <rect x="0" y="0" width="64" height="64" rx="10" ry="10" fill="#4FC3F7"/>
                            <circle cx="18" cy="16" r="4" fill="#0B3B66"/>
                            <rect x="14" y="18" width="6" height="28" rx="1.2" fill="#0B3B66"/>
                            <polygon points="34,18 46,18 52,46 46,46 44,36 36,36 34,46 28,46" fill="#0B3B66"/>
                        </svg>
                    </div>
                    
                    <div class="footer-links">
                        <a href="https://www.yourspaceanalytics.info/privacy" class="footer-link">Privacy Policy</a>
                        <a href="https://www.yourspaceanalytics.info/terms" class="footer-link">Terms of Service</a>
                        <a href="https://www.yourspaceanalytics.info/contact" class="footer-link">Contact Us</a>
                    </div>
                    
                    <div class="footer-divider"></div>
                    
                    <div class="footer-branding">
                        © ${new Date().getFullYear()} webInsight AI Yourspace. All rights reserved.<br>
                        Powered by Advanced Analytics Technology
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
};

const generateAttachments = (screenshots: EmailReportData['screenshots']) => {
  const attachments = [];

  if (screenshots?.growth7d) {
    attachments.push({
      filename: 'growth-chart-7d.png',
      content: screenshots.growth7d,
      type: 'image/png',
      disposition: 'attachment'
    });
  }

  if (screenshots?.growth30d) {
    attachments.push({
      filename: 'growth-chart-30d.png',
      content: screenshots.growth30d,
      type: 'image/png',
      disposition: 'attachment'
    });
  }

  if (screenshots?.weeklySummary) {
    attachments.push({
      filename: 'weekly-summary.png',
      content: screenshots.weeklySummary,
      type: 'image/png',
      disposition: 'attachment'
    });
  }

  return attachments;
};

// --- Team & Meeting email helpers ---

// Sends a team invite email via server-side transactional email endpoint.
// This function is a thin client-side helper that calls your server API.
// The server should send the actual email (to avoid exposing API keys in the client).
export async function sendTeamInviteEmail(opts: {
    to: string;
    inviterName: string;
    teamName: string;
    acceptUrl: string; // link the user clicks to accept invite
    message?: string;
}) {
    const { to, inviterName, teamName, acceptUrl, message } = opts;

    const subject = `${inviterName} invited you to join ${teamName}`;
    const body = `
        <p>Hi,</p>
        <p><strong>${inviterName}</strong> has invited you to join the team <strong>${teamName}</strong>.</p>
        ${message ? `<p>Message from ${inviterName}: ${message}</p>` : ''}
        <p><a href="${acceptUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">Accept invitation</a></p>
        <p>If the button doesn't work, copy and paste this link into your browser: <br/>${acceptUrl}</p>
        <p>Thanks,<br/>The ${teamName} team</p>
    `;

    try {
        const backendUrl = getBackendUrl();
        const apiUrl = `${backendUrl}/api/send-email`;
        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, subject, html: body }),
        });
        if (!res.ok) throw new Error((await res.text()) || 'Failed to send invite email');
        return { success: true };
    } catch (err: any) {
        console.error('sendTeamInviteEmail error', err);
        return { success: false, error: err?.message || String(err) };
    }
}

// Sends a meeting invitation email via server-side transactional email endpoint.
export async function sendMeetingInviteEmail(opts: {
    to: string;
    organizerName: string;
    teamName: string;
    meetingTitle: string;
    meetingTimeISO: string; // ISO datetime
    joinUrl: string;
    passcode?: string;
    message?: string;
}) {
    const { to, organizerName, teamName, meetingTitle, meetingTimeISO, joinUrl, passcode, message } = opts;

    const subject = `${organizerName} scheduled a meeting: ${meetingTitle}`;
    const meetingTime = new Date(meetingTimeISO).toLocaleString();
    const body = `
        <p>Hi,</p>
        <p><strong>${organizerName}</strong> scheduled a meeting for team <strong>${teamName}</strong>:</p>
        <p><strong>${meetingTitle}</strong><br/>When: ${meetingTime}</p>
        ${passcode ? `<p>Passcode: <code>${passcode}</code></p>` : ''}
        ${message ? `<p>Message: ${message}</p>` : ''}
        <p><a href="${joinUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">Join meeting</a></p>
        <p>If the button doesn't work, copy and paste this link into your browser: <br/>${joinUrl}</p>
        <p>Thanks,<br/>${organizerName}</p>
    `;

    try {
        const backendUrl = getBackendUrl();
        const apiUrl = `${backendUrl}/api/send-email`;
        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, subject, html: body }),
        });
        if (!res.ok) throw new Error((await res.text()) || 'Failed to send meeting email');
        return { success: true };
    } catch (err: any) {
        console.error('sendMeetingInviteEmail error', err);
        return { success: false, error: err?.message || String(err) };
    }
}