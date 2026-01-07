'use client'

import { useState, useEffect } from 'react'
import { Package, Calendar, CreditCard, Clock, Gift, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'

interface Order {
  _id: string
  productId: {
    _id: string
    name: string
    description: string
    price: number
    image: string
    deadlineDays: number
    dailyCommission: number
  }
  quantity: number
  price: number
  purchaseDate: string
  expiryDate: string
  status: string
  paymentMethod: string
  rewardsGenerated: number
  lastRewardDate?: string
  dailyEarnings: number
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all')

  useEffect(() => {
    fetchUser()
    fetchOrders()
  }, [])

  const fetchUser = async () => {
    try {
      const token = Cookies.get('token')
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const fetchOrders = async () => {
    try {
      const token = Cookies.get('token')
      const response = await fetch('/api/orders', {
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
      toast.error('Error loading orders')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string, expiryDate: string) => {
    const isExpired = new Date(expiryDate) < new Date()
    const actualStatus = isExpired ? 'expired' : status

    const statusConfig = {
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Active' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Cancelled' },
      expired: { color: 'bg-gray-100 text-gray-800', icon: XCircle, text: 'Expired' }
    }

    const config = statusConfig[actualStatus as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    )
  }

  const filteredOrders = orders.filter(order => {
    const isExpired = new Date(order.expiryDate) < new Date()
    
    if (filter === 'active') return !isExpired
    if (filter === 'expired') return isExpired
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Track your digital product purchases and earnings
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: 'All Orders', count: orders.length },
                { key: 'active', label: 'Active', count: orders.filter(o => new Date(o.expiryDate) >= new Date()).length },
                { key: 'expired', label: 'Expired', count: orders.filter(o => new Date(o.expiryDate) < new Date()).length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' ? "You haven't made any purchases yet." : `No ${filter} orders found.`}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrders.map((order) => {
              const isExpired = new Date(order.expiryDate) < new Date()
              const expiryDate = new Date(order.expiryDate)
              const today = new Date()
              const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24))

              return (
                <div key={order._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-w-16 aspect-h-9">
                    <img
                      src={order.productId.image || '/placeholder-product.jpg'}
                      alt={order.productId.name}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {order.productId.name}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {order.productId.description}
                        </p>
                      </div>
                      <div className="ml-4">
                        {getStatusBadge(order.status, order.expiryDate)}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Purchase Date:</span>
                        <span className="font-medium">
                          {new Date(order.purchaseDate).toLocaleDateString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Expiry Date:</span>
                        <span className="font-medium">
                          {new Date(order.expiryDate).toLocaleDateString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Amount Paid:</span>
                        <span className="font-bold text-green-600">{user?.country?.symbol || '₹'}{order.price.toLocaleString()}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Daily Commission:</span>
                        <span className="font-bold text-blue-600">{user?.country?.symbol || '₹'}{order.productId.dailyCommission?.toFixed(2) || 0}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Commission Rate:</span>
                        <span className="font-medium text-purple-600">{order.productId.commissionRate || 0}%</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total Earned:</span>
                        <span className="font-bold text-green-600">{user?.country?.symbol || '₹'}{order.rewardsGenerated || 0}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Days Remaining:</span>
                        <span className={`font-medium ${isExpired ? 'text-red-600' : 'text-blue-600'}`}>
                          {isExpired ? 'Expired' : `${daysRemaining} days`}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-600">
                          <CreditCard className="h-4 w-4 mr-1" />
                          Paid via {order.paymentMethod}
                        </div>
                        <div className="flex items-center text-sm text-green-600">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Earning Daily
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
