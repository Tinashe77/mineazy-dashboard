// Create this as src/components/CORSDebug.jsx
import React, { useState } from 'react';
import { Button, Card, CardContent, Alert } from './ui';
import api from '../services/api';

export const CORSDebug = () => {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runComprehensiveTest = async () => {
    setLoading(true);
    const results = {
      timestamp: new Date().toISOString(),
      environment: {
        origin: window.location.origin,
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        apiBaseUrl: 'https://minings.onrender.com/api/v1'
      },
      tests: {}
    };

    try {
      // Test 1: Basic connectivity
      console.log('🧪 Test 1: Basic connectivity...');
      try {
        const healthResponse = await fetch('https://minings.onrender.com/api/v1/health', {
          method: 'GET',
          credentials: 'include'
        });
        const healthData = await healthResponse.json();
        results.tests.connectivity = {
          success: true,
          status: healthResponse.status,
          data: healthData
        };
      } catch (error) {
        results.tests.connectivity = {
          success: false,
          error: error.message
        };
      }

      // Test 2: CORS preflight test
      console.log('🧪 Test 2: CORS preflight...');
      try {
        const corsResponse = await fetch('https://minings.onrender.com/api/v1/info', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        results.tests.cors = {
          success: corsResponse.ok,
          status: corsResponse.status,
          headers: Object.fromEntries(corsResponse.headers.entries())
        };
      } catch (error) {
        results.tests.cors = {
          success: false,
          error: error.message
        };
      }

      // Test 3: Login test
      console.log('🧪 Test 3: Login test...');
      try {
        // Clear any existing cookies first
        document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        const loginResponse = await fetch('https://minings.onrender.com/api/v1/auth/login', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'admin@mining-ecommerce.com',
            password: 'Admin123!@#'
          })
        });

        const loginData = await loginResponse.json();
        const cookieAfterLogin = document.cookie;
        const hasAuthCookie = cookieAfterLogin.includes('authToken');

        results.tests.login = {
          success: loginResponse.ok,
          status: loginResponse.status,
          data: loginData,
          cookiesAfterLogin: cookieAfterLogin,
          hasAuthCookie: hasAuthCookie,
          responseHeaders: Object.fromEntries(loginResponse.headers.entries())
        };

        // Test 4: Authenticated request test (only if login succeeded)
        if (loginResponse.ok) {
          console.log('🧪 Test 4: Authenticated request...');
          try {
            const ordersResponse = await fetch('https://minings.onrender.com/api/v1/orders', {
              method: 'GET',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              }
            });

            const ordersData = await ordersResponse.json();

            results.tests.authenticatedRequest = {
              success: ordersResponse.ok,
              status: ordersResponse.status,
              data: ordersData,
              cookiesSent: document.cookie
            };
          } catch (error) {
            results.tests.authenticatedRequest = {
              success: false,
              error: error.message
            };
          }
        }
      } catch (error) {
        results.tests.login = {
          success: false,
          error: error.message
        };
      }

      // Test 5: Check browser compatibility
      console.log('🧪 Test 5: Browser compatibility...');
      results.tests.browserCompatibility = {
        supportsCredentials: 'credentials' in Request.prototype,
        supportsCookies: typeof document.cookie === 'string',
        supportsLocalStorage: typeof localStorage !== 'undefined',
        userAgent: navigator.userAgent,
        sameSiteSupport: 'SameSite' in document.createElement('meta')
      };

    } catch (error) {
      results.error = error.message;
    } finally {
      setTestResults(results);
      setLoading(false);
      console.log('🔍 Complete test results:', results);
    }
  };

  const testManualCookie = () => {
    // Test setting a cookie manually
    const testCookieValue = `test-${Date.now()}`;
    document.cookie = `testCookie=${testCookieValue}; path=/; max-age=3600`;
    
    const cookiesAfter = document.cookie;
    const foundCookie = cookiesAfter.includes(testCookieValue);
    
    alert(`Manual cookie test:\nSet: testCookie=${testCookieValue}\nCookies after: ${cookiesAfter}\nFound cookie: ${foundCookie}`);
    
    // Clean up
    document.cookie = 'testCookie=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  };

  const clearAllCookies = () => {
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
    });
    alert('All cookies cleared');
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <h3 className="text-lg font-medium mb-4">🔍 CORS & Authentication Diagnostic</h3>
        
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Button 
              onClick={runComprehensiveTest} 
              loading={loading}
              className="flex-1"
            >
              Run Full Diagnostic
            </Button>
            <Button 
              variant="outline" 
              onClick={testManualCookie}
              size="sm"
            >
              Test Manual Cookie
            </Button>
            <Button 
              variant="outline" 
              onClick={clearAllCookies}
              size="sm"
            >
              Clear Cookies
            </Button>
          </div>

          <div className="text-sm text-gray-600">
            <p><strong>Current Environment:</strong></p>
            <p>Origin: {window.location.origin}</p>
            <p>API: https://minings.onrender.com/api/v1</p>
            <p>Current Cookies: {document.cookie || 'None'}</p>
          </div>

          {testResults && (
            <div className="space-y-4">
              <Alert 
                variant={testResults.tests.login?.success ? 'success' : 'error'}
              >
                <strong>Key Finding:</strong> 
                {testResults.tests.login?.success 
                  ? `Login successful! Cookie set: ${testResults.tests.login.hasAuthCookie ? 'Yes' : 'No'}`
                  : `Login failed: ${testResults.tests.login?.error || 'Unknown error'}`
                }
              </Alert>

              <div className="bg-gray-50 p-3 rounded text-xs max-h-96 overflow-auto">
                <h4 className="font-medium mb-2">Detailed Results:</h4>
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(testResults, null, 2)}
                </pre>
              </div>

              {/* Quick Analysis */}
              <div className="bg-blue-50 p-3 rounded text-sm">
                <h4 className="font-medium mb-2">🔍 Analysis:</h4>
                <ul className="space-y-1">
                  <li>✅ Connectivity: {testResults.tests.connectivity?.success ? 'Working' : '❌ Failed'}</li>
                  <li>✅ CORS: {testResults.tests.cors?.success ? 'Working' : '❌ Failed'}</li>
                  <li>✅ Login: {testResults.tests.login?.success ? 'Working' : '❌ Failed'}</li>
                  <li>✅ Cookie Set: {testResults.tests.login?.hasAuthCookie ? 'Yes' : '❌ No'}</li>
                  <li>✅ Authenticated Request: {testResults.tests.authenticatedRequest?.success ? 'Working' : '❌ Failed'}</li>
                </ul>

                {testResults.tests.login?.success && !testResults.tests.login?.hasAuthCookie && (
                  <div className="mt-2 p-2 bg-yellow-100 rounded">
                    <strong>⚠️ Issue Detected:</strong> Login succeeds but no cookie is set. 
                    This is likely a SameSite or domain issue.
                  </div>
                )}

                {!testResults.tests.login?.success && (
                  <div className="mt-2 p-2 bg-red-100 rounded">
                    <strong>❌ Critical Issue:</strong> Login is failing entirely. 
                    Check CORS configuration or API credentials.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CORSDebug;