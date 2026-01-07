'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Download, 
  DollarSign,
  TrendingUp,
  Gift,
  Calendar,
  RefreshCw,
  Eye
} from 'lucide-react'
import toast from 'react-hot-toast'
import Cookies from 'js-cookie'

interface ReferralStats {
  totalReferrals: number
  totalReferralEarnings: number
  topReferrers: Array<{
    _id: string
    name: string
    email: string
    referralCode: string
    referralCount: number
    totalEarnings: number
  }>
}

interface ReferralUser {
  _id: string
  name: string
  email: string
  referralCode?: string
  referredBy?: string
  createdAt: string
  status: string
}

export default function AdminReferralsPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [users, setUsers] = useState<ReferralUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showAllUsers, setShowAllUsers] = useState(false)

  useEffect(() => {
    fetchReferralData()
  }, [])

  const fetchReferralData = async () => {
    try {
      const token = Cookies.get('adminToken')
      const response = await fetch('/api/admin/referrals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.statistics)
        setUsers(data.users)
      } else {
        toast.error('Failed to load referral data')
      }
    } catch (error) {
      console.error('Error fetching referral data:', error)
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const generateCodesForAllUsers = async () => {
    try {
      const response = await fetch('/api/generate-codes', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Generated referral codes for ${data.updatedCount} users`)
        fetchReferralData() // Refresh data
      } else {
        toast.error('Failed to generate codes')
      }
    } catch (error) {
      console.error('Generate codes error:', error)
      toast.error('Something went wrong')
    }
  }

  const exportReferralData = async () => {
    try {
      const token = Cookies.get('adminToken')
      const response = await fetch('/api/admin/referrals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'export' })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'referral-data.csv'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Referral data exported successfully!')
      } else {
        toast.error('Failed to export data')
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Something went wrong')
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Referral Management</h1>
          <p className="text-slate-600">Monitor and manage the referral program</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={generateCodesForAllUsers}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Generate Codes</span>
          </button>
          <button
            onClick={exportReferralData}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Referrals</p>
              <p className="text-3xl font-bold">{stats?.totalReferrals || 0}</p>
            </div>
            <Users className="h-10 w-10 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Earnings Paid</p>
              <p className="text-3xl font-bold">₹{stats?.totalReferralEarnings || 0}</p>
            </div>
            <DollarSign className="h-10 w-10 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Avg. per Referral</p>
              <p className="text-3xl font-bold">₹50</p>
            </div>
            <Gift className="h-10 w-10 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Top Referrers */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-8">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Top Referrers
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-slate-700">User</th>
                <th className="text-left py-3 px-6 font-medium text-slate-700">Referral Code</th>
                <th className="text-left py-3 px-6 font-medium text-slate-700">Total Referrals</th>
                <th className="text-left py-3 px-6 font-medium text-slate-700">Total Earnings</th>
              </tr>
            </thead>
            <tbody>
              {stats?.topReferrers && stats.topReferrers.length > 0 ? (
                stats.topReferrers.map((referrer, index) => (
                  <tr key={referrer._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium mr-3">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{referrer.name}</p>
                          <p className="text-sm text-slate-500">{referrer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {referrer.referralCode}
                      </code>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-blue-600">
                        {referrer.referralCount}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-green-600">
                        ₹{referrer.totalEarnings}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    No referral data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Users with Referral Data */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              All Users with Referral Data
            </h2>
            <button
              onClick={() => setShowAllUsers(!showAllUsers)}
              className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <Eye className="h-4 w-4" />
              <span>{showAllUsers ? 'Hide' : 'Show'} All Users</span>
            </button>
          </div>
        </div>
        
        {showAllUsers && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-slate-700">User</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-700">Referral Code</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-700">Referred By</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-700">Join Date</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-slate-900">{user.name}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {user.referralCode ? (
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                            {user.referralCode}
                          </code>
                        ) : (
                          <span className="text-gray-400 text-sm">No code</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {user.referredBy ? (
                          <code className="bg-blue-100 px-2 py-1 rounded text-sm text-blue-700">
                            {user.referredBy}
                          </code>
                        ) : (
                          <span className="text-gray-400 text-sm">Direct signup</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center text-sm text-slate-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(user.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
