// src/pages/auth/LoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input, Alert } from '../../components/ui';
import { Eye, EyeOff } from 'lucide-react';

export const LoginPage = () => {
  const { login, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: 'admin@mining-ecommerce.com',
    password: 'Admin123!@#'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

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
      await login(formData.email, formData.password);
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
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
          
          <Button
            type="submit"
            loading={loading}
            className="w-full"
          >
            Sign in
          </Button>
        </form>
        
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
