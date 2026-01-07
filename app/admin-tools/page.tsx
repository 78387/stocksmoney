'use client'

import { useState } from 'react'

interface ApiResult {
  message?: string
  updatedCount?: number
  totalUsers?: number
  users?: any[]
  count?: number
  error?: string
}

export default function AdminToolsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ApiResult | null>(null)

  const generateCodes = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/generate-codes', {
        method: 'POST'
      })
      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const checkCodes = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-referral')
      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Tools</h1>
        
        <div className="space-y-4">
          <button
            onClick={generateCodes}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Generate Referral Codes for Existing Users'}
          </button>
          
          <button
            onClick={checkCodes}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Check Existing Referral Codes'}
          </button>
        </div>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Result:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
