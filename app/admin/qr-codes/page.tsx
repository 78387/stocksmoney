'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, QrCode, Globe, Filter, Upload, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import Cookies from 'js-cookie'

interface QRCodeData {
  _id: string
  name: string
  upiId: string
  qrImage: string
  country: {
    code: string
    name: string
    currency: string
  }
  paymentMethod: string
  bankDetails?: {
    accountNumber?: string
    sortCode?: string
    ifscCode?: string
    bankName?: string
    accountHolderName?: string
  }
  isActive: boolean
  totalDeposits: number
  totalTransactions: number
  lastUsed?: string
  createdAt: string
}

export default function AdminQRCodesPage() {
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingQR, setEditingQR] = useState<QRCodeData | null>(null)
  const [countryFilter, setCountryFilter] = useState<string>('ALL')
  const [formData, setFormData] = useState({
    name: '',
    upiId: '',
    qrImage: '',
    countryCode: 'IN',
    paymentMethod: 'UPI',
    bankDetails: {
      accountNumber: '',
      sortCode: '',
      ifscCode: '',
      bankName: '',
      accountHolderName: ''
    },
    description: ''
  })

  useEffect(() => {
    fetchQRCodes()
  }, [countryFilter])

  const fetchQRCodes = async () => {
    try {
      const token = Cookies.get('adminToken')
      const url = countryFilter === 'ALL' 
        ? '/api/admin/qr-codes' 
        : `/api/admin/qr-codes?country=${countryFilter}`
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setQrCodes(data.qrCodes)
      } else {
        toast.error('Failed to fetch QR codes')
      }
    } catch (error) {
      console.error('Error fetching QR codes:', error)
      toast.error('Failed to load QR codes')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.qrImage || !formData.countryCode) {
      toast.error('Name, QR image, and country are required')
      return
    }

    try {
      const token = Cookies.get('adminToken')
      const method = editingQR ? 'PUT' : 'POST'
      const body = editingQR 
        ? { ...formData, id: editingQR._id }
        : formData

      const response = await fetch('/api/admin/qr-codes', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        setShowModal(false)
        setEditingQR(null)
        resetForm()
        fetchQRCodes()
      } else {
        toast.error(data.message || 'Operation failed')
      }
    } catch (error) {
      console.error('Error saving QR code:', error)
      toast.error('Something went wrong')
    }
  }

  const handleEdit = (qrCode: QRCodeData) => {
    setEditingQR(qrCode)
    setFormData({
      name: qrCode.name,
      upiId: qrCode.upiId,
      qrImage: qrCode.qrImage,
      countryCode: qrCode.country.code,
      paymentMethod: qrCode.paymentMethod,
      bankDetails: qrCode.bankDetails || {
        accountNumber: '',
        sortCode: '',
        ifscCode: '',
        bankName: '',
        accountHolderName: ''
      },
      description: ''
    })
    setShowModal(true)
  }

  const handleDelete = async (qrCodeId: string) => {
    if (!confirm('Are you sure you want to delete this QR code?')) return

    try {
      const token = Cookies.get('adminToken')
      const response = await fetch('/api/admin/qr-codes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: qrCodeId })
      })

      if (response.ok) {
        toast.success('QR code deleted successfully')
        fetchQRCodes()
      } else {
        toast.error('Failed to delete QR code')
      }
    } catch (error) {
      console.error('Error deleting QR code:', error)
      toast.error('Something went wrong')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      upiId: '',
      qrImage: '',
      countryCode: 'IN',
      paymentMethod: 'UPI',
      bankDetails: {
        accountNumber: '',
        sortCode: '',
        ifscCode: '',
        bankName: '',
        accountHolderName: ''
      },
      description: ''
    })
  }

  const getCountryBadge = (country: { code: string; name: string }) => {
    if (country.code === 'IN') {
      return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">🇮🇳 India</span>
    }
    if (country.code === 'GB') {
      return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">🇬🇧 UK</span>
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">{country.name}</span>
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFormData({ ...formData, qrImage: e.target?.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QR Codes Management</h1>
          <p className="text-gray-600">Manage country-specific payment QR codes</p>
        </div>
        <button
          onClick={() => {
            setEditingQR(null)
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add QR Code</span>
        </button>
      </div>

      {/* Country Filter */}
      <div className="mb-6 flex items-center space-x-4">
        <Filter className="h-5 w-5 text-gray-500" />
        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Countries</option>
          <option value="IN">🇮🇳 India</option>
          <option value="GB">🇬🇧 United Kingdom</option>
        </select>
        <span className="text-sm text-gray-600">
          Showing {qrCodes.length} QR codes
        </span>
      </div>

      {/* QR Codes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {qrCodes.map((qrCode) => (
          <div key={qrCode._id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{qrCode.name}</h3>
                <p className="text-sm text-gray-600">{qrCode.paymentMethod}</p>
              </div>
              {getCountryBadge(qrCode.country)}
            </div>

            <div className="mb-4">
              <img
                src={qrCode.qrImage}
                alt={qrCode.name}
                className="w-32 h-32 mx-auto border border-gray-300 rounded-lg"
              />
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">UPI ID:</span>
                <span className="font-medium">{qrCode.upiId || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Deposits:</span>
                <span className="font-medium">₹{qrCode.totalDeposits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transactions:</span>
                <span className="font-medium">{qrCode.totalTransactions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  qrCode.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {qrCode.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => handleEdit(qrCode)}
                className="text-blue-600 hover:text-blue-900 p-2"
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(qrCode._id)}
                className="text-red-600 hover:text-red-900 p-2"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {qrCodes.length === 0 && (
        <div className="text-center py-12">
          <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No QR codes found</h3>
          <p className="text-gray-600">
            {countryFilter === 'ALL' 
              ? 'Create your first QR code to get started'
              : `No QR codes found for ${countryFilter === 'IN' ? 'India' : 'United Kingdom'}`
            }
          </p>
        </div>
      )}

      {/* QR Code Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingQR ? 'Edit QR Code' : 'Add New QR Code'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    QR Code Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Main UPI QR"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Country *
                  </label>
                  <select
                    value={formData.countryCode}
                    onChange={(e) => {
                      const newCountry = e.target.value
                      setFormData({ 
                        ...formData, 
                        countryCode: newCountry,
                        paymentMethod: newCountry === 'IN' ? 'UPI' : 'Bank Transfer'
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="IN">🇮🇳 India</option>
                    <option value="GB">🇬🇧 United Kingdom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {formData.countryCode === 'IN' ? (
                    <>
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </>
                  ) : (
                    <>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="PayPal">PayPal</option>
                      <option value="Stripe">Stripe</option>
                    </>
                  )}
                </select>
              </div>

              {formData.countryCode === 'IN' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    value={formData.upiId}
                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="example@paytm"
                  />
                </div>
              )}

              {/* Bank Details for UK */}
              {formData.countryCode === 'GB' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Bank Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={formData.bankDetails.accountNumber}
                        onChange={(e) => setFormData({
                          ...formData,
                          bankDetails: { ...formData.bankDetails, accountNumber: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sort Code
                      </label>
                      <input
                        type="text"
                        value={formData.bankDetails.sortCode}
                        onChange={(e) => setFormData({
                          ...formData,
                          bankDetails: { ...formData.bankDetails, sortCode: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="12-34-56"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={formData.bankDetails.bankName}
                        onChange={(e) => setFormData({
                          ...formData,
                          bankDetails: { ...formData.bankDetails, bankName: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Holder Name
                      </label>
                      <input
                        type="text"
                        value={formData.bankDetails.accountHolderName}
                        onChange={(e) => setFormData({
                          ...formData,
                          bankDetails: { ...formData.bankDetails, accountHolderName: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  QR Code Image *
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.qrImage && (
                    <div className="flex justify-center">
                      <img
                        src={formData.qrImage}
                        alt="QR Preview"
                        className="w-32 h-32 border border-gray-300 rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingQR(null)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingQR ? 'Update QR Code' : 'Create QR Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
