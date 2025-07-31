/**
 * Admin Navbar Component - Phase 13
 * Navigation header for admin panel with user info and logout
 */

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminNavbar = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActiveRoute = (path) => {
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/ml', label: 'ML Models', icon: '🤖' },
    { path: '/admin/data', label: 'Data', icon: '📈' },
    { path: '/admin/logs', label: 'Logs', icon: '📝' },
    { path: '/admin/system', label: 'System', icon: '⚙️' }
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center">
            {/* Logo */}
            <Link to="/admin" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AQI</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Admin Panel</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1 ml-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActiveRoute(item.path)
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side - User Menu */}
          <div className="flex items-center space-x-4">
            {/* Quick Actions */}
            <div className="hidden lg:flex items-center space-x-2">
              <button
                onClick={() => window.open('/', '_blank')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="View Public Site"
              >
                <span className="text-sm">🌐</span>
              </button>
              
              <button
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Refresh Data"
              >
                <span className="text-sm">🔄</span>
              </button>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.name || 'Admin User'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.email}
                  </div>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    showUserMenu ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900">
                        {user?.name || 'Admin User'}
                      </div>
                      <div className="text-sm text-gray-500">{user?.email}</div>
                      <div className="text-xs text-blue-600 mt-1">
                        Role: {user?.role || 'admin'}
                      </div>
                    </div>

                    {/* Menu Items */}
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <span className="mr-2">👤</span>
                      Profile Settings
                    </Link>
                    
                    <Link
                      to="/admin/system"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <span className="mr-2">⚙️</span>
                      System Settings
                    </Link>
                    
                    <Link
                      to="/admin/logs"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <span className="mr-2">📝</span>
                      Recent Logs
                    </Link>

                    <div className="border-t border-gray-100">
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <span className="mr-2">🚪</span>
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-50">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActiveRoute(item.path)
                  ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
