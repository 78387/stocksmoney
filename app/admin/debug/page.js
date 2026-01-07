'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export default function AdminDebug() {
  const [tokenInfo, setTokenInfo] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState({});

  useEffect(() => {
    const token = Cookies.get('adminToken');
    if (token) {
      try {
        // Decode JWT token (basic decode, not verification)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        setTokenInfo(JSON.parse(jsonPayload));
      } catch (error) {
        setTokenInfo({ error: 'Invalid token format' });
      }
    }
  }, []);

  const testAPI = async (endpoint, label) => {
    setLoading(prev => ({ ...prev, [label]: true }));
    try {
      const token = Cookies.get('adminToken');
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setTestResults(prev => ({
        ...prev,
        [label]: { 
          status: response.status, 
          success: response.ok,
          data,
          endpoint,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [label]: { 
          error: error.message, 
          endpoint,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [label]: false }));
    }
  };

  const clearResults = () => {
    setTestResults({});
  };

  const testEndpoints = [
    { endpoint: '/api/admin/qr-codes/test', label: 'Basic QR Test' },
    { endpoint: '/api/admin/qr-codes', label: 'QR Codes API' },
    { endpoint: '/api/admin/transactions?type=deposit', label: 'Deposits API' },
    { endpoint: '/api/admin/transactions?type=withdraw', label: 'Withdrawals API' },
    { endpoint: '/api/admin/transactions', label: 'All Transactions' },
    { endpoint: '/api/admin/users', label: 'Users API' },
    { endpoint: '/api/admin/dashboard', label: 'Dashboard API' }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin System Debug</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Info */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Admin Token Info</h2>
          <div className="space-y-3">
            <div>
              <strong>Token Source:</strong> Cookies.get('adminToken')
            </div>
            <div>
              <strong>Token Status:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                Cookies.get('adminToken') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {Cookies.get('adminToken') ? 'Present' : 'Missing'}
              </span>
            </div>
            <div className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
              <pre>{tokenInfo ? JSON.stringify(tokenInfo, null, 2) : 'No token found in cookies'}</pre>
            </div>
          </div>
        </div>

        {/* Environment Info */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Environment Info</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
            <div><strong>Admin Token:</strong> {Cookies.get('adminToken') ? 'Present' : 'Missing'}</div>
            <div><strong>User Token:</strong> {Cookies.get('token') ? 'Present' : 'Missing'}</div>
            <div><strong>Timestamp:</strong> {new Date().toLocaleString()}</div>
            <div><strong>User Agent:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* API Tests */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">API Endpoint Tests</h2>
          <button 
            onClick={clearResults}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear Results
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {testEndpoints.map(({ endpoint, label }) => (
            <button 
              key={label}
              onClick={() => testAPI(endpoint, label)}
              disabled={loading[label]}
              className={`p-3 rounded text-left transition-colors ${
                loading[label] 
                  ? 'bg-gray-200 cursor-not-allowed' 
                  : testResults[label]?.success 
                    ? 'bg-green-100 hover:bg-green-200 border-green-300' 
                    : testResults[label]?.error || (testResults[label] && !testResults[label].success)
                      ? 'bg-red-100 hover:bg-red-200 border-red-300'
                      : 'bg-blue-100 hover:bg-blue-200 border-blue-300'
              } border`}
            >
              <div className="font-medium">{label}</div>
              <div className="text-xs text-gray-600">{endpoint}</div>
              {loading[label] && (
                <div className="text-xs text-blue-600 mt-1">Testing...</div>
              )}
              {testResults[label] && (
                <div className="text-xs mt-1">
                  {testResults[label].success ? (
                    <span className="text-green-600">✅ Success ({testResults[label].status})</span>
                  ) : testResults[label].error ? (
                    <span className="text-red-600">❌ Error: {testResults[label].error}</span>
                  ) : (
                    <span className="text-red-600">❌ Failed ({testResults[label].status})</span>
                  )}
                  <div className="text-gray-500">{testResults[label].timestamp}</div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Test Results */}
        {Object.keys(testResults).length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detailed Results</h3>
            {Object.entries(testResults).map(([label, result]) => (
              <div key={label} className="border rounded p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">{label}</h4>
                  <span className={`px-2 py-1 rounded text-xs ${
                    result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? `Success (${result.status})` : result.error ? 'Error' : `Failed (${result.status})`}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Endpoint:</strong> {result.endpoint}
                </div>
                <div className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-60">
                  <pre>{JSON.stringify(result.data || result.error, null, 2)}</pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="space-x-3">
          <button 
            onClick={() => window.location.href = '/admin/login'}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Re-login
          </button>
          <button 
            onClick={() => {
              Cookies.remove('adminToken');
              window.location.reload();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear Token & Reload
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}
