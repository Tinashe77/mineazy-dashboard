// src/pages/auth/LoginPage.jsx - Debug version
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input, Alert } from '../../components/ui';
import { Eye, EyeOff } from 'lucide-react';
import api from '../../services/api';

export const LoginPage = () => {
  const { login, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: 'admin@mining-ecommerce.com',
    password: 'Admin123!@#'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [debugInfo, setDebugInfo] = useState(null);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    
    if (!validateForm()) {
      return;
    }

    try {
      setDebugInfo(null);
      console.log('Starting login with:', formData.email);
      
      // Debug: Check API base URL
      console.log('API Base URL:', api.baseURL);
      
      // Debug: Test connection first
      try {
        const healthCheck = await api.getHealthCheck();
        console.log('Health check response:', healthCheck);
      } catch (healthError) {
        console.error('Health check failed:', healthError);
        setDebugInfo(prev => ({ ...prev, healthCheck: { error: healthError.message } }));
      }
      
      const response = await login(formData.email, formData.password);
      
      // Debug: Check what we got back
      setDebugInfo({
        loginResponse: response,
        cookieAfterLogin: api.isAuthenticated(),
        tokenAfterLogin: api.getAuthToken(),
        allCookies: document.cookie
      });
      
      console.log('Login successful, debug info:', {
        response,
        hasCookie: api.isAuthenticated(),
        token: api.getAuthToken()?.substring(0, 20) + '...'
      });
      
    } catch (error) {
      console.error('Login failed:', error);
      setDebugInfo({
        error: error.message,
        status: error.status,
        cookieAfterError: api.isAuthenticated(),
        allCookies: document.cookie
      });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const testDirectAPI = async () => {
    try {
      setDebugInfo(null);
      const response = await fetch('https://minings.onrender.com/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();
      
      setDebugInfo({
        directAPI: true,
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        data: data,
        cookiesAfter: document.cookie
      });
      
    } catch (error) {
      setDebugInfo({
        directAPI: true,
        error: error.message
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Mineazy Portal</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your admin dashboard
          </p>
        </div>
        
        {error && (
          <Alert variant="error" onClose={clearError}>
            {error}
          </Alert>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={formErrors.email}
              placeholder="Enter your email"
            />
            
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                error={formErrors.password}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Button
              type="submit"
              loading={loading}
              className="w-full"
            >
              Sign in
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={testDirectAPI}
              className="w-full"
            >
              Test Direct API
            </Button>
          </div>
        </form>
        
        {/* Debug Information */}
        {debugInfo && (
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
            <h4 className="font-medium mb-2">Debug Info:</h4>
            <pre className="whitespace-pre-wrap overflow-auto max-h-40">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="mt-6 text-xs text-gray-500 bg-gray-50 p-4 rounded-lg">
          <p className="font-medium mb-2">Test Credentials:</p>
          <div className="space-y-1">
            <p><strong>Admin:</strong> admin@mining-ecommerce.com / Admin123!@#</p>
            <p><strong>Manager:</strong> manager.harare@mining-ecommerce.com / Manager123!@#</p>
            <p><strong>Customer:</strong> customer@mining-ecommerce.com / Customer123!@#</p>
          </div>
        </div>
      </div>
    </div>
  );
};