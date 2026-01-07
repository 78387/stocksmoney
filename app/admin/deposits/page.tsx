'use client'

import { useState, useEffect } from 'react'
import { 
  ArrowDownLeft, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  X,
  Filter,
  AlertTriangle,
  DollarSign,
  Calendar,
  User,
  FileImage,
  ExternalLink
} from 'lucide-react'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'

interface Deposit {
  _id: string
  userId: {
    _id: string
    name: string
    email: string
  }
  amount: number
  utr: string
  proofImage: string
  status: string
  reason?: string
  createdAt: string
  processedAt?: string
  adminId?: {
    _id: string
    name: string
    email: string
    role: string
  }
}

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState('')
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
  const [reason, setReason] = useState('')

  useEffect(() => {
    fetchDeposits()
  }, [])

  const fetchDeposits = async () => {
    try {
      const token = Cookies.get('adminToken')
      console.log('Fetching deposits with token:', token ? 'Present' : 'Missing')
      
      if (!token) {
        toast.error('Admin token not found. Please login again.')
        return
      }

      const response = await fetch('/api/admin/transactions?type=deposit', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('Deposits API response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Deposits data received:', data)
        setDeposits(data.transactions || [])
      } else {
        const errorData = await response.json()
        console.error('Deposits API error:', errorData)
        toast.error(errorData.message || 'Failed to load deposits')
      }
    } catch (error) {
      console.error('Error fetching deposits:', error)
      toast.error('Network error while loading deposits')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = (deposit: Deposit, action: 'approve' | 'reject') => {
    setSelectedDeposit(deposit)
    setActionType(action)
    setReason('')
    setShowModal(true)
  }

  const viewImage = (imageUrl: string) => {
    console.log('Viewing image:', imageUrl);
    console.log('Image URL type:', typeof imageUrl);
    console.log('Image URL length:', imageUrl?.length);
    setSelectedImage(imageUrl || '')
    setShowImageModal(true)
  }

  const handleSubmitAction = async () => {
    if (!selectedDeposit || !actionType) return

    if (actionType === 'reject' && !reason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    try {
      const token = Cookies.get('adminToken')
      console.log('Submitting action with token:', token ? 'Present' : 'Missing')
      console.log('Action details:', { 
        transactionId: selectedDeposit._id, 
        actionType, 
        reason: actionType === 'reject' ? reason : undefined 
      })

      const response = await fetch(`/api/admin/transactions/${selectedDeposit._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: actionType === 'approve' ? 'approved' : 'rejected',
          reason: actionType === 'reject' ? reason : undefined
        })
      })

      console.log('Action response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Action success:', data)
        toast.success(`Deposit ${actionType}d successfully`)
        setShowModal(false)
        fetchDeposits()
      } else {
        const errorData = await response.json()
        console.error('Action error:', errorData)
        toast.error(errorData.message || `Failed to ${actionType} deposit`)
      }
    } catch (error) {
      console.error(`Error ${actionType}ing deposit:`, error)
      toast.error('Network error while processing action')
    }
  }

  const filteredDeposits = deposits.filter(deposit => {
    const matchesSearch = 
      deposit.userId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.userId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.utr.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || deposit.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const badges = {
      approved: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: CheckCircle,
        label: 'Approved'
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

  const pendingCount = deposits.filter(d => d.status === 'pending').length
  const approvedCount = deposits.filter(d => d.status === 'approved').length
  const rejectedCount = deposits.filter(d => d.status === 'rejected').length
  const totalAmount = deposits.filter(d => d.status === 'approved').reduce((sum, d) => sum + d.amount, 0)

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
          <h1 className="text-2xl font-bold text-slate-900">Deposits Management</h1>
          <p className="text-slate-600 mt-1">Review and approve deposit requests from users</p>
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
              <p className="text-sm font-medium text-slate-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
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
              <p className="text-sm font-medium text-slate-600">Total Approved</p>
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
              placeholder="Search by user name, email, or UTR..."
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
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Deposits Table */}
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
                  UTR
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Processed By
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredDeposits.map((deposit) => (
                <tr key={deposit._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {deposit.userId.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-slate-900">
                          {deposit.userId.name}
                        </div>
                        <div className="text-sm text-slate-500">
                          {deposit.userId.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg font-bold text-slate-900">
                      ₹{deposit.amount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-slate-900 bg-slate-100 px-2 py-1 rounded">
                      {deposit.utr}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {getStatusBadge(deposit.status)}
                      {deposit.reason && (
                        <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                          {deposit.reason}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1 text-sm text-slate-500">
                      <Calendar className="h-3 w-3" />
                      <div>
                        <div>{new Date(deposit.createdAt).toLocaleDateString('en-IN')}</div>
                        <div className="text-xs">
                          {new Date(deposit.createdAt).toLocaleTimeString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {deposit.adminId ? (
                      <div className="text-sm">
                        <div className="font-medium text-slate-900">{deposit.adminId.name}</div>
                        <div className="text-xs text-slate-500 capitalize">{deposit.adminId.role.replace('_', ' ')}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {deposit.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAction(deposit, 'approve')}
                            className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve Deposit"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleAction(deposit, 'reject')}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject Deposit"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={() => viewImage(deposit.proofImage)}
                        className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Proof"
                      >
                        <FileImage className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDeposits.length === 0 && (
          <div className="text-center py-12">
            <ArrowDownLeft className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No deposits found</h3>
            <p className="text-slate-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search criteria or filters.' 
                : 'No deposit requests have been made yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showModal && selectedDeposit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                {actionType === 'approve' ? 'Approve' : 'Reject'} Deposit
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
                      {selectedDeposit.userId.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{selectedDeposit.userId.name}</p>
                    <p className="text-sm text-slate-500">{selectedDeposit.userId.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Amount:</span>
                    <p className="font-bold text-lg">₹{selectedDeposit.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">UTR:</span>
                    <p className="font-mono bg-white px-2 py-1 rounded">{selectedDeposit.utr}</p>
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
                  {actionType === 'approve' ? 'Approve Deposit' : 'Reject Deposit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full text-gray-600 hover:text-gray-900 z-10"
            >
              <X className="h-6 w-6" />
            </button>
            {selectedImage ? (
              <img
                src={selectedImage}
                alt="Payment Proof"
                className="max-w-full max-h-full object-contain rounded-lg"
                onError={(e) => {
                  console.error('Image failed to load:', selectedImage);
                  e.currentTarget.src = '/api/placeholder/400/300';
                }}
              />
            ) : (
              <div className="bg-white rounded-lg p-8 text-center">
                <FileImage className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No image available</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
