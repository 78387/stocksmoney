'use client'

import { useState, useEffect } from 'react'
import { 
  QrCode, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  Filter,
  Download,
  Eye,
  Globe,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'

interface QRAnalytics {
  _id: string
  name: string
  country: {
    code: string
    name: string
    currency: string
  }
  paymentMethod: string
  totalDeposits: number
  totalTransactions: number
  isActive: boolean
  lastUsed?: string
  createdAt: string
  recentTransactions: Array<{
    amount: number
    date: string
    userId: string
    userName: string
  }>
  monthlyStats: Array<{
    month: string
    deposits: number
    transactions: number
  }>
}

interface CountryStats {
  country: string
  code: string
  currency: string
  symbol: string
  totalDeposits: number
  totalTransactions: number
  activeQRs: number
  totalQRs: number
}

export default function QRAnalyticsPage() {
  const [qrAnalytics, setQrAnalytics] = useState<QRAnalytics[]>([])
  const [countryStats, setCountryStats] = useState<CountryStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL')
  const [dateRange, setDateRange] = useState<string>('30')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  useEffect(() => {
    fetchQRAnalytics()
  }, [selectedCountry, dateRange])

  const fetchQRAnalytics = async () => {
    try {
      const token = Cookies.get('adminToken')
      const params = new URLSearchParams()
      if (selectedCountry !== 'ALL') params.append('country', selectedCountry)
      if (dateRange !== 'all') params.append('days', dateRange)

      const response = await fetch(`/api/admin/qr-analytics?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setQrAnalytics(data.qrAnalytics)
        setCountryStats(data.countryStats)
      } else {
        toast.error('Failed to load QR analytics')
      }
    } catch (error) {
      console.error('Error fetching QR analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const exportAnalytics = async () => {
    try {
      const token = Cookies.get('adminToken')
      const params = new URLSearchParams()
      if (selectedCountry !== 'ALL') params.append('country', selectedCountry)
      if (dateRange !== 'all') params.append('days', dateRange)

      const response = await fetch(`/api/admin/qr-analytics/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `qr_analytics_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Analytics exported successfully')
      } else {
        toast.error('Failed to export analytics')
      }
    } catch (error) {
      console.error('Error exporting analytics:', error)
      toast.error('Something went wrong')
    }
  }

  const getCountryFlag = (countryCode: string) => {
    const flags: { [key: string]: string } = {
      'IN': '🇮🇳',
      'GB': '🇬🇧'
    }
    return flags[countryCode] || '🌍'
  }

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: { [key: string]: string } = {
      'INR': '₹',
      'GBP': '£'
    }
    return `${symbols[currency] || '$'}${amount.toLocaleString()}`
  }

  const getTotalStats = () => {
    return qrAnalytics.reduce((acc, qr) => ({
      totalDeposits: acc.totalDeposits + qr.totalDeposits,
      totalTransactions: acc.totalTransactions + qr.totalTransactions
    }), { totalDeposits: 0, totalTransactions: 0 })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    )
  }

  const totalStats = getTotalStats()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QR Code Analytics</h1>
          <p className="text-gray-600">Monitor QR code performance across countries</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={exportAnalytics}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Countries</option>
            <option value="IN">🇮🇳 India</option>
            <option value="GB">🇬🇧 United Kingdom</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>

          <div className="flex items-center space-x-2 ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <Activity className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Country Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <QrCode className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total QR Codes</p>
              <p className="text-2xl font-bold text-gray-900">{qrAnalytics.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Deposits</p>
              <p className="text-2xl font-bold text-gray-900">
                {selectedCountry === 'ALL' ? '₹' : (selectedCountry === 'IN' ? '₹' : '£')}
                {totalStats.totalDeposits.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{totalStats.totalTransactions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Activity className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active QR Codes</p>
              <p className="text-2xl font-bold text-gray-900">
                {qrAnalytics.filter(qr => qr.isActive).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Country Breakdown */}
      {selectedCountry === 'ALL' && countryStats.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Country Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {countryStats.map((country) => (
              <div key={country.code} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getCountryFlag(country.code)}</span>
                    <span className="font-semibold text-gray-900">{country.country}</span>
                  </div>
                  <span className="text-sm text-gray-500">{country.currency}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Deposits:</span>
                    <span className="font-medium">{formatCurrency(country.totalDeposits, country.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Transactions:</span>
                    <span className="font-medium">{country.totalTransactions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">QR Codes:</span>
                    <span className="font-medium">{country.activeQRs}/{country.totalQRs} active</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QR Code Analytics */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {qrAnalytics.map((qr) => (
            <div key={qr._id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${qr.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                    <QrCode className={`h-5 w-5 ${qr.isActive ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{qr.name}</h3>
                    <p className="text-sm text-gray-500">{qr.paymentMethod}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-lg">{getCountryFlag(qr.country.code)}</span>
                  <span className="text-xs text-gray-500">{qr.country.currency}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Deposits:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(qr.totalDeposits, qr.country.currency)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Transactions:</span>
                  <span className="font-medium text-gray-900">{qr.totalTransactions}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg per Transaction:</span>
                  <span className="font-medium text-gray-900">
                    {qr.totalTransactions > 0 
                      ? formatCurrency(qr.totalDeposits / qr.totalTransactions, qr.country.currency)
                      : formatCurrency(0, qr.country.currency)
                    }
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Used:</span>
                  <span className="text-sm text-gray-500">
                    {qr.lastUsed 
                      ? new Date(qr.lastUsed).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    qr.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {qr.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Recent Transactions */}
              {qr.recentTransactions && qr.recentTransactions.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Transactions</h4>
                  <div className="space-y-1">
                    {qr.recentTransactions.slice(0, 3).map((transaction, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span className="text-gray-600">
                          {new Date(transaction.date).toLocaleDateString()}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(transaction.amount, qr.country.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    QR Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Deposits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transactions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Used
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {qrAnalytics.map((qr) => (
                  <tr key={qr._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <QrCode className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{qr.name}</div>
                          <div className="text-sm text-gray-500">{qr.paymentMethod}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getCountryFlag(qr.country.code)}</span>
                        <span className="text-sm text-gray-900">{qr.country.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-600">
                        {formatCurrency(qr.totalDeposits, qr.country.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{qr.totalTransactions}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {qr.totalTransactions > 0 
                          ? formatCurrency(qr.totalDeposits / qr.totalTransactions, qr.country.currency)
                          : formatCurrency(0, qr.country.currency)
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {qr.lastUsed 
                          ? new Date(qr.lastUsed).toLocaleDateString()
                          : 'Never'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        qr.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {qr.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {qrAnalytics.length === 0 && (
        <div className="text-center py-12">
          <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No QR codes found</h3>
          <p className="text-gray-600">
            {selectedCountry === 'ALL' 
              ? 'No QR codes have been created yet'
              : `No QR codes found for ${selectedCountry === 'IN' ? 'India' : 'United Kingdom'}`
            }
          </p>
        </div>
      )}
    </div>
  )
}
