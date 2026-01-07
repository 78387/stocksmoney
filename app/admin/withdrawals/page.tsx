'use client'

import { useState, useEffect } from 'react'
import { 
  ArrowUpRight, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock,
  CreditCard,
  X,
  Filter,
  AlertTriangle,
  DollarSign,
  Calendar,
  Building2,
  Smartphone
} from 'lucide-react'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'

interface Withdrawal {
  _id: string
  userId: {
    _id: string
    name: string
    email: string
  }
  amount: number
  status: string
  reason?: string
  withdrawalDetails: {
    accountNumber?: string
    ifscCode?: string
    bankName?: string
    accountHolderName?: string
    upiId?: string
  }
  createdAt: string
  processedAt?: string
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
  const [reason, setReason] = useState('')

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  const fetchWithdrawals = async () => {
    try {
      const token = Cookies.get('adminToken')
      const response = await fetch('/api/admin/transactions?type=withdraw', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setWithdrawals(data.transactions)
      } else {
        toast.error('Failed to load withdrawals')
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
      toast.error('Failed to load withdrawals')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = (withdrawal: Withdrawal, action: 'approve' | 'reject') => {
    setSelectedWithdrawal(withdrawal)
    setActionType(action)
    setReason('')
    setShowModal(true)
  }

  const handleSubmitAction = async () => {
    if (!selectedWithdrawal || !actionType) return

    if (actionType === 'reject' && !reason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    try {
      const token = Cookies.get('adminToken')
      const response = await fetch(`/api/admin/transactions/${selectedWithdrawal._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: actionType === 'approve' ? 'completed' : 'rejected',
          reason: actionType === 'reject' ? reason : undefined
        })
      })

      if (response.ok) {
        toast.success(`Withdrawal ${actionType}d successfully`)
        setShowModal(false)
        fetchWithdrawals()
      } else {
        const data = await response.json()
        toast.error(data.message || `Failed to ${actionType} withdrawal`)
      }
    } catch (error) {
      console.error(`Error ${actionType}ing withdrawal:`, error)
      toast.error('Something went wrong')
    }
  }

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesSearch = 
      withdrawal.userId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.userId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (withdrawal.withdrawalDetails.accountNumber && withdrawal.withdrawalDetails.accountNumber.includes(searchTerm)) ||
      (withdrawal.withdrawalDetails.upiId && withdrawal.withdrawalDetails.upiId.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || withdrawal.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const badges = {
      completed: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: CheckCircle,
        label: 'Completed'
      },
      rejected: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: XCircle,
        label: 'Rejected'
      },
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: Clock,
        label: 'Pending'
      }
    }

    const badge = badges[status] || badges.pending
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.label}
      </span>
    )
  }

  const getPaymentMethodDisplay = (withdrawalDetails: Withdrawal['withdrawalDetails']) => {
    if (withdrawalDetails.upiId) {
      return (
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-blue-100 rounded">
            <Smartphone className="h-3 w-3 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-900">UPI</p>
            <p className="text-xs text-slate-500">{withdrawalDetails.upiId}</p>
          </div>
        </div>
      )
    } else {
      return (
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-green-100 rounded">
            <Building2 className="h-3 w-3 text-green-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-900">Bank Transfer</p>
            <p className="text-xs text-slate-500">
              {withdrawalDetails.accountNumber && `****${withdrawalDetails.accountNumber.slice(-4)}`}
            </p>
            <p className="text-xs text-slate-400">{withdrawalDetails.bankName}</p>
          </div>
        </div>
      )
    }
  }

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length
  const completedCount = withdrawals.filter(w => w.status === 'completed').length
  const rejectedCount = withdrawals.filter(w => w.status === 'rejected').length
  const totalAmount = withdrawals.filter(w => w.status === 'completed').reduce((sum, w) => sum + w.amount, 0)

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Withdrawals Management</h1>
          <p className="text-slate-600 mt-1">Process withdrawal requests and manage payouts</p>
        </div>
        
        {pendingCount > 0 && (
          <div className="flex items-center space-x-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-lg">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">{pendingCount} pending requests</span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Total Paid</p>
              <p className="text-2xl font-bold text-blue-600">₹{totalAmount.toLocaleString()}</p>
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
              placeholder="Search by user name, email, account, or UPI..."
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
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
            <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredWithdrawals.map((withdrawal) => (
                <tr key={withdrawal._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {withdrawal.userId.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-slate-900">
                          {withdrawal.userId.name}
                        </div>
                        <div className="text-sm text-slate-500">
                          {withdrawal.userId.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg font-bold text-slate-900">
                      ₹{withdrawal.amount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPaymentMethodDisplay(withdrawal.withdrawalDetails)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {getStatusBadge(withdrawal.status)}
                      {withdrawal.reason && (
                        <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                          {withdrawal.reason}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1 text-sm text-slate-500">
                      <Calendar className="h-3 w-3" />
                      <div>
                        <div>{new Date(withdrawal.createdAt).toLocaleDateString('en-IN')}</div>
                        <div className="text-xs">
                          {new Date(withdrawal.createdAt).toLocaleTimeString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {withdrawal.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAction(withdrawal, 'approve')}
                            className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve Withdrawal"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleAction(withdrawal, 'reject')}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject Withdrawal"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredWithdrawals.length === 0 && (
          <div className="text-center py-12">
            <ArrowUpRight className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No withdrawals found</h3>
            <p className="text-slate-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search criteria or filters.' 
                : 'No withdrawal requests have been made yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                {actionType === 'approve' ? 'Approve' : 'Reject'} Withdrawal
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {selectedWithdrawal.userId.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{selectedWithdrawal.userId.name}</p>
                    <p className="text-sm text-slate-500">{selectedWithdrawal.userId.email}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-slate-600 text-sm">Amount:</span>
                    <p className="font-bold text-lg">₹{selectedWithdrawal.amount.toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <span className="text-slate-600 text-sm">Payment Details:</span>
                    {selectedWithdrawal.withdrawalDetails.upiId ? (
                      <div className="bg-white p-3 rounded mt-1">
                        <p className="text-sm font-medium">UPI ID:</p>
                        <p className="font-mono text-sm">{selectedWithdrawal.withdrawalDetails.upiId}</p>
                      </div>
                    ) : (
                      <div className="bg-white p-3 rounded mt-1 space-y-1">
                        <p className="text-sm"><strong>Account:</strong> {selectedWithdrawal.withdrawalDetails.accountNumber}</p>
                        <p className="text-sm"><strong>IFSC:</strong> {selectedWithdrawal.withdrawalDetails.ifscCode}</p>
                        <p className="text-sm"><strong>Bank:</strong> {selectedWithdrawal.withdrawalDetails.bankName}</p>
                        <p className="text-sm"><strong>Holder:</strong> {selectedWithdrawal.withdrawalDetails.accountHolderName}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {actionType === 'reject' && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Reason for Rejection *
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                    placeholder="Please provide a clear reason for rejection..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAction}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                    actionType === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {actionType === 'approve' ? 'Approve Withdrawal' : 'Reject Withdrawal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
