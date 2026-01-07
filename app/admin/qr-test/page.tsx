'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import Cookies from 'js-cookie'

export default function QRTestPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testQRCreation = async (country: 'IN' | 'GB') => {
    setLoading(true)
    setResult(null)

    try {
      const token = Cookies.get('adminToken')
      
      const testData = {
        name: `Test ${country} QR`,
        qrImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        countryCode: country,
        paymentMethod: country === 'IN' ? 'UPI' : 'Bank Transfer',
        upiId: country === 'IN' ? 'test@paytm' : '',
        bankDetails: country === 'GB' ? {
          accountNumber: '12345678',
          sortCode: '12-34-56',
          bankName: 'Test Bank',
          accountHolderName: 'Test Account'
        } : {},
        description: `Test QR code for ${country}`
      }

      console.log('Sending data:', testData)

      const response = await fetch('/api/admin/qr-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testData)
      })

      const data = await response.json()
      console.log('Response:', data)
      
      setResult({ status: response.status, data })

      if (response.ok) {
        toast.success(`${country} QR code created successfully!`)
      } else {
        toast.error(`Failed to create ${country} QR code: ${data.message}`)
      }
    } catch (error) {
      console.error('Error:', error)
      setResult({ error: error.message })
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const initializeAdmin = async () => {
    try {
      const response = await fetch('/api/admin/init', {
        method: 'POST'
      })
      const data = await response.json()
      console.log('Admin init response:', data)
      toast.success('Admin initialized')
    } catch (error) {
      console.error('Admin init error:', error)
      toast.error('Failed to initialize admin')
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">QR Code Creation Test</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={initializeAdmin}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Initialize Admin
        </button>
        
        <div className="flex space-x-4">
          <button
            onClick={() => testQRCreation('IN')}
            disabled={loading}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
          >
            🇮🇳 Test India QR Creation
          </button>
          
          <button
            onClick={() => testQRCreation('GB')}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            🇬🇧 Test UK QR Creation
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2">Creating QR code...</p>
        </div>
      )}

      {result && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-bold mb-2">Result:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
