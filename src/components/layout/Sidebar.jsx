// src/components/layout/Sidebar.jsx - Clean version with role-based navigation
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils';
import {
  Home,
  Package,
  Users,
  UserCog,
  Building2,
  ShoppingCart,
  CreditCard,
  BarChart3,
  FileText,
  MessageSquare,
  Shield,
  Settings,
  HelpCircle,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['admin', 'shop_manager', 'super_admin', 'customer'] },
  { name: 'Products', href: '/products', icon: Package, roles: ['admin', 'shop_manager', 'super_admin'] },
  { name: 'Orders', href: '/orders', icon: ShoppingCart, roles: ['admin', 'shop_manager', 'super_admin'] },
  { name: 'Users', href: '/users', icon: Users, roles: ['admin', 'super_admin'] },
  { name: 'Shop Managers', href: '/shop-managers', icon: UserCog, roles: ['admin', 'super_admin'] },
  { name: 'Branches', href: '/branches', icon: Building2, roles: ['admin', 'super_admin'] },
  { name: 'Payments', href: '/payments', icon: CreditCard, roles: ['admin', 'shop_manager', 'super_admin'] },
  { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['admin', 'shop_manager', 'super_admin'] },
  { name: 'Inquiries', href: '/inquiries', icon: MessageSquare, roles: ['admin', 'shop_manager', 'super_admin'] },
  { name: 'Audit Logs', href: '/audit', icon: Shield, roles: ['admin', 'super_admin'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin', 'shop_manager', 'super_admin'] },
];

export const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, hasAnyRole } = useAuth();

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(item => 
    hasAnyRole(item.roles)
  );

  const handleNavigation = (href) => {
    navigate(href);
    if (onClose) {
      onClose(); // Close mobile sidebar
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-gray-600 bg-opacity-75"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-primary-700 to-primary-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 bg-primary-800">
            <h1 className="text-xl font-bold text-white">Mineazy Portal</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href || 
                               location.pathname.startsWith(item.href + '/');
              
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    'group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary-900 text-white'
                      : 'text-primary-100 hover:bg-primary-600 hover:text-white'
                  )}
                >
                  <item.icon 
                    className={cn(
                      'mr-3 flex-shrink-0 h-5 w-5',
                      isActive ? 'text-white' : 'text-primary-300 group-hover:text-white'
                    )}
                  />
                  {item.name}
                </button>
              );
            })}
          </nav>

          {/* Help section */}
          <div className="flex-shrink-0 px-4 py-4">
            <div className="bg-primary-900 bg-opacity-50 rounded-lg p-4">
              <div className="flex items-center">
                <HelpCircle className="h-5 w-5 text-primary-300 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-white">Need Help?</h3>
                  <p className="text-xs text-primary-200 mt-1">
                    Contact support for assistance with mining equipment management.
                  </p>
                </div>
              </div>
              <button className="w-full mt-3 bg-accent-500 text-primary-700 hover:bg-accent-600 text-xs font-medium py-2 px-3 rounded-md transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};