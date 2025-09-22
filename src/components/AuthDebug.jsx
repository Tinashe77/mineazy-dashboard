// Add this as a temporary component to test auth - src/components/AuthDebug.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card, CardContent } from './ui';
import api from '../services/api';

export const AuthDebug = () => {
  const { user, isAuthenticated, userRole } = useAuth();
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testAuthEndpoints = async () => {
    setLoading(true);
    const results = {};

    try {
      // Test 1: Check cookies
      results.cookieExists = api.isAuthenticated();
      results.authToken = api.getAuthToken();
      
      // Test 2: Test profile endpoint
      try {
        const profile = await api.getProfile();
        results.profileTest = { success: true, data: profile };
      } catch (error) {
        results.profileTest = { success: false, error: error.message, status: error.status };
      }

      // Test 3: Test products endpoint (should work without auth)
      try {
        const products = await api.getProducts({ limit: 1 });
        results.productsTest = { success: true, count: products.data?.length || 0 };
      } catch (error) {
        results.productsTest = { success: false, error: error.message, status: error.status };
      }

      // Test 4: Test create product endpoint (needs auth)
      try {
        const formData = new FormData();
        formData.append('name', 'Test Product Debug');
        formData.append('description', 'Debug test product');
        formData.append('price', '100');
        formData.append('category', 'Mining Equipment');
        formData.append('stock', '5');
        formData.append('sku', `DEBUG-${Date.now()}`);
        formData.append('active', 'true');

        const createResult = await api.createProduct(formData);
        results.createTest = { success: true, data: createResult };
      } catch (error) {
        results.createTest = { success: false, error: error.message, status: error.status };
      }

      setTestResult(results);
    } catch (error) {
      setTestResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const debugCookies = () => {
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      acc[name] = value;
      return acc;
    }, {});
    
    console.log('All cookies:', cookies);
    alert(`Cookies: ${JSON.stringify(cookies, null, 2)}`);
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <h3 className="text-lg font-medium mb-4">Authentication Debug Panel</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <strong>Auth State:</strong> {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </div>
          <div>
            <strong>User Role:</strong> {userRole || 'None'}
          </div>
          <div>
            <strong>User Name:</strong> {user?.name || 'None'}
          </div>
          <div>
            <strong>Cookie Present:</strong> {api.isAuthenticated() ? 'Yes' : 'No'}
          </div>
        </div>

        <div className="flex space-x-2 mb-4">
          <Button onClick={testAuthEndpoints} loading={loading} size="sm">
            Test API Endpoints
          </Button>
          <Button onClick={debugCookies} variant="outline" size="sm">
            Debug Cookies
          </Button>
        </div>

        {testResult && (
          <div className="bg-gray-50 p-3 rounded text-xs">
            <pre>{JSON.stringify(testResult, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};