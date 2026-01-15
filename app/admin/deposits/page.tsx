'use client'

import { useState, useEffect } from 'react'
import {
  ArrowDownLeft,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  X,
  Filter,
  AlertTriangle,
  DollarSign,
  Calendar,
  FileImage
} from 'lucide-react'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'

interface Deposit {
  _id: string
  userId?: {
    _id: string
    name?: string
    email?: string
  } | null
  amount: number
  utr: string
  proofImage?: string
  status: string
  reason?: string
  createdAt: string
  adminId?: {
    _id: string
    name?: string
    email?: string
    role?: string
  } | null
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
      if (!token) {
        toast.error('Admin token missing')
        return
      }

      const res = await fetch('/api/admin/transactions?type=deposit', {
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      setDeposits(data.transactions || [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to load deposits')
    } finally {
      setLoading(false)
    }
  }

  const filteredDeposits = deposits.filter(d => {
    const name = d.userId?.name ?? ''
    const email = d.userId?.email ?? ''
    const utr = d.utr ?? ''

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      utr.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' || d.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const map: any = {
      approved: { cls: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { cls: 'bg-red-100 text-red-800', icon: XCircle },
      pending: { cls: 'bg-yellow-100 text-yellow-800', icon: Clock }
    }
    const badge = map[status] || map.pending
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${badge.cls}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    )
  }

  const handleAction = (deposit: Deposit, type: 'approve' | 'reject') => {
    setSelectedDeposit(deposit)
    setActionType(type)
    setReason('')
    setShowModal(true)
  }

  const handleSubmitAction = async () => {
    if (!selectedDeposit || !actionType) return

    if (actionType === 'reject' && !reason.trim()) {
      toast.error('Rejection reason required')
      return
    }

    try {
      const token = Cookies.get('adminToken')
      const res = await fetch(`/api/admin/transactions/${selectedDeposit._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: actionType === 'approve' ? 'approved' : 'rejected',
          reason: actionType === 'reject' ? reason : undefined
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      toast.success(`Deposit ${actionType}d`)
      setShowModal(false)
      fetchDeposits()
    } catch (err: any) {
      toast.error(err.message || 'Action failed')
    }
  }

  if (loading) return <p className="p-6">Loading...</p>

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex gap-4">
        <input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search name / email / UTR"
          className="border p-2 rounded w-full"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">User</th>
              <th className="p-3">Amount</th>
              <th className="p-3">UTR</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeposits.map(d => (
              <tr key={d._id} className="border-t">
                <td className="p-3">
                  <div className="font-semibold">{d.userId?.name || 'Unknown User'}</div>
                  <div className="text-xs text-gray-500">{d.userId?.email || 'N/A'}</div>
                </td>
                <td className="p-3">₹{d.amount.toLocaleString()}</td>
                <td className="p-3 font-mono">{d.utr}</td>
                <td className="p-3">{getStatusBadge(d.status)}</td>
                <td className="p-3">
                  {new Date(d.createdAt).toLocaleDateString('en-IN')}
                </td>
                <td className="p-3 flex gap-2">
                  {d.status === 'pending' && (
                    <>
                      <button onClick={() => handleAction(d, 'approve')} className="text-green-600">✔</button>
                      <button onClick={() => handleAction(d, 'reject')} className="text-red-600">✖</button>
                    </>
                  )}
                  <button onClick={() => {
                    setSelectedImage(d.proofImage || '')
                    setShowImageModal(true)
                  }}>
                    <FileImage className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredDeposits.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <ArrowDownLeft className="mx-auto mb-2" />
            No deposits found
          </div>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="relative bg-white p-4 rounded">
            <button onClick={() => setShowImageModal(false)} className="absolute top-2 right-2">
              <X />
            </button>
            {selectedImage ? (
              <img src={selectedImage} className="max-h-[80vh]" />
            ) : (
              <p>No image</p>
            )}
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showModal && selectedDeposit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-full max-w-md">
            <h3 className="font-bold mb-4">
              {actionType === 'approve' ? 'Approve' : 'Reject'} Deposit
            </h3>

            {actionType === 'reject' && (
              <textarea
                className="border w-full p-2 mb-4"
                placeholder="Reason"
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="border px-4 py-2 rounded">
                Cancel
              </button>
              <button
                onClick={handleSubmitAction}
                className={`px-4 py-2 text-white rounded ${actionType === 'approve' ? 'bg-green-600' : 'bg-red-600'
                  }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
