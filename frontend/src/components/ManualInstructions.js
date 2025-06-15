import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";
const API = `${BACKEND_URL}/api`;

const ManualInstructions = ({ isConnected, currentUser }) => {
  const { brokerName } = useParams();
  const [instructions, setInstructions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completedSteps, setCompletedSteps] = useState([]);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    loadInstructions();
  }, [brokerName]);

  const loadInstructions = async () => {
    if (!isConnected) {
      setError('Backend service is not connected');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API}/removal/manual/${brokerName}`);
      setInstructions(response.data);
      setError('');
    } catch (error) {
      console.error('Failed to load instructions:', error);
      setError('Failed to load removal instructions');
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (stepIndex) => {
    setCompletedSteps(prev => {
      if (prev.includes(stepIndex)) {
        return prev.filter(i => i !== stepIndex);
      } else {
        return [...prev, stepIndex];
      }
    });
  };

  const markAsComplete = async () => {
    if (!currentUser) {
      setError('No user found. Please register first.');
      return;
    }

    setIsCompleting(true);
    try {
      await axios.post(`${API}/removal/manual/complete`, {
        user_id: currentUser.id,
        broker_name: instructions.broker.name,
        confirmation_code: confirmationCode || undefined
      });
      
      alert('Manual removal marked as completed! You can view the status in your dashboard.');
    } catch (error) {
      console.error('Failed to mark as complete:', error);
      setError('Failed to mark removal as completed');
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        <span className="ml-2 text-gray-300">Loading instructions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-900 border border-red-700 rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-red-200 mb-2">Error</h2>
          <p className="text-red-300">{error}</p>
          <Link to="/status" className="text-red-400 hover:text-red-300 underline mt-4 block">
            Back to Status
          </Link>
        </div>
      </div>
    );
  }

  if (!instructions) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">Instructions Not Found</h2>
        <p className="text-gray-400 mb-6">No manual instructions available for this broker.</p>
        <Link to="/status" className="text-red-400 hover:text-red-300 underline">
          Back to Status
        </Link>
      </div>
    );
  }

  const allStepsCompleted = completedSteps.length === instructions.instructions.steps.length;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">
          Manual Removal Instructions
        </h1>
        <h2 className="text-xl text-red-400 mb-2">{instructions.broker.name}</h2>
        <p className="text-gray-300">{instructions.broker.description}</p>
      </div>

      {/* Progress Indicator */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Progress</h3>
          <span className="text-red-400 font-medium">
            {completedSteps.length} / {instructions.instructions.steps.length} steps completed
          </span>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
          <div 
            className="bg-gradient-to-r from-red-600 to-red-400 h-3 rounded-full transition-all duration-300"
            style={{ 
              width: `${(completedSteps.length / instructions.instructions.steps.length) * 100}%` 
            }}
          ></div>
        </div>
        
        <div className="text-sm text-gray-400">
          Estimated time: {instructions.instructions.estimated_time}
        </div>
      </div>

      {/* Instructions Card */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Step-by-Step Instructions</h3>
          <a
            href={instructions.broker.removal_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Open {instructions.broker.name} →
          </a>
        </div>

        <div className="space-y-4">
          {instructions.instructions.steps.map((step, index) => (
            <div key={index} className="flex items-start space-x-4">
              <button
                onClick={() => toggleStep(index)}
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  completedSteps.includes(index)
                    ? 'bg-green-600 border-green-600'
                    : 'border-gray-500 hover:border-green-500'
                }`}
              >
                {completedSteps.includes(index) && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              
              <div className="flex-1">
                <div className={`p-4 rounded-lg transition-colors ${
                  completedSteps.includes(index)
                    ? 'bg-green-900 border border-green-700'
                    : 'bg-gray-700 border border-gray-600'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">
                      Step {index + 1}
                    </span>
                    {completedSteps.includes(index) && (
                      <span className="text-xs text-green-400 font-medium">
                        ✓ COMPLETED
                      </span>
                    )}
                  </div>
                  <p className="text-white">{step}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Email Template Link */}
      {instructions.instructions.email_required && (
        <div className="bg-blue-900 border border-blue-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Email Template Required</h3>
              <p className="text-blue-200">
                This removal process requires sending an email. Use our pre-written template.
              </p>
            </div>
            <Link
              to={`/email/${brokerName}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Email Template
            </Link>
          </div>
        </div>
      )}

      {/* Completion Section */}
      {allStepsCompleted && (
        <div className="bg-green-900 border border-green-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            🎉 All Steps Completed!
          </h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="confirmationCode" className="block text-sm font-medium text-green-200 mb-2">
                Confirmation Code (Optional)
              </label>
              <input
                type="text"
                id="confirmationCode"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                placeholder="Enter confirmation code if provided"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <button
              onClick={markAsComplete}
              disabled={!currentUser || isCompleting}
              className="w-full py-3 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCompleting ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                  </svg>
                  <span>Marking as Complete...</span>
                </div>
              ) : (
                'Mark Removal as Complete'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">
          <svg className="w-5 h-5 text-yellow-400 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Important Tips
        </h3>
        <div className="space-y-2 text-gray-300 text-sm">
          <p>• Follow each step carefully and in order</p>
          <p>• Keep screenshots of confirmation pages as proof</p>
          <p>• Some sites may take 24-48 hours to process removal requests</p>
          <p>• If a step doesn't work, try refreshing the page and starting over</p>
          <p>• Contact support if you encounter persistent issues</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Link
          to="/status"
          className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
        >
          ← Back to Status
        </Link>
        
        {instructions.instructions.email_required && (
          <Link
            to={`/email/${brokerName}`}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Get Email Template →
          </Link>
        )}
      </div>

      {!isConnected && (
        <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-yellow-200 text-sm">
              Backend service is disconnected. You may not be able to mark completion.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualInstructions;