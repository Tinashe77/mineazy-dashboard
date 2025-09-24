// src/components/layout/Sidebar.jsx - Clean version with role-based navigation
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils';
import {
  Home,
  Package,
  Users,
  Building2,
  ShoppingCart,
  CreditCard,
  BarChart3,
  FileText,
  MessageSquare,
  Shield,
  Settings,
  HelpCircle,
  Rss,
  LayoutGrid,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['admin', 'shop_manager', 'super_admin', 'customer'] },
  { name: 'Products', href: '/products', icon: Package, roles: ['admin', 'shop_manager', 'super_admin'] },
  { name: 'Orders', href: '/orders', icon: ShoppingCart, roles: ['admin', 'shop_manager', 'super_admin'] },
  { name: 'Users', href: '/users', icon: Users, roles: ['admin', 'super_admin'] },
  { name: 'Branches', href: '/branches', icon: Building2, roles: ['admin', 'super_admin'] },
  { name: 'Payments', href: '/payments', icon: CreditCard, roles: ['admin', 'shop_manager', 'super_admin'] },
  { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['admin', 'shop_manager', 'super_admin'] },
  { name: 'Blog', href: '/blog', icon: Rss, roles: ['admin', 'shop_manager', 'super_admin'] },
  { name: 'Blog Categories', href: '/blog/categories', icon: LayoutGrid, roles: ['admin', 'shop_manager', 'super_admin'] },
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
        'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4">
            <h1 className="text-xl font-bold text-primary-700">Mineazy</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href || 
                               (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
              
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    'group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary-700 text-white'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  )}
                >
                  <item.icon 
                    className={cn(
                      'mr-3 flex-shrink-0 h-5 w-5',
                      isActive ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-500'
                    )}
                  />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};