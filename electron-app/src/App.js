import { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";

// For desktop app, backend runs on localhost:8001
const BACKEND_URL = "http://localhost:8001";
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const [status, setStatus] = useState({ connected: false, message: '' });
  const [statusChecks, setStatusChecks] = useState([]);
  const [newClientName, setNewClientName] = useState('');
  const [licenseInfo, setLicenseInfo] = useState(null);

  const checkBackendConnection = async () => {
    try {
      const response = await axios.get(`${API}/`);
      setStatus({ connected: true, message: response.data.message });
    } catch (e) {
      console.error(e, `errored out requesting / api`);
      setStatus({ connected: false, message: 'Backend connection failed' });
    }
  };

  const fetchStatusChecks = async () => {
    try {
      const response = await axios.get(`${API}/status`);
      setStatusChecks(response.data);
    } catch (e) {
      console.error(e, `errored out requesting /status api`);
    }
  };

  const addStatusCheck = async () => {
    if (!newClientName.trim()) return;
    
    try {
      await axios.post(`${API}/status`, {
        client_name: newClientName
      });
      setNewClientName('');
      await fetchStatusChecks(); // Refresh the list
    } catch (e) {
      console.error(e, `errored out creating status check`);
    }
  };

  const checkLicense = async () => {
    if (window.electronAPI) {
      try {
        const info = await window.electronAPI.getLicenseInfo();
        setLicenseInfo(info);
      } catch (e) {
        console.error('Could not get license info:', e);
      }
    }
  };

  useEffect(() => {
    checkBackendConnection();
    fetchStatusChecks();
    checkLicense();
    
    // Set up periodic refresh
    const interval = setInterval(() => {
      checkBackendConnection();
      fetchStatusChecks();
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img 
                src="https://avatars.githubusercontent.com/in/1201222?s=120&u=2686cf91179bbafbc7a71bfbc43004cf9ae1acea&v=4" 
                alt="App Logo"
                className="h-10 w-10 rounded-lg mr-3"
              />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Status Checker</h1>
                <p className="text-sm text-gray-500">Desktop Application</p>
              </div>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-3">
              <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
                status.connected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  status.connected ? 'bg-green-400' : 'bg-red-400'
                }`}></div>
                {status.connected ? 'Connected' : 'Disconnected'}
              </div>
              
              {licenseInfo && (
                <div className="text-sm text-gray-600">
                  Trial: {licenseInfo.daysLeft} days left
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Status Message */}
        <div className="mb-6">
          <div className={`p-4 rounded-lg ${
            status.connected 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-sm ${
              status.connected ? 'text-green-700' : 'text-red-700'
            }`}>
              {status.message || 'Checking connection...'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add Status Check */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Add Status Check</h2>
            <div className="flex space-x-3">
              <input
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Enter client name..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && addStatusCheck()}
              />
              <button
                onClick={addStatusCheck}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Add
              </button>
            </div>
          </div>

          {/* Recent Status Checks */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Status Checks</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {statusChecks.length === 0 ? (
                <p className="text-gray-500 text-sm">No status checks yet</p>
              ) : (
                statusChecks.slice(0, 10).map((check) => (
                  <div key={check.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <span className="font-medium text-gray-900">{check.client_name}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(check.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* All Status Checks Table */}
        {statusChecks.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">All Status Checks ({statusChecks.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {statusChecks.map((check) => (
                    <tr key={check.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {check.client_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(check.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {check.id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />}>
            <Route index element={<Home />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;