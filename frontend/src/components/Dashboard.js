import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard = ({ 
  isConnected, 
  currentUser, 
  removalStats, 
  onStartRemoval, 
  onRefreshStats, 
  loading 
}) => {
  const hasStartedRemoval = removalStats && removalStats.stats.total > 0;
  const completionPercentage = removalStats 
    ? Math.round((removalStats.stats.completed / removalStats.stats.total) * 100)
    : 0;

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'in_progress': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'in_progress':
        return (
          <svg className="w-4 h-4 text-yellow-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold text-white mb-4">
          Welcome back, {currentUser?.personal_info?.first_name}!
        </h1>
        <p className="text-lg text-gray-300 mb-6">
          Your personal privacy protection dashboard
        </p>
        
        {!isConnected && (
          <div className="bg-red-900 border border-red-700 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-200">Backend service is not running</span>
            </div>
          </div>
        )}
      </div>

      {/* Progress Overview */}
      {hasStartedRemoval && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Removal Progress</h2>
            <span className="text-2xl font-bold text-red-400">{completionPercentage}%</span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-red-600 to-red-400 h-3 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{removalStats.stats.total}</div>
              <div className="text-sm text-gray-400">Total Requests</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{removalStats.stats.completed}</div>
              <div className="text-sm text-gray-400">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">{removalStats.stats.in_progress}</div>
              <div className="text-sm text-gray-400">In Progress</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-400">{removalStats.stats.pending}</div>
              <div className="text-sm text-gray-400">Pending</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Start/Continue Removal */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {hasStartedRemoval ? 'Continue Protection' : 'Start Privacy Protection'}
              </h3>
              <p className="text-gray-400 text-sm">
                {hasStartedRemoval 
                  ? 'Monitor and manage your ongoing data removal requests' 
                  : 'Begin removing your data from 8 major data brokers'
                }
              </p>
            </div>
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          
          <div className="space-y-3">
            {!hasStartedRemoval ? (
              <button
                onClick={onStartRemoval}
                disabled={!isConnected || loading}
                className="w-full py-3 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                    </svg>
                    <span>Starting Removal Process...</span>
                  </div>
                ) : (
                  'Start Data Removal Process'
                )}
              </button>
            ) : (
              <Link
                to="/status"
                className="block w-full py-3 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors text-center"
              >
                View Detailed Status
              </Link>
            )}
            
            <button
              onClick={onRefreshStats}
              disabled={!isConnected}
              className="w-full py-2 px-4 bg-gray-700 text-gray-300 font-medium rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Refresh Status
            </button>
          </div>
        </div>

        {/* Privacy Score */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Privacy Score</h3>
              <p className="text-gray-400 text-sm">
                Your current privacy protection level
              </p>
            </div>
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-4xl font-bold text-green-400 mb-2">
              {hasStartedRemoval ? `${completionPercentage}%` : '0%'}
            </div>
            <div className="text-sm text-gray-400 mb-4">
              {hasStartedRemoval 
                ? `${removalStats.stats.completed} of ${removalStats.stats.total} brokers removed`
                : 'No removals started yet'
              }
            </div>
            
            <div className="text-xs text-gray-500">
              Target: 100% (All 8 data brokers)
            </div>
          </div>
        </div>
      </div>

      {/* Data Broker Status */}
      {hasStartedRemoval && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Data Broker Status</h2>
            <button
              onClick={onRefreshStats}
              disabled={!isConnected}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {removalStats.requests.map((request) => (
              <div key={request.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-white">{request.broker_name}</h4>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(request.status)}
                    <span className={`text-sm font-medium ${getStatusColor(request.status)}`}>
                      {request.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="text-sm text-gray-400 mb-2">
                  Type: {request.removal_type === 'automated' ? 'Automated' : 'Manual'}
                </div>
                
                {request.removal_type === 'manual' && request.status === 'pending' && (
                  <Link
                    to={`/manual/${request.broker_name.toLowerCase().replace(' ', '')}`}
                    className="text-red-400 hover:text-red-300 text-sm underline"
                  >
                    View Instructions →
                  </Link>
                )}
                
                {request.completed_at && (
                  <div className="text-xs text-gray-500 mt-2">
                    Completed: {new Date(request.completed_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Benefits Section */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-6">Privacy Protection Benefits</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Reduce Spam Calls</h3>
            <p className="text-gray-400 text-sm">Significantly decrease unwanted telemarketing and robocalls</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Stop Spam Emails</h3>
            <p className="text-gray-400 text-sm">Reduce unwanted marketing emails and data sharing</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Protect Identity</h3>
            <p className="text-gray-400 text-sm">Safeguard against identity theft and data misuse</p>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      {hasStartedRemoval && (
        <div className="bg-blue-900 border border-blue-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            <svg className="w-5 h-5 text-blue-400 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Next Steps
          </h3>
          <div className="space-y-2 text-blue-200 text-sm">
            <p>• Monitor your removal progress in the Status tab</p>
            <p>• Complete manual removals for PeopleFinder and FamilyTreeNow</p>
            <p>• Check back weekly for status updates</p>
            <p>• Expect full completion within 7-30 days depending on the broker</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;