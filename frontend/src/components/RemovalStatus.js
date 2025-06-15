import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const RemovalStatus = ({ isConnected, currentUser, removalStats, onRefresh }) => {
  const [filterStatus, setFilterStatus] = useState('all');

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">No User Found</h2>
        <p className="text-gray-400">Please register first to view removal status.</p>
        <Link to="/" className="text-red-400 hover:text-red-300 underline">
          Go to Registration
        </Link>
      </div>
    );
  }

  if (!removalStats || removalStats.stats.total === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">No Removal Requests Yet</h2>
        <p className="text-gray-400 mb-6">Start your privacy protection to see removal status here.</p>
        <Link 
          to="/" 
          className="inline-block py-3 px-6 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          Start Privacy Protection
        </Link>
      </div>
    );
  }

  const filteredRequests = removalStats.requests.filter(request => {
    if (filterStatus === 'all') return true;
    return request.status === filterStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-900 border-green-700 text-green-200';
      case 'in_progress': return 'bg-yellow-900 border-yellow-700 text-yellow-200';
      case 'failed': return 'bg-red-900 border-red-700 text-red-200';
      default: return 'bg-gray-800 border-gray-700 text-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'in_progress':
        return (
          <svg className="w-5 h-5 text-yellow-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const completionPercentage = Math.round((removalStats.stats.completed / removalStats.stats.total) * 100);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Data Removal Status</h1>
        <p className="text-lg text-gray-300">
          Track your privacy protection progress across all data brokers
        </p>
      </div>

      {/* Progress Summary */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Overall Progress</h2>
          <button
            onClick={onRefresh}
            disabled={!isConnected}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Refresh Status
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{removalStats.stats.total}</div>
            <div className="text-sm text-gray-400">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{removalStats.stats.completed}</div>
            <div className="text-sm text-gray-400">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{removalStats.stats.in_progress}</div>
            <div className="text-sm text-gray-400">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">{removalStats.stats.pending}</div>
            <div className="text-sm text-gray-400">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{removalStats.stats.failed}</div>
            <div className="text-sm text-gray-400">Failed</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Progress</span>
            <span>{completionPercentage}% Complete</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-red-600 to-red-400 h-3 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-400 py-2 px-1">Filter by status:</span>
          {['all', 'pending', 'in_progress', 'completed', 'failed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Removal Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No requests found for the selected filter.</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div key={request.id} className={`rounded-lg p-6 border ${getStatusColor(request.status)}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{request.broker_name}</h3>
                  <p className="text-sm opacity-80">
                    Type: {request.removal_type === 'automated' ? 'Automated Removal' : 'Manual Process Required'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(request.status)}
                  <span className="font-medium">
                    {request.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm opacity-80">Created:</p>
                  <p className="font-medium">{new Date(request.created_at).toLocaleString()}</p>
                </div>
                {request.completed_at && (
                  <div>
                    <p className="text-sm opacity-80">Completed:</p>
                    <p className="font-medium">{new Date(request.completed_at).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {request.error_message && (
                <div className="bg-red-800 border border-red-600 rounded p-3 mb-4">
                  <p className="text-sm text-red-200">
                    <strong>Error:</strong> {request.error_message}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {request.removal_type === 'manual' && request.status === 'pending' && (
                  <>
                    <Link
                      to={`/manual/${request.broker_name.toLowerCase().replace(' ', '')}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      View Instructions
                    </Link>
                    <Link
                      to={`/email/${request.broker_name.toLowerCase().replace(' ', '')}`}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      Get Email Template
                    </Link>
                  </>
                )}
                
                {request.status === 'failed' && request.removal_type === 'automated' && (
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                    Retry Removal
                  </button>
                )}
                
                {request.confirmation_code && (
                  <div className="px-4 py-2 bg-green-800 text-green-200 rounded-lg text-sm">
                    Confirmation: {request.confirmation_code}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Help Section */}
      <div className="bg-blue-900 border border-blue-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          <svg className="w-5 h-5 text-blue-400 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          Status Guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-200 text-sm">
          <div>
            <p className="font-medium mb-1">Pending:</p>
            <p>Request created, waiting to be processed</p>
          </div>
          <div>
            <p className="font-medium mb-1">In Progress:</p>
            <p>Actively being removed from data broker</p>
          </div>
          <div>
            <p className="font-medium mb-1">Completed:</p>
            <p>Successfully removed from data broker</p>
          </div>
          <div>
            <p className="font-medium mb-1">Failed:</p>
            <p>Removal attempt failed, may require manual intervention</p>
          </div>
        </div>
        <div className="mt-4 text-blue-200 text-sm">
          <p><strong>Note:</strong> Manual removals require your action. Use the provided instructions and email templates to complete these removals.</p>
        </div>
      </div>

      {!isConnected && (
        <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-yellow-200 text-sm">
              Backend service is disconnected. Status may not be up to date.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemovalStatus;