import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import Registration from "./components/Registration";
import RemovalStatus from "./components/RemovalStatus";
import ManualInstructions from "./components/ManualInstructions";
import EmailTemplates from "./components/EmailTemplates";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";
const API = `${BACKEND_URL}/api`;

// Check if running in Electron
const isElectron = () => {
  return window && window.process && window.process.type;
};

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [removalStats, setRemovalStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // Test backend connection on startup
  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await axios.get(`${API}/`, { timeout: 5000 });
        if (response.data.message) {
          setIsConnected(true);
          console.log("DataGuard Pro backend connected successfully");
        }
      } catch (error) {
        console.error("Backend connection failed:", error);
        setIsConnected(false);
      }
    };

    testConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(testConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load user from localStorage on startup
  useEffect(() => {
    const savedUser = localStorage.getItem('dataguard_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // Load removal stats when user is set
  useEffect(() => {
    if (currentUser && isConnected) {
      loadRemovalStats();
    }
  }, [currentUser, isConnected]);

  const loadRemovalStats = async () => {
    if (!currentUser) return;
    
    try {
      const response = await axios.get(`${API}/removal/status/${currentUser.id}`);
      setRemovalStats(response.data);
    } catch (error) {
      console.error("Failed to load removal stats:", error);
    }
  };

  const handleUserRegistration = (user) => {
    setCurrentUser(user);
    localStorage.setItem('dataguard_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setRemovalStats(null);
    localStorage.removeItem('dataguard_user');
  };

  const startRemovalProcess = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      await axios.post(`${API}/removal/bulk?user_id=${currentUser.id}`);
      // Reload stats after starting process
      setTimeout(() => {
        loadRemovalStats();
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to start removal process:", error);
      setLoading(false);
    }
  };

  return (
    <div className="App min-h-screen bg-gray-900 text-white">
      <BrowserRouter>
        <Header 
          isConnected={isConnected} 
          isElectron={isElectron()} 
          currentUser={currentUser}
          onLogout={handleLogout}
        />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route 
              path="/" 
              element={
                !currentUser ? (
                  <Registration 
                    isConnected={isConnected}
                    onUserRegistered={handleUserRegistration}
                  />
                ) : (
                  <Dashboard 
                    isConnected={isConnected}
                    currentUser={currentUser}
                    removalStats={removalStats}
                    onStartRemoval={startRemovalProcess}
                    onRefreshStats={loadRemovalStats}
                    loading={loading}
                  />
                )
              } 
            />
            <Route 
              path="/status" 
              element={
                <RemovalStatus 
                  isConnected={isConnected}
                  currentUser={currentUser}
                  removalStats={removalStats}
                  onRefresh={loadRemovalStats}
                />
              } 
            />
            <Route 
              path="/manual/:brokerName" 
              element={
                <ManualInstructions 
                  isConnected={isConnected}
                  currentUser={currentUser}
                />
              } 
            />
            <Route 
              path="/email/:brokerName" 
              element={
                <EmailTemplates 
                  isConnected={isConnected}
                  currentUser={currentUser}
                />
              } 
            />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;