import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

// Desktop app configuration
const isElectron = () => {
  return window && window.process && window.process.type;
};

// Backend URL - always localhost for desktop app
const BACKEND_URL = 'http://127.0.0.1:8001';
const API = `${BACKEND_URL}/api`;

// License status component
const LicenseStatus = ({ licenseInfo, onPurchase }) => {
  if (!licenseInfo) return null;

  if (licenseInfo.isLicensed) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
        <div className="flex items-center">
          <span className="text-green-600 mr-2">✅</span>
          <span className="text-green-800 font-medium">Licensed Version</span>
        </div>
      </div>
    );
  }

  if (licenseInfo.isTrial) {
    return (
      <div className={`border rounded-lg p-3 mb-4 ${
        licenseInfo.daysRemaining > 3 
          ? 'bg-blue-50 border-blue-200' 
          : 'bg-orange-50 border-orange-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className={`mr-2 ${
              licenseInfo.daysRemaining > 3 ? 'text-blue-600' : 'text-orange-600'
            }`}>
              ⏰
            </span>
            <span className={`font-medium ${
              licenseInfo.daysRemaining > 3 ? 'text-blue-800' : 'text-orange-800'
            }`}>
              Trial: {licenseInfo.daysRemaining} days remaining
            </span>
          </div>
          {licenseInfo.daysRemaining <= 7 && (
            <button
              onClick={onPurchase}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Purchase License
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-red-600 mr-2">❌</span>
          <span className="text-red-800 font-medium">License Required</span>
        </div>
        <button
          onClick={onPurchase}
          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
        >
          Purchase License
        </button>
      </div>
    </div>
  );
};

// Components
const Header = () => (
  <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold">DataGuard Pro</h1>
      <p className="text-blue-100 mt-2">Automated Data Broker Removal Service</p>
    </div>
  </header>
);

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
    <div className="flex items-center mb-3">
      <span className="text-2xl mr-3">{icon}</span>
      <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
    </div>
    <p className="text-gray-600">{description}</p>
  </div>
);

const UserProfileForm = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    current_address: '',
    previous_addresses: [''],
    date_of_birth: '',
    family_members: ['']
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayField = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayField = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanedData = {
      ...formData,
      previous_addresses: formData.previous_addresses.filter(addr => addr.trim()),
      family_members: formData.family_members.filter(member => member.trim())
    };
    onSubmit(cleanedData);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Information</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="John Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="John"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Address *
          </label>
          <input
            type="text"
            name="current_address"
            value={formData.current_address}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="123 Main St, Anytown, CA 12345"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Previous Addresses
          </label>
          {formData.previous_addresses.map((address, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={address}
                onChange={(e) => handleArrayChange('previous_addresses', index, e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Previous address"
              />
              {formData.previous_addresses.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayField('previous_addresses', index)}
                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayField('previous_addresses')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add Another Address
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Family Members (helps find more records)
          </label>
          {formData.family_members.map((member, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={member}
                onChange={(e) => handleArrayChange('family_members', index, e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Family member name"
              />
              {formData.family_members.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayField('family_members', index)}
                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayField('family_members')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add Family Member
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition duration-200 disabled:opacity-50"
        >
          {isLoading ? 'Creating Profile...' : 'Start Data Removal Process'}
        </button>
      </form>
    </div>
  );
};

const Dashboard = ({ user, onStartRemoval, summary, requests, brokers, loadUserData, setCurrentView }) => {
  const [isProcessingAutomation, setIsProcessingAutomation] = useState(false);
  const [automationStatus, setAutomationStatus] = useState(null);
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'requires_manual': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const startAutomatedRemoval = async () => {
    if (!user) return;
    
    setIsProcessingAutomation(true);
    try {
      const response = await axios.post(`${API}/removal-requests/process-automated/${user.id}`);
      
      // Get updated automation status
      const statusResponse = await axios.get(`${API}/removal-requests/automation-status/${user.id}`);
      setAutomationStatus(statusResponse.data);
      
      // Reload user data
      await loadUserData(user.id);
      
      alert(`Automation completed! Processed ${response.data.processed} automated removals.`);
    } catch (error) {
      console.error('Error processing automated removals:', error);
      alert('Error processing automated removals. Please try again.');
    } finally {
      setIsProcessingAutomation(false);
    }
  };

  const loadAutomationStatus = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get(`${API}/removal-requests/automation-status/${user.id}`);
      setAutomationStatus(response.data);
    } catch (error) {
      console.error('Error loading automation status:', error);
    }
  };

  useEffect(() => {
    if (user && requests.length > 0) {
      loadAutomationStatus();
    }
  }, [user, requests]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Welcome back, {user.first_name}!
        </h2>
        
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{summary.total_brokers}</div>
              <div className="text-sm text-gray-600">Total Brokers</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{summary.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{summary.pending + summary.in_progress}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{summary.success_rate}%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>
        )}

        {!requests || requests.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">
              Ready to start removing your data from {summary?.total_brokers || 0} data brokers?
            </div>
            <button
              onClick={onStartRemoval}
              className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition duration-200"
            >
              Start Removal Process
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Automation Controls */}
            {automationStatus && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border-l-4 border-purple-500">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">🤖 Automated Removal Status</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-medium text-green-700 mb-2">
                      ✅ Automated Brokers ({automationStatus.automated_brokers.count})
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      These brokers support full automation
                    </p>
                    {automationStatus.automated_brokers.count > 0 && (
                      <button
                        onClick={startAutomatedRemoval}
                        disabled={isProcessingAutomation}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-2 px-4 rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessingAutomation ? (
                          <span className="flex items-center justify-center">
                            <div className="spinner mr-2"></div>
                            Processing Automation...
                          </span>
                        ) : (
                          '🤖 Run Automated Removal'
                        )}
                      </button>
                    )}
                  </div>
                  
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-medium text-orange-700 mb-2">
                      📝 Manual Brokers ({automationStatus.manual_brokers.count})
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      These require manual opt-out processes
                    </p>
                    {automationStatus.manual_brokers.count > 0 && (
                      <button
                        onClick={() => setCurrentView('manual-instructions')}
                        className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white py-2 px-4 rounded-lg font-medium hover:from-orange-700 hover:to-orange-800 transition duration-200"
                      >
                        View Manual Instructions
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Progress Overview */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Removal Progress</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {requests.map((request) => {
                  const broker = brokers.find(b => b.id === request.data_broker_id);
                  const isAutomated = broker?.automation_available;
                  
                  return (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <div className="font-medium text-gray-800">{broker?.name || 'Unknown Broker'}</div>
                          {isAutomated && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                              🤖 Automated
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{broker?.website}</div>
                        <div className="text-xs text-gray-400">Method: {request.method_used}</div>
                        {request.notes && (
                          <div className="text-xs text-blue-600 mt-1">{request.notes}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {formatStatus(request.status)}
                        </span>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(request.submitted_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ManualInstructionsView = ({ user, setCurrentView }) => {
  const [manualInstructions, setManualInstructions] = useState(null);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [emailTemplate, setEmailTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadManualInstructions();
    }
  }, [user]);

  const loadManualInstructions = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await axios.get(`${API}/manual-instructions/${user.id}`);
      setManualInstructions(response.data.checklist);
    } catch (error) {
      console.error('Error loading manual instructions:', error);
      alert('Failed to load manual instructions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateEmailTemplate = async (brokerId, brokerName) => {
    if (!user) return;
    
    try {
      const response = await axios.post(`${API}/manual-instructions/generate-email?user_id=${user.id}&broker_id=${brokerId}`);
      setEmailTemplate(response.data.email_template);
      setSelectedBroker(brokerName);
      
      // Scroll to email template after generation
      setTimeout(() => {
        const emailSection = document.getElementById(`email-template-${brokerName.replace(/\s+/g, '-')}`);
        if (emailSection) {
          emailSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
    } catch (error) {
      console.error('Error generating email template:', error);
      alert('Failed to generate email template. Please try again.');
    }
  };

  const copyToClipboard = async (text, label = 'Text') => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        // Use the modern clipboard API
        await navigator.clipboard.writeText(text);
        alert(`${label} copied to clipboard!`);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'absolute';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          alert(`${label} copied to clipboard!`);
        } catch (err) {
          console.error('Fallback copy failed:', err);
          alert('Failed to copy to clipboard. Please manually select and copy the text.');
        }
        
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Clipboard operation failed:', err);
      alert('Failed to copy to clipboard. Please manually select and copy the text.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="spinner"></div>
        <span className="ml-2">Loading manual instructions...</span>
      </div>
    );
  }

  if (!manualInstructions) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No manual instructions available.</p>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Manual Removal Instructions</h2>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-200"
          >
            ← Back to Dashboard
          </button>
        </div>
        
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded">
          <p className="text-orange-800">
            📝 These {manualInstructions.total_manual_brokers} data brokers require manual removal. 
            Estimated total time: <strong>{manualInstructions.estimated_total_time}</strong>
          </p>
        </div>
      </div>

      {/* Manual Brokers */}
      {manualInstructions.brokers.map((broker, index) => (
        <div key={index} className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">{broker.broker_name}</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => generateEmailTemplate(broker.broker_id || 'unknown', broker.broker_name)}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 text-sm"
              >
                Generate Email
              </button>
              <a
                href={broker.removal_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition duration-200 text-sm"
              >
                Visit Opt-Out Page
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Instructions */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Step-by-Step Instructions</h4>
              <div className="space-y-3">
                {broker.instructions.steps.map((step, stepIndex) => (
                  <div key={stepIndex} className="border rounded-lg p-3">
                    <div className="flex items-start space-x-3">
                      <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                        {step.step}
                      </span>
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-800">{step.title}</h5>
                        <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                        {step.details && (
                          <p className="text-xs text-gray-500 mt-1">{step.details}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tips */}
              {broker.instructions.tips && (
                <div className="mt-4">
                  <h5 className="font-medium text-gray-800 mb-2">💡 Tips</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {broker.instructions.tips.map((tip, tipIndex) => (
                      <li key={tipIndex} className="flex items-start space-x-2">
                        <span className="text-green-500">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Checklist */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Progress Checklist</h4>
              <div className="space-y-2">
                {broker.checklist_items.map((item, itemIndex) => (
                  <label key={itemIndex} className="flex items-center space-x-3 p-2 border rounded cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      defaultChecked={item.completed}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{item.task}</span>
                  </label>
                ))}
              </div>

              {/* Contact Info */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-800 mb-2">Contact Information</h5>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Website:</strong> {broker.website}</p>
                  <p><strong>Removal URL:</strong> 
                    <a href={broker.removal_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                      {broker.removal_url}
                    </a>
                  </p>
                  {broker.instructions.contact_info?.email && (
                    <p><strong>Email:</strong> {broker.instructions.contact_info.email}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Email Template Modal */}
          {emailTemplate && selectedBroker === broker.broker_name && (
            <div 
              id={`email-template-${broker.broker_name.replace(/\s+/g, '-')}`}
              className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg shadow-lg"
            >
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">📧</span>
                <h5 className="text-lg font-bold text-blue-800">Personalized Email Template Generated!</h5>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  ✅ Your personalized removal email is ready! Copy the content below and send it to {broker.broker_name}.
                </p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={emailTemplate.subject}
                      readOnly
                      className="flex-1 p-2 border rounded text-sm bg-white"
                    />
                    <button
                      onClick={() => copyToClipboard(emailTemplate.subject, 'Email Subject')}
                      className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Body:</label>
                  <div className="space-y-2">
                    <textarea
                      value={emailTemplate.body}
                      readOnly
                      rows={12}
                      className="w-full p-3 border rounded text-sm bg-white"
                    />
                    <button
                      onClick={() => copyToClipboard(emailTemplate.body, 'Email Body')}
                      className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                    >
                      Copy Email Body
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Email:</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={emailTemplate.recipient}
                      readOnly
                      className="flex-1 p-2 border rounded text-sm bg-white"
                    />
                    <button
                      onClick={() => copyToClipboard(emailTemplate.recipient, 'Email Address')}
                      className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setEmailTemplate(null);
                  setSelectedBroker(null);
                }}
                className="mt-3 bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
              >
                Close Email Template
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const App = () => {
  const [currentView, setCurrentView] = useState('home');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [requests, setRequests] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [appStatus, setAppStatus] = useState(null);

  useEffect(() => {
    checkAppStatus();
    initializeDataBrokers();
    loadDataBrokers();
    
    // Check license status if running in Electron
    if (isElectron()) {
      checkLicenseStatus();
    }
  }, []);

  const checkAppStatus = async () => {
    try {
      const response = await axios.get(`${API}/status`);
      setAppStatus(response.data);
    } catch (error) {
      console.error('Error checking app status:', error);
      setAppStatus({ status: 'error', message: 'Backend not available' });
    }
  };

  const checkLicenseStatus = async () => {
    try {
      if (window.require) {
        const { ipcRenderer } = window.require('electron');
        const licenseStatus = await ipcRenderer.invoke('get-license-status');
        setLicenseInfo(licenseStatus);
      }
    } catch (error) {
      console.error('Error checking license:', error);
    }
  };

  const handlePurchaseLicense = async () => {
    try {
      if (window.require) {
        const { shell } = window.require('electron');
        shell.openExternal('https://dataguardpro.com/purchase');
      } else {
        window.open('https://dataguardpro.com/purchase', '_blank');
      }
    } catch (error) {
      console.error('Error opening purchase page:', error);
    }
  };

  const initializeDataBrokers = async () => {
    try {
      await axios.post(`${API}/data-brokers/initialize`);
    } catch (error) {
      console.error('Error initializing data brokers:', error);
    }
  };

  const loadDataBrokers = async () => {
    try {
      const response = await axios.get(`${API}/data-brokers`);
      setBrokers(response.data);
    } catch (error) {
      console.error('Error loading data brokers:', error);
    }
  };

  const createUserProfile = async (formData) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API}/users`, formData);
      setUser(response.data);
      await loadUserData(response.data.id);
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Error creating user profile:', error);
      alert('Error creating profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async (userId) => {
    try {
      const [summaryResponse, requestsResponse] = await Promise.all([
        axios.get(`${API}/removal-requests/summary/${userId}`),
        axios.get(`${API}/removal-requests/user/${userId}`)
      ]);
      setSummary(summaryResponse.data);
      setRequests(requestsResponse.data);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const startRemovalProcess = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await axios.post(`${API}/removal-requests/bulk-create/${user.id}`);
      await loadUserData(user.id);
      alert('Removal process started! We\'ve submitted requests to all supported data brokers.');
    } catch (error) {
      console.error('Error starting removal process:', error);
      alert('Error starting removal process. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderHome = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">
          Take Control of Your Digital Privacy
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Stop spam calls, texts, and emails by automatically removing your personal information 
          from data brokers and people search websites.
        </p>
        <button
          onClick={() => setCurrentView('signup')}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition duration-200"
        >
          Start Data Removal
        </button>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard
          icon="🤖"
          title="Automated Removal"
          description="Our AI-powered system automatically submits removal requests to major data brokers."
        />
        <FeatureCard
          icon="🛡️"
          title="Privacy Protection"
          description="Reduce your digital footprint and protect yourself from identity theft and scams."
        />
        <FeatureCard
          icon="📊"
          title="Progress Tracking"
          description="Monitor removal progress with real-time updates and success notifications."
        />
      </section>

      {/* Data Broker Info */}
      <section className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Supported Data Brokers</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {brokers.slice(0, 8).map((broker) => (
            <div key={broker.id} className="text-center p-3 border rounded-lg">
              <div className="font-medium text-gray-800">{broker.name}</div>
              <div className="text-sm text-gray-500">{broker.type.replace('_', ' ')}</div>
              <div className={`text-xs mt-1 ${broker.automation_available ? 'text-green-600' : 'text-orange-600'}`}>
                {broker.automation_available ? 'Automated' : 'Manual'}
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-4 text-gray-600">
          And {brokers.length > 8 ? brokers.length - 8 : 0} more data brokers...
        </div>
      </section>
    </div>
  );

  const renderSignup = () => (
    <div className="max-w-2xl mx-auto">
      <UserProfileForm onSubmit={createUserProfile} isLoading={isLoading} />
    </div>
  );

  const renderDashboard = () => (
    <Dashboard
      user={user}
      summary={summary}
      requests={requests}
      brokers={brokers}
      onStartRemoval={startRemovalProcess}
      loadUserData={loadUserData}
      setCurrentView={setCurrentView}
    />
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex space-x-6">
            <button
              onClick={() => setCurrentView('home')}
              className={`font-medium transition duration-200 ${
                currentView === 'home' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Home
            </button>
            {user && (
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`font-medium transition duration-200 ${
                  currentView === 'dashboard' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Dashboard
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {currentView === 'home' && renderHome()}
        {currentView === 'signup' && renderSignup()}
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'manual-instructions' && (
          <ManualInstructionsView 
            user={user} 
            setCurrentView={setCurrentView}
          />
        )}
      </main>

      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h3 className="text-lg font-semibold mb-2">DataGuard Pro</h3>
          <p className="text-gray-400">
            Protecting your privacy by removing your data from data brokers
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
