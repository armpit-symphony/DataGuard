import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = ({ isConnected, isElectron }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DG</span>
              </div>
              <h1 className="text-xl font-bold text-white">DataGuard Pro</h1>
              {isElectron && (
                <span className="text-xs bg-green-600 px-2 py-1 rounded-full">Desktop</span>
              )}
            </div>
          </div>

          <nav className="flex space-x-6">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/status"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/status') 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              Status Check
            </Link>
          </nav>

          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-300">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;