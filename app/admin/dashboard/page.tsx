'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  ArrowDownLeft, 
  ArrowUpRight,
  TrendingUp,
  Calendar,
  Activity,
  DollarSign,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  Gift
} from 'lucide-react'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  newUsersThisMonth: number
  totalDeposits: number
  totalWithdrawals: number
  pendingDeposits: number
  pendingWithdrawals: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingRewards, setProcessingRewards] = useState(false)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const token = Cookies.get('adminToken')
      const response = await fetch('/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProcessRewards = async () => {
    setProcessingRewards(true)
    try {
      const response = await fetch('/api/rewards/process', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Processed ${data.processedRewards} rewards totaling ₹${data.totalRewardAmount}`)
        fetchDashboardStats() // Refresh stats
      } else {
        toast.error('Failed to process rewards')
      }
    } catch (error) {
      console.error('Error processing rewards:', error)
      toast.error('Something went wrong')
    } finally {
      setProcessingRewards(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm animate-pulse">
              <div className="h-4 bg-slate-200 rounded mb-3"></div>
              <div className="h-8 bg-slate-200 rounded mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers || 0,
      icon: UserCheck,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'New Users',
      subtitle: 'This Month',
      value: stats?.newUsersThisMonth || 0,
      icon: UserPlus,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      change: '+24%',
      changeType: 'positive'
    },
    {
      title: 'Total Revenue',
      value: `₹${((stats?.totalDeposits || 0) * 0.02).toLocaleString()}`,
      icon: DollarSign,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      change: '+15%',
      changeType: 'positive'
    }
  ]

  const actionCards = [
    {
      title: 'Pending Deposits',
      value: stats?.pendingDeposits || 0,
      icon: ArrowDownLeft,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      href: '/admin/deposits',
      urgent: (stats?.pendingDeposits || 0) > 0
    },
    {
      title: 'Pending Withdrawals',
      value: stats?.pendingWithdrawals || 0,
      icon: ArrowUpRight,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      href: '/admin/withdrawals',
      urgent: (stats?.pendingWithdrawals || 0) > 0
    },
    {
      title: 'Total Deposits',
      value: `₹${stats?.totalDeposits?.toLocaleString() || 0}`,
      icon: TrendingUp,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Welcome back! Here's what's happening with your platform.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleProcessRewards}
            disabled={processingRewards}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Gift className="h-4 w-4" />
            <span>{processingRewards ? 'Processing...' : 'Process Rewards'}</span>
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Activity className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <div className="text-sm text-slate-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-r ${card.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className={`flex items-center space-x-1 text-xs font-medium ${
                  card.changeType === 'positive' ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  <TrendingUp className="h-3 w-3" />
                  <span>{card.change}</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-slate-600 mb-1">
                  {card.title}
                  {card.subtitle && <span className="block text-xs">{card.subtitle}</span>}
                </h3>
                <p className="text-2xl font-bold text-slate-900 mb-1">
                  {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                </p>
                <p className="text-xs text-slate-500">vs last month</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Action Items */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {actionCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div 
              key={index} 
              className={`bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all ${
                card.href ? 'cursor-pointer hover:scale-105' : ''
              } ${card.urgent ? 'ring-2 ring-orange-200' : ''}`}
              onClick={() => card.href && (window.location.href = card.href)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-r ${card.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                {card.urgent && (
                  <div className="flex items-center space-x-1 text-orange-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Needs Attention</span>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-slate-600 mb-1">{card.title}</h3>
                <p className={`text-2xl font-bold mb-2 ${card.textColor}`}>
                  {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                </p>
                {card.href && (
                  <p className="text-xs text-slate-500 flex items-center space-x-1">
                    <Eye className="h-3 w-3" />
                    <span>Click to manage</span>
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
          <div className="text-sm text-slate-500">Frequently used features</div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/admin/users"
            className="group flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all"
          >
            <div className="p-2 bg-blue-500 rounded-lg mr-4 group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-blue-900">Manage Users</p>
              <p className="text-sm text-blue-600">View and edit user accounts</p>
            </div>
          </a>

          <a
            href="/admin/deposits"
            className="group flex items-center p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg hover:from-emerald-100 hover:to-emerald-200 transition-all"
          >
            <div className="p-2 bg-emerald-500 rounded-lg mr-4 group-hover:scale-110 transition-transform">
              <ArrowDownLeft className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-emerald-900">Review Deposits</p>
              <p className="text-sm text-emerald-600">Approve or reject requests</p>
            </div>
          </a>

          <a
            href="/admin/withdrawals"
            className="group flex items-center p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg hover:from-red-100 hover:to-red-200 transition-all"
          >
            <div className="p-2 bg-red-500 rounded-lg mr-4 group-hover:scale-110 transition-transform">
              <ArrowUpRight className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-red-900">Process Withdrawals</p>
              <p className="text-sm text-red-600">Handle withdrawal requests</p>
            </div>
          </a>

          <button
            onClick={() => window.location.reload()}
            className="group flex items-center p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg hover:from-slate-100 hover:to-slate-200 transition-all"
          >
            <div className="p-2 bg-slate-500 rounded-lg mr-4 group-hover:scale-110 transition-transform">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Refresh Data</p>
              <p className="text-sm text-slate-600">Update all statistics</p>
            </div>
          </button>
        </div>
      </div>

      {/* Platform Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Statistics */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">User Analytics</h3>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-slate-700">Total Registered</span>
              </div>
              <span className="text-sm font-bold text-slate-900">{stats?.totalUsers || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-sm font-medium text-slate-700">Currently Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-bold text-emerald-600">{stats?.activeUsers || 0}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-slate-700">New This Month</span>
              </div>
              <span className="text-sm font-bold text-purple-600">{stats?.newUsersThisMonth || 0}</span>
            </div>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Financial Overview</h3>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-sm font-medium text-slate-700">Total Deposits</span>
              </div>
              <span className="text-sm font-bold text-emerald-600">₹{stats?.totalDeposits?.toLocaleString() || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-slate-700">Total Withdrawals</span>
              </div>
              <span className="text-sm font-bold text-red-600">₹{stats?.totalWithdrawals?.toLocaleString() || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-medium text-slate-700">Pending Actions</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-bold text-orange-600">
                  {(stats?.pendingDeposits || 0) + (stats?.pendingWithdrawals || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
