'use client'

import { useState, useEffect } from 'react'
import { QrCode, TrendingUp, Globe, Activity } from 'lucide-react'
import Cookies from 'js-cookie'
import Link from 'next/link'

interface QRStats {
  totalQRCodes: number
  totalDeposits: number
  totalTransactions: number
  activeQRCodes: number
  countryBreakdown: Array<{
    country: string
    code: string
    currency: string
    totalDeposits: number
    totalTransactions: number
    activeQRs: number
  }>
}

export default function QRAnalyticsWidget() {
  const [qrStats, setQrStats] = useState<QRStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQRStats()
  }, [])

  const fetchQRStats = async () => {
    try {
      const token = Cookies.get('adminToken')
      const response = await fetch('/api/admin/qr-analytics?days=30', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setQrStats({
          totalQRCodes: data.summary.totalQRCodes,
          totalDeposits: data.summary.totalDeposits,
          totalTransactions: data.summary.totalTransactions,
          activeQRCodes: data.summary.activeQRCodes,
          countryBreakdown: data.countryStats
        })
      }
    } catch (error) {
      console.error('Error fetching QR stats:', error)
    } finally {
      setLoading(false)
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

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!qrStats) {
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <QrCode className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">QR Analytics</h3>
            <p className="text-sm text-slate-600">Last 30 days performance</p>
          </div>
        </div>
        <Link
          href="/admin/qr-analytics"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View Details →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <div className="text-2xl font-bold text-slate-900">{qrStats.totalQRCodes}</div>
          <div className="text-sm text-slate-600">Total QR Codes</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{qrStats.activeQRCodes}</div>
          <div className="text-sm text-slate-600">Active QRs</div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">Total Deposits:</span>
          <span className="font-semibold text-slate-900">
            ₹{qrStats.totalDeposits.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">Total Transactions:</span>
          <span className="font-semibold text-slate-900">{qrStats.totalTransactions}</span>
        </div>
      </div>

      {qrStats.countryBreakdown.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-900 mb-2">Country Breakdown</h4>
          <div className="space-y-2">
            {qrStats.countryBreakdown.map((country) => (
              <div key={country.code} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getCountryFlag(country.code)}</span>
                  <span className="text-sm font-medium text-slate-900">{country.country}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900">
                    {formatCurrency(country.totalDeposits, country.currency)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {country.totalTransactions} transactions
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {qrStats.countryBreakdown.length === 0 && (
        <div className="text-center py-4">
          <QrCode className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No QR code activity yet</p>
        </div>
      )}
    </div>
  )
}
