
// src/components/layout/Header.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui';
import { 
  Menu, 
  Search, 
  Bell, 
  User, 
  ChevronDown, 
  LogOut, 
  Settings as SettingsIcon 
} from 'lucide-react';

export const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-white border-b border-neutral-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left section */}
        <div className="flex items-center">
          <button
            type="button"
            className="lg:hidden p-2 rounded-md text-neutral-500 hover:text-neutral-600 hover:bg-neutral-100"
            onClick={onMenuClick}
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Search bar */}
          <div className="hidden sm:block ml-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-neutral-100 rounded-md w-80 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="p-2 text-neutral-500 hover:text-neutral-600 hover:bg-neutral-100 rounded-full">
            <Bell className="h-6 w-6" />
          </button>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              className="flex items-center space-x-3 p-2 rounded-md"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-neutral-900">{user?.name}</p>
                  <p className="text-xs text-neutral-500">
                    {user?.role?.replace('_', ' ').toUpperCase()}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
              </div>
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1">
                  <div className="px-4 py-2 border-b border-neutral-200">
                    <p className="text-sm font-medium text-neutral-900">{user?.name}</p>
                    <p className="text-xs text-neutral-500">{user?.email}</p>
                  </div>
                  
                  <button className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100">
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Profile Settings
                  </button>
                  
                  <button 
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};


