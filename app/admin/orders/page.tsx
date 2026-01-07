'use client'

import { useState, useEffect } from 'react'
import { 
  Package, 
  Search, 
  Filter,
  Calendar,
  User,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'

interface Order {
  _id: string
  userId: {
    _id: string
    name: string
    email: string
  }
  productId: {
    _id: string
    name: string
    price: number
    deadlineDays: number
  }
  price: number
  purchaseDate: string
  expiryDate: string
  status: string
  rewardsGenerated: number
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const token = Cookies.get('adminToken')
      const response = await fetch('/api/admin/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders)
      } else {
        toast.error('Failed to load orders')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleForceExpire = async (orderId: string) => {
    if (!confirm('Are you sure you want to force expire this order?')) return

    try {
      const token = Cookies.get('adminToken')
      const response = await fetch(`/api/admin/orders/${orderId}/expire`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success('Order expired successfully')
        fetchOrders()
      } else {
        const data = await response.json()
        toast.error(data.message || 'Failed to expire order')
      }
    } catch (error) {
      console.error('Error expiring order:', error)
      toast.error('Something went wrong')
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.userId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.productId.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const isExpired = new Date(order.expiryDate) < new Date()
    const actualStatus = isExpired ? 'expired' : order.status
    const matchesStatus = statusFilter === 'all' || actualStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string, expiryDate: string) => {
    const isExpired = new Date(expiryDate) < new Date()
    const actualStatus = isExpired ? 'expired' : status

    switch (actualStatus) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </span>
        )
      case 'expired':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Expired
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock className="w-3 h-3 mr-1" />
            {status}
          </span>
        )
    }
  }

  const getDaysRemaining = (expiryDate: string) => {
    const now = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const activeOrders = orders.filter(order => new Date(order.expiryDate) >= new Date())
  const expiredOrders = orders.filter(order => new Date(order.expiryDate) < new Date())
  const totalRevenue = orders.reduce((sum, order) => sum + order.price, 0)
  const totalRewards = orders.reduce((sum, order) => sum + order.rewardsGenerated, 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="h-12 bg-slate-200 rounded"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Orders Management</h1>
        <p className="text-slate-600 mt-1">Monitor all user orders and their reward status</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Total Orders</p>
              <p className="text-2xl font-bold text-blue-600">{orders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Active Orders</p>
              <p className="text-2xl font-bold text-green-600">{activeOrders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Total Revenue</p>
              <p className="text-2xl font-bold text-purple-600">₹{totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Total Rewards</p>
              <p className="text-2xl font-bold text-yellow-600">₹{totalRewards.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by user name, email, or product..."
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <select
              className="appearance-none bg-white border border-slate-200 rounded-lg px-4 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
            <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  User & Product
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Rewards
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredOrders.map((order) => {
                const daysRemaining = getDaysRemaining(order.expiryDate)
                const isExpired = daysRemaining === 0
                const dailyReward = (order.productId?.price || 0) * 0.1

                return (
                  <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="font-medium text-slate-900">{order.userId.name}</span>
                        </div>
                        <div className="text-sm text-slate-500">{order.userId.email}</div>
                        <div className="font-medium text-slate-700">{order.productId.name}</div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-lg font-bold text-slate-900">
                        ₹{order.price.toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-500">
                        Daily: ₹{dailyReward.toFixed(2)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>Purchased: {new Date(order.purchaseDate).toLocaleDateString('en-IN')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>Expires: {new Date(order.expiryDate).toLocaleDateString('en-IN')}</span>
                        </div>
                        <div className={`text-xs ${isExpired ? 'text-red-600' : 'text-blue-600'}`}>
                          {isExpired ? 'Expired' : `${daysRemaining} days left`}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status, order.expiryDate)}
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-green-600">
                          ₹{(order.rewardsGenerated || 0).toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-500">
                          Generated so far
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      {!isExpired && order.status === 'active' && (
                        <button
                          onClick={() => handleForceExpire(order._id)}
                          className="flex items-center space-x-1 px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          <span>Force Expire</span>
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No orders found</h3>
            <p className="text-slate-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search criteria or filters.' 
                : 'No orders have been placed yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
