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
  userId?: {
    _id: string
    name?: string
    email?: string
  } | null
  productId?: {
    _id: string
    name?: string
    price?: number
    deadlineDays?: number
  } | null
  price: number
  purchaseDate: string
  expiryDate: string
  status: string
  rewardsGenerated?: number
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
      if (!token) {
        toast.error('Admin token missing')
        return
      }

      const res = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      setOrders(data.orders || [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleForceExpire = async (orderId: string) => {
    if (!confirm('Force expire this order?')) return

    try {
      const token = Cookies.get('adminToken')
      const res = await fetch(`/api/admin/orders/${orderId}/expire`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      toast.success('Order expired')
      fetchOrders()
    } catch (err: any) {
      toast.error(err.message || 'Failed to expire order')
    }
  }

  /* ✅ SAFE FILTERING */
  const filteredOrders = orders.filter(order => {
    const userName = order.userId?.name ?? ''
    const userEmail = order.userId?.email ?? ''
    const productName = order.productId?.name ?? ''

    const matchesSearch =
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      productName.toLowerCase().includes(searchTerm.toLowerCase())

    const isExpired = new Date(order.expiryDate) < new Date()
    const actualStatus = isExpired ? 'expired' : order.status

    const matchesStatus =
      statusFilter === 'all' || actualStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string, expiryDate: string) => {
    const isExpired = new Date(expiryDate) < new Date()
    const actualStatus = isExpired ? 'expired' : status

    if (actualStatus === 'active') {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" /> Active
        </span>
      )
    }

    if (actualStatus === 'expired') {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" /> Expired
        </span>
      )
    }

    return (
      <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
        <Clock className="w-3 h-3 mr-1" /> {status}
      </span>
    )
  }

  const getDaysRemaining = (expiryDate: string) => {
    const diff =
      new Date(expiryDate).getTime() - new Date().getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const activeOrders = orders.filter(
    o => new Date(o.expiryDate) >= new Date()
  )

  const totalRevenue = orders.reduce(
    (sum, o) => sum + (o.price || 0),
    0
  )

  const totalRewards = orders.reduce(
    (sum, o) => sum + (o.rewardsGenerated || 0),
    0
  )

  if (loading) return <p className="p-6">Loading...</p>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Orders Management</h1>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Stat title="Total Orders" value={orders.length} icon={<Package />} />
        <Stat title="Active Orders" value={activeOrders.length} icon={<CheckCircle />} />
        <Stat title="Revenue" value={`₹${totalRevenue.toLocaleString()}`} icon={<DollarSign />} />
        <Stat title="Rewards" value={`₹${totalRewards.toLocaleString()}`} icon={<DollarSign />} />
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <input
          className="border p-2 rounded w-full"
          placeholder="Search user / product"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select
          className="border p-2 rounded"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">User / Product</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Dates</th>
              <th className="p-3">Status</th>
              <th className="p-3">Rewards</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => {
              const days = getDaysRemaining(order.expiryDate)
              const isExpired = days === 0
              const dailyReward = (order.productId?.price || 0) * 0.1

              return (
                <tr key={order._id} className="border-t">
                  <td className="p-3">
                    <div className="font-semibold">
                      {order.userId?.name || 'Unknown User'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.userId?.email || 'N/A'}
                    </div>
                    <div className="text-sm">
                      {order.productId?.name || 'Deleted Product'}
                    </div>
                  </td>

                  <td className="p-3">
                    ₹{order.price.toLocaleString()}
                    <div className="text-xs text-gray-500">
                      Daily: ₹{dailyReward.toFixed(2)}
                    </div>
                  </td>

                  <td className="p-3">
                    <div>{new Date(order.purchaseDate).toLocaleDateString('en-IN')}</div>
                    <div className={isExpired ? 'text-red-600' : 'text-blue-600'}>
                      {isExpired ? 'Expired' : `${days} days left`}
                    </div>
                  </td>

                  <td className="p-3">
                    {getStatusBadge(order.status, order.expiryDate)}
                  </td>

                  <td className="p-3 text-green-600">
                    ₹{(order.rewardsGenerated || 0).toFixed(2)}
                  </td>

                  <td className="p-3">
                    {!isExpired && order.status === 'active' && (
                      <button
                        onClick={() => handleForceExpire(order._id)}
                        className="text-red-600 flex items-center gap-1"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Force Expire
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No orders found
          </div>
        )}
      </div>
    </div>
  )
}

/* Small Stat Card */
function Stat({ title, value, icon }: any) {
  return (
    <div className="bg-white border rounded p-4 flex items-center gap-3">
      <div className="p-2 bg-gray-100 rounded">{icon}</div>
      <div>
        <div className="text-xs text-gray-500">{title}</div>
        <div className="font-bold">{value}</div>
      </div>
    </div>
  )
}
