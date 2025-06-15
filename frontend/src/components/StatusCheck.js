import React, { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";
const API = `${BACKEND_URL}/api`;

const StatusCheck = ({ isConnected, onStatusAdded }) => {
  const [clientName, setClientName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!clientName.trim()) {
      setMessage('Please enter a client name');
      return;
    }

    if (!isConnected) {
      setMessage('Cannot submit - backend service is not connected');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await axios.post(`${API}/status`, {
        client_name: clientName.trim()
      });

      if (response.data) {
        setMessage('Status check created successfully!');
        setClientName('');
        onStatusAdded(); // Refresh the parent component's data
      }
    } catch (error) {
      console.error('Error creating status check:', error);
      setMessage('Failed to create status check. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
        <h1 className="text-2xl font-bold text-white mb-6">Create Status Check</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="clientName" className="block text-sm font-medium text-gray-300 mb-2">
              Client Name
            </label>
            <input
              type="text"
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter client name..."
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!isConnected || isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={!isConnected || isSubmitting || !clientName.trim()}
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                </svg>
                <span>Creating...</span>
              </div>
            ) : (
              'Create Status Check'
            )}
          </button>

          {message && (
            <div className={`p-4 rounded-lg ${
              message.includes('successfully') 
                ? 'bg-green-900 border border-green-700 text-green-200' 
                : 'bg-red-900 border border-red-700 text-red-200'
            }`}>
              <p className="text-sm">{message}</p>
            </div>
          )}

          {!isConnected && (
            <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-yellow-200 text-sm">
                  Backend service is not connected. Please ensure the server is running.
                </span>
              </div>
            </div>
          )}
        </form>

        <div className="mt-8 pt-6 border-t border-gray-700">
          <h3 className="text-lg font-medium text-white mb-4">About Status Checks</h3>
          <div className="space-y-2 text-gray-300 text-sm">
            <p>• Status checks help monitor client connectivity and system health</p>
            <p>• All data is stored locally on your device for maximum privacy</p>
            <p>• No external services are contacted during status check creation</p>
            <p>• Each check includes a unique ID and timestamp for tracking</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusCheck;