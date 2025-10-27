import React, { useState } from 'react';
import { ArrowLeftIcon } from './Icons';
import Footer from './Footer';
import { supabase } from '../lib/supabase'; // Adjust the path as needed

interface ContactProps {
  onNavigate: (route: string) => void;
}

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

const Contact: React.FC<ContactProps> = ({ onNavigate }) => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setSubmitStatus('error');
      setErrorMessage('Please fill in all fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setSubmitStatus('error');
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // Store contact message in Supabase
      const { data, error } = await supabase
        .from('contact_messages')
        .insert([
          {
            name: formData.name.trim(),
            email: formData.email.trim(),
            message: formData.message.trim(),
            status: 'new',
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) {
        console.error('Error storing contact message:', error);
        throw error;
      }

      console.log('Contact message stored successfully:', data);
      
      // Reset form and show success message
      setFormData({ name: '', email: '', message: '' });
      setSubmitStatus('success');
      
      // Optional: Send email notification (you can integrate with your email service)
      await sendEmailNotification(formData);
      
    } catch (error: any) {
      console.error('Failed to submit contact form:', error);
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendEmailNotification = async (formData: ContactFormData) => {
    try {
      // You can integrate with your email service here (Nodemailer, SendGrid, etc.)
      // For now, we'll just log it
      console.log('Email notification would be sent:', {
        to: 'support@webtrafficinsight.com',
        subject: `New Contact Message from ${formData.name}`,
        text: `
          Name: ${formData.name}
          Email: ${formData.email}
          Message: ${formData.message}
        `
      });

      // Example with your existing email endpoint (if you have one)
      // const response = await fetch('/api/send-contact-email', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });
      
      // if (!response.ok) throw new Error('Failed to send email notification');

    } catch (error) {
      console.error('Failed to send email notification:', error);
      // Don't fail the form submission if email fails
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', message: '' });
    setSubmitStatus('idle');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-primary via-brand-secondary to-brand-primary text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <span
            className="inline-block w-6 h-6 cursor-pointer hover:text-brand-accent transition-colors mb-4"
            onClick={() => onNavigate('/')}
            role="button"
            tabIndex={0}
            aria-label="Go back"
            onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') onNavigate('/'); }}
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </span>
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-lg text-slate-300">Get in touch with our team for support or inquiries.</p>
        </div>

        {/* Status Messages */}
        {submitStatus === 'success' && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-green-400">Message Sent Successfully!</h3>
                  <p className="text-green-300 text-sm">Thank you for contacting us. We'll get back to you soon.</p>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="text-green-300 hover:text-green-200 text-sm font-medium"
              >
                Send another message
              </button>
            </div>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-red-400">Error Sending Message</h3>
                <p className="text-red-300 text-sm">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 max-w-2xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3 text-brand-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span>support@webtrafficinsight.com</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3 text-brand-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>San Francisco, CA</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3 text-brand-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  <span>24/7 Support Available</span>
                </div>
              </div>
              
              {/* Response Time Info */}
              <div className="mt-6 p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <h3 className="font-semibold text-blue-400 mb-2">Response Time</h3>
                <p className="text-blue-300 text-sm">
                  We typically respond to all inquiries within 24 hours. For urgent matters, 
                  please mention "URGENT" in your message.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">Send us a message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    name="name"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>
                
                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Your Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>
                
                <div>
                  <textarea
                    rows={4}
                    name="message"
                    placeholder="Your Message"
                    value={formData.message}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-brand-accent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-accent text-brand-primary px-6 py-3 rounded-lg font-semibold hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </button>
                
                <p className="text-xs text-slate-400 text-center">
                  By submitting this form, you agree to our privacy policy and terms of service.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;