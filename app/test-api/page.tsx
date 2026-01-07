'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Clock, Play } from 'lucide-react'

interface TestResult {
  endpoint: string
  method: string
  status: 'pending' | 'success' | 'error'
  response?: any
  error?: string
  time?: number
}

export default function APITestPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [testing, setTesting] = useState(false)

  const apiTests = [
    // Auth APIs
    { endpoint: '/api/auth/register', method: 'POST', requiresAuth: false },
    { endpoint: '/api/auth/login', method: 'POST', requiresAuth: false },
    
    // User APIs
    { endpoint: '/api/user/profile', method: 'GET', requiresAuth: true },
    { endpoint: '/api/user/get-random-qr', method: 'GET', requiresAuth: true },
    
    // Products APIs
    { endpoint: '/api/products', method: 'GET', requiresAuth: false },
    { endpoint: '/api/products/675b8f123456789012345678', method: 'GET', requiresAuth: false },
    
    // Orders APIs
    { endpoint: '/api/orders', method: 'GET', requiresAuth: true },
    { endpoint: '/api/orders/purchase', method: 'POST', requiresAuth: true },
    
    // Transactions APIs
    { endpoint: '/api/transactions', method: 'GET', requiresAuth: true },
    { endpoint: '/api/transactions', method: 'POST', requiresAuth: true },
    
    // Location API
    { endpoint: '/api/location/detect', method: 'GET', requiresAuth: false },
    
    // Admin APIs
    { endpoint: '/api/admin/auth/login', method: 'POST', requiresAuth: false },
    { endpoint: '/api/admin/dashboard/stats', method: 'GET', requiresAuth: true },
    { endpoint: '/api/admin/users', method: 'GET', requiresAuth: true },
    { endpoint: '/api/admin/transactions', method: 'GET', requiresAuth: true },
    { endpoint: '/api/admin/products', method: 'GET', requiresAuth: true },
    { endpoint: '/api/admin/qr-codes', method: 'GET', requiresAuth: true },
    
    // Utility APIs
    { endpoint: '/api/rewards/process', method: 'POST', requiresAuth: true },
    { endpoint: '/api/referral/generate', method: 'POST', requiresAuth: true },
    { endpoint: '/api/referral/history', method: 'GET', requiresAuth: true },
  ]

  const testAPI = async (test: typeof apiTests[0]): Promise<TestResult> => {
    const startTime = Date.now()
    
    try {
      const headers: any = {
        'Content-Type': 'application/json'
      }

      // Add dummy auth token for protected routes
      if (test.requiresAuth) {
        headers['Authorization'] = 'Bearer dummy-token-for-testing'
      }

      let body = undefined
      if (test.method === 'POST') {
        // Add dummy data based on endpoint
        if (test.endpoint.includes('register')) {
          body = JSON.stringify({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
          })
        } else if (test.endpoint.includes('login')) {
          body = JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
          })
        } else if (test.endpoint.includes('purchase')) {
          body = JSON.stringify({
            productId: '675b8f123456789012345678',
            quantity: 1
          })
        } else if (test.endpoint.includes('transactions')) {
          body = JSON.stringify({
            type: 'deposit',
            amount: 500,
            utr: 'TEST123456'
          })
        } else if (test.endpoint.includes('referral/generate')) {
          body = JSON.stringify({
            count: 1
          })
        } else {
          body = JSON.stringify({})
        }
      }

      const response = await fetch(test.endpoint, {
        method: test.method,
        headers,
        body
      })

      const data = await response.json()
      const time = Date.now() - startTime

      return {
        endpoint: test.endpoint,
        method: test.method,
        status: response.ok ? 'success' : 'error',
        response: data,
        time
      }
    } catch (error) {
      const time = Date.now() - startTime
      return {
        endpoint: test.endpoint,
        method: test.method,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        time
      }
    }
  }

  const runAllTests = async () => {
    setTesting(true)
    setResults([])

    const testResults: TestResult[] = []

    for (const test of apiTests) {
      // Add pending result
      const pendingResult: TestResult = {
        endpoint: test.endpoint,
        method: test.method,
        status: 'pending'
      }
      testResults.push(pendingResult)
      setResults([...testResults])

      // Run test
      const result = await testAPI(test)
      
      // Update result
      testResults[testResults.length - 1] = result
      setResults([...testResults])

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    setTesting(false)
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500 animate-spin" />
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'pending':
        return 'bg-yellow-50 border-yellow-200'
    }
  }

  const successCount = results.filter(r => r.status === 'success').length
  const errorCount = results.filter(r => r.status === 'error').length
  const pendingCount = results.filter(r => r.status === 'pending').length

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">API Test Dashboard</h1>
        <p className="text-gray-600">Test all API endpoints to check their status and functionality</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{apiTests.length}</div>
          <div className="text-sm text-blue-800">Total APIs</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{successCount}</div>
          <div className="text-sm text-green-800">Success</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{errorCount}</div>
          <div className="text-sm text-red-800">Errors</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          <div className="text-sm text-yellow-800">Pending</div>
        </div>
      </div>

      {/* Test Button */}
      <div className="mb-6">
        <button
          onClick={runAllTests}
          disabled={testing}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <Play className="h-5 w-5" />
          <span>{testing ? 'Testing APIs...' : 'Run All Tests'}</span>
        </button>
      </div>

      {/* Results */}
      <div className="space-y-3">
        {results.map((result, index) => (
          <div
            key={`${result.endpoint}-${result.method}-${index}`}
            className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                {getStatusIcon(result.status)}
                <span className="font-mono text-sm font-medium">
                  {result.method} {result.endpoint}
                </span>
              </div>
              {result.time && (
                <span className="text-sm text-gray-500">{result.time}ms</span>
              )}
            </div>

            {result.status === 'error' && result.error && (
              <div className="mt-2 p-2 bg-red-100 rounded text-sm text-red-800">
                <strong>Error:</strong> {result.error}
              </div>
            )}

            {result.response && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                  View Response
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(result.response, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}

        {results.length === 0 && !testing && (
          <div className="text-center py-12 text-gray-500">
            <Play className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Click "Run All Tests" to start testing APIs</p>
          </div>
        )}
      </div>
    </div>
  )
}
