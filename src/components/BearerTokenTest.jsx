// Add this component to test Bearer token authentication - src/components/BearerTokenTest.jsx
import React, { useState } from 'react';
import { Button, Card, CardContent, Alert } from './ui';
import api from '../services/api';

export const BearerTokenTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testBearerAuth = async () => {
    setLoading(true);
    const result = {
      timestamp: new Date().toISOString(),
      steps: {}
    };

    try {
      // Step 1: Clear existing auth
      console.log('🧹 Step 1: Clearing existing auth...');
      api.clearAuth();
      localStorage.removeItem('mineazy_auth_token');
      
      result.steps.clearAuth = {
        success: true,
        tokenAfterClear: api.getAuthToken(),
        authAfterClear: api.isAuthenticated()
      };

      // Step 2: Login and extract sessionId
      console.log('🔑 Step 2: Login and extract sessionId...');
      const loginResponse = await api.login('admin@mining-ecommerce.com', 'Admin123!@#');
      
      result.steps.login = {
        success: true,
        sessionId: loginResponse.sessionId,
        tokenAfterLogin: api.getAuthToken(),
        authAfterLogin: api.isAuthenticated(),
        fullResponse: loginResponse
      };

      // Step 3: Test authenticated request
      console.log('📋 Step 3: Test authenticated request...');
      const ordersResponse = await api.getOrders({ limit: 5 });
      
      result.steps.authenticatedRequest = {
        success: true,
        dataReceived: Array.isArray(ordersResponse.data) || Array.isArray(ordersResponse),
        ordersCount: (ordersResponse.data || ordersResponse || []).length,
        response: ordersResponse
      };

      // Step 4: Test profile request
      console.log('👤 Step 4: Test profile request...');
      const profileResponse = await api.getProfile();
      
      result.steps.profileRequest = {
        success: true,
        userName: profileResponse.user?.name || profileResponse.data?.user?.name,
        userEmail: profileResponse.user?.email || profileResponse.data?.user?.email,
        response: profileResponse
      };

      result.overallSuccess = true;
      result.message = '✅ Bearer token authentication working perfectly!';

    } catch (error) {
      result.overallSuccess = false;
      result.error = error.message;
      result.errorStatus = error.status;
      
      console.error('Bearer token test failed:', error);
    } finally {
      setTestResult(result);
      setLoading(false);
      console.log('🔍 Bearer token test results:', result);
    }
  };

  const showStoredToken = () => {
    const token = api.getAuthToken();
    const isAuth = api.isAuthenticated();
    
    alert(`Stored Token:\n${token ? token.substring(0, 50) + '...' : 'None'}\n\nAuthenticated: ${isAuth}\n\nLocalStorage: ${localStorage.getItem('mineazy_auth_token')?.substring(0, 50) + '...' || 'None'}`);
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <h3 className="text-lg font-medium mb-4">🔑 Bearer Token Authentication Test</h3>
        
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Button 
              onClick={testBearerAuth} 
              loading={loading}
              className="flex-1"
            >
              Test Bearer Token Auth
            </Button>
            <Button 
              variant="outline" 
              onClick={showStoredToken}
              size="sm"
            >
              Show Token
            </Button>
          </div>

          <div className="text-sm text-gray-600">
            <p><strong>Current Status:</strong></p>
            <p>Has Token: {api.isAuthenticated() ? 'Yes' : 'No'}</p>
            <p>Token Preview: {api.getAuthToken()?.substring(0, 20) + '...' || 'None'}</p>
          </div>

          {testResult && (
            <div className="space-y-4">
              <Alert 
                variant={testResult.overallSuccess ? 'success' : 'error'}
              >
                <strong>Result:</strong> {testResult.message || testResult.error}
              </Alert>

              <div className="bg-gray-50 p-3 rounded text-xs max-h-64 overflow-auto">
                <h4 className="font-medium mb-2">Test Details:</h4>
                <div className="space-y-2">
                  {Object.entries(testResult.steps).map(([step, data]) => (
                    <div key={step} className="border-l-2 border-blue-300 pl-2">
                      <div className="font-medium text-blue-800">{step}:</div>
                      <div className="text-green-600">
                        ✅ {data.success ? 'Success' : '❌ Failed'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {testResult.overallSuccess && (
                <div className="bg-green-50 p-3 rounded text-sm">
                  <h4 className="font-medium text-green-800 mb-2">🎉 Authentication Working!</h4>
                  <p>You can now use all authenticated endpoints. The Bearer token authentication is working correctly.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BearerTokenTest;