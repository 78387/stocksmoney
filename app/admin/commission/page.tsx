'use client'

import { useState, useEffect } from 'react'
import { Percent, Save, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import Cookies from 'js-cookie'

export default function AdminCommissionPage() {
  const [platformCommission, setPlatformCommission] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCommission()
  }, [])

  const fetchCommission = async () => {
    try {
      const token = Cookies.get('adminToken')
      const response = await fetch('/api/admin/commission', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPlatformCommission(data.platformCommission)
      } else {
        toast.error('Failed to fetch commission settings')
      }
    } catch (error) {
      console.error('Error fetching commission:', error)
      toast.error('Failed to load commission settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (platformCommission < 0 || platformCommission > 100) {
      toast.error('Commission rate must be between 0-100%')
      return
    }

    setSaving(true)
    try {
      const token = Cookies.get('adminToken')
      const response = await fetch('/api/admin/commission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rate: platformCommission })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
      } else {
        toast.error(data.message || 'Failed to update commission')
      }
    } catch (error) {
      console.error('Error saving commission:', error)
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Commission Settings</h1>
        <p className="text-gray-600">Manage platform-wide commission rates</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="flex items-center mb-6">
          <TrendingUp className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold">Platform Commission Rate</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Commission Rate (%)
            </label>
            <div className="relative">
              <input
                type="number"
                value={platformCommission}
                onChange={(e) => setPlatformCommission(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                min="0"
                max="100"
                step="0.1"
                placeholder="Enter commission rate"
              />
              <Percent className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              This rate will be used for products that don't have individual commission rates set
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">How Commission Works:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Platform commission applies to all products by default</li>
              <li>• Individual products can override this with their own commission rate</li>
              <li>• Commission is calculated daily based on purchase amount</li>
              <li>• Users see their daily earnings in the orders section</li>
            </ul>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Commission Rate'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
