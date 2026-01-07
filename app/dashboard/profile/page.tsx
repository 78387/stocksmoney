'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Calendar, CreditCard, Edit2, Save, X } from 'lucide-react'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'

interface UserProfile {
  id: string
  name: string
  email: string
  balance: number
  bankDetails: {
    accountNumber?: string
    ifscCode?: string
    bankName?: string
    accountHolderName?: string
    upiId?: string
  }
  status: string
  createdAt: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    bankDetails: {
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      accountHolderName: '',
      upiId: ''
    }
  })

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
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
        setFormData({
          name: data.user.name,
          mobile: data.user.mobile || '',
          bankDetails: data.user.bankDetails || {
            accountNumber: '',
            ifscCode: '',
            bankName: '',
            accountHolderName: '',
            upiId: ''
          }
        })
      } else {
        toast.error('Failed to load profile')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const token = Cookies.get('token')
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setEditing(false)
        toast.success('Profile updated successfully!')
      } else {
        const data = await response.json()
        toast.error(data.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Something went wrong')
    }
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name,
        mobile: user.mobile || '',
        bankDetails: user.bankDetails || {
          accountNumber: '',
          ifscCode: '',
          bankName: '',
          accountHolderName: '',
          upiId: ''
        }
      })
    }
    setEditing(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="card">
            <div className="h-32 bg-gray-300 rounded"></div>
          </div>
          <div className="card">
            <div className="h-48 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-4">
        <div className="text-center py-12">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Profile not found</h3>
          <p className="text-gray-600">Unable to load your profile information.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h1>
        <p className="text-gray-600">Manage your account information</p>
      </div>

      {/* Profile Header */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
              </span>
            </div>
          </div>
          
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Edit2 className="h-4 w-4" />
              <span>Edit</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <CreditCard className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Wallet Balance</p>
              <p className="font-semibold text-green-600">{user.country?.symbol || '₹'}{user.balance.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-semibold">{user.email}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Member Since</p>
              <p className="font-semibold">{formatDate(user.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Personal Information</h3>
          {editing && (
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
                className="btn-secondary flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                className="btn-primary flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Save</span>
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            {editing ? (
              <input
                type="text"
                className="input-field"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            ) : (
              <p className="text-gray-900">{user.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <p className="text-gray-900">{user.email}</p>
            <p className="text-xs text-gray-500">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number
              <span className="text-red-500 ml-1">*</span>
              <span className="text-xs text-gray-500 ml-1">(required for withdrawals)</span>
            </label>
            {editing ? (
              <input
                type="tel"
                className="input-field"
                placeholder="Enter 10-digit mobile number"
                value={formData.mobile || ''}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                maxLength="10"
              />
            ) : (
              <div>
                <p className="text-gray-900">{user.mobile || 'Not provided'}</p>
                {!user.mobile && (
                  <p className="text-xs text-red-500">Mobile number is required for withdrawals</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bank Details */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">
          Bank Details
          <span className="text-sm text-gray-600 font-normal ml-2">
            (Used for wallet withdrawals)
          </span>
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              {editing ? (
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter account number"
                  value={formData.bankDetails.accountNumber}
                  onChange={(e) => setFormData({
                    ...formData,
                    bankDetails: { ...formData.bankDetails, accountNumber: e.target.value }
                  })}
                />
              ) : (
                <p className="text-gray-900">
                  {user.bankDetails?.accountNumber || 'Not provided'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IFSC Code
              </label>
              {editing ? (
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter IFSC code"
                  value={formData.bankDetails.ifscCode}
                  onChange={(e) => setFormData({
                    ...formData,
                    bankDetails: { ...formData.bankDetails, ifscCode: e.target.value }
                  })}
                />
              ) : (
                <p className="text-gray-900">
                  {user.bankDetails?.ifscCode || 'Not provided'}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name
              </label>
              {editing ? (
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter bank name"
                  value={formData.bankDetails.bankName}
                  onChange={(e) => setFormData({
                    ...formData,
                    bankDetails: { ...formData.bankDetails, bankName: e.target.value }
                  })}
                />
              ) : (
                <p className="text-gray-900">
                  {user.bankDetails?.bankName || 'Not provided'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Holder Name
              </label>
              {editing ? (
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter account holder name"
                  value={formData.bankDetails.accountHolderName}
                  onChange={(e) => setFormData({
                    ...formData,
                    bankDetails: { ...formData.bankDetails, accountHolderName: e.target.value }
                  })}
                />
              ) : (
                <p className="text-gray-900">
                  {user.bankDetails?.accountHolderName || 'Not provided'}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              UPI ID
              <span className="text-xs text-gray-500 ml-1">(for withdrawals)</span>
            </label>
            {editing ? (
              <input
                type="text"
                className="input-field"
                placeholder="Enter UPI ID (e.g., user@paytm)"
                value={formData.bankDetails.upiId}
                onChange={(e) => setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails, upiId: e.target.value }
                })}
              />
            ) : (
              <p className="text-gray-900">
                {user.bankDetails?.upiId || 'Not provided'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
