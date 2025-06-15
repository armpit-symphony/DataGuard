import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";
const API = `${BACKEND_URL}/api`;

const EmailTemplates = ({ isConnected, currentUser }) => {
  const { brokerName } = useParams();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadTemplate();
  }, [brokerName, currentUser]);

  const loadTemplate = async () => {
    if (!isConnected) {
      setError('Backend service is not connected');
      setLoading(false);
      return;
    }

    if (!currentUser) {
      setError('No user found. Please register first.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API}/email-template/${brokerName}?user_id=${currentUser.id}`);
      setTemplate(response.data);
      setError('');
    } catch (error) {
      console.error('Failed to load email template:', error);
      if (error.response?.status === 404) {
        setError('Email template not found for this broker');
      } else {
        setError('Failed to load email template');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openEmailClient = () => {
    if (!template) return;
    
    const subject = encodeURIComponent(template.subject);
    const body = encodeURIComponent(template.template);
    
    // Try to open the default email client
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        <span className="ml-2 text-gray-300">Loading email template...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-900 border border-red-700 rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-red-200 mb-2">Error</h2>
          <p className="text-red-300">{error}</p>
          <div className="mt-4 space-x-4">
            <Link to="/status" className="text-red-400 hover:text-red-300 underline">
              Back to Status
            </Link>
            {brokerName && (
              <Link to={`/manual/${brokerName}`} className="text-red-400 hover:text-red-300 underline">
                Back to Instructions
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">Template Not Found</h2>
        <p className="text-gray-400 mb-6">No email template available for this broker.</p>
        <Link to="/status" className="text-red-400 hover:text-red-300 underline">
          Back to Status
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">
          Email Template
        </h1>
        <h2 className="text-xl text-red-400 mb-2">{template.broker}</h2>
        <p className="text-gray-300">
          Pre-written email template for data removal request
        </p>
      </div>

      {/* Template Card */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {/* Email Header */}
        <div className="bg-gray-700 p-4 border-b border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Email Composition</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => copyToClipboard(`${template.subject}\n\n${template.template}`)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copied ? (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Copied!</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy All</span>
                  </div>
                )}
              </button>
              
              <button
                onClick={openEmailClient}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Open in Email</span>
                </div>
              </button>
            </div>
          </div>
          
          {/* Subject Line */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Subject:</label>
              <button
                onClick={() => copyToClipboard(template.subject)}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Copy Subject
              </button>
            </div>
            <div className="bg-gray-800 rounded p-3 border border-gray-600">
              <p className="text-white font-medium">{template.subject}</p>
            </div>
          </div>
        </div>

        {/* Email Body */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-gray-300">Email Body:</label>
            <button
              onClick={() => copyToClipboard(template.template)}
              className="text-xs text-blue-400 hover:text-blue-300 underline"
            >
              Copy Body
            </button>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
            <pre className="text-white whitespace-pre-wrap text-sm leading-relaxed">
              {template.template}
            </pre>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-900 border border-blue-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          <svg className="w-5 h-5 text-blue-400 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          How to Use This Template
        </h3>
        <div className="space-y-3 text-blue-200 text-sm">
          <p><strong>Option 1 - Email Client:</strong></p>
          <p>• Click "Open in Email" to automatically open your default email application</p>
          <p>• The subject and body will be pre-filled for you</p>
          <p>• Add the recipient email address and send</p>
          
          <p className="pt-2"><strong>Option 2 - Manual Copy:</strong></p>
          <p>• Copy the subject line and email body using the copy buttons</p>
          <p>• Open your preferred email service (Gmail, Outlook, etc.)</p>
          <p>• Paste the content and send to the appropriate contact</p>
          
          <p className="pt-2"><strong>Important:</strong></p>
          <p>• Double-check the recipient email address before sending</p>
          <p>• Keep a copy of the sent email for your records</p>
          <p>• Response time varies by broker (typically 7-30 days)</p>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">
          Contact Information
        </h3>
        <div className="bg-gray-700 rounded p-4">
          <p className="text-gray-300 text-sm mb-2">
            <strong>Find the contact email for {template.broker}:</strong>
          </p>
          <p className="text-white">
            Visit their privacy policy or contact page to find the appropriate email address for removal requests.
            Common addresses include:
          </p>
          <ul className="text-gray-300 text-sm mt-2 space-y-1">
            <li>• privacy@{brokerName.toLowerCase()}.com</li>
            <li>• support@{brokerName.toLowerCase()}.com</li>
            <li>• optout@{brokerName.toLowerCase()}.com</li>
            <li>• removal@{brokerName.toLowerCase()}.com</li>
          </ul>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Link
          to={`/manual/${brokerName}`}
          className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
        >
          ← Back to Instructions
        </Link>
        
        <Link
          to="/status"
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          View All Status →
        </Link>
      </div>

      {/* Help Section */}
      <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          <svg className="w-5 h-5 text-yellow-400 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Need Help?
        </h3>
        <div className="text-yellow-200 text-sm space-y-2">
          <p>• If the email bounces back, try finding an alternative contact method</p>
          <p>• Some companies may require you to fill out a web form instead</p>
          <p>• Keep records of all communication for follow-up if needed</p>
          <p>• If no response after 30 days, consider sending a follow-up email</p>
        </div>
      </div>

      {!isConnected && (
        <div className="bg-red-900 border border-red-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-red-200 text-sm">
              Backend service is disconnected. Template may not be up to date.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplates;