import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import Dashboard from "./components/Dashboard";
import StatusCheck from "./components/StatusCheck";
import Header from "./components/Header";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";
const API = `${BACKEND_URL}/api`;

// Check if running in Electron
const isElectron = () => {
  return window && window.process && window.process.type;
};

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [statusChecks, setStatusChecks] = useState([]);

  // Test backend connection on startup
  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await axios.get(`${API}/`, { timeout: 5000 });
        if (response.data.message) {
          setIsConnected(true);
          console.log("Backend connected successfully");
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

  // Load status checks
  const loadStatusChecks = async () => {
    try {
      const response = await axios.get(`${API}/status`);
      setStatusChecks(response.data);
    } catch (error) {
      console.error("Failed to load status checks:", error);
    }
  };

  useEffect(() => {
    if (isConnected) {
      loadStatusChecks();
    }
  }, [isConnected]);

  return (
    <div className="App min-h-screen bg-gray-900 text-white">
      <BrowserRouter>
        <Header isConnected={isConnected} isElectron={isElectron()} />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route 
              path="/" 
              element={
                <Dashboard 
                  isConnected={isConnected} 
                  statusChecks={statusChecks}
                  onRefresh={loadStatusChecks}
                />
              } 
            />
            <Route 
              path="/status" 
              element={
                <StatusCheck 
                  isConnected={isConnected}
                  onStatusAdded={loadStatusChecks}
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