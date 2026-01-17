'use client'

import { useState, useEffect } from 'react'
import {
  Wallet,
  Plus,
  Minus,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'

interface Transaction {
  _id: string
  type: 'deposit' | 'withdraw' | 'reward' | 'referral'
  amount: number
  status: string
  reason?: string
  createdAt: string
  utr?: string
  description?: string
  referralData?: {
    referredUserName?: string
    referredUserEmail?: string
  }
}

interface User {
  balance: number
  depositBalance: number
  rewardBalance: number
  name: string
  email: string
  mobile?: string
  bankDetails?: {
    accountNumber: string
    ifscCode: string
    bankName: string
    accountHolderName: string
    upiId: string
  }
}

export default function WalletPage() {
  const [user, setUser] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawDetails, setWithdrawDetails] = useState({
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    accountHolderName: '',
    upiId: ''
  })

  // Load user bank details when user data is available
  useEffect(() => {
    if (user?.bankDetails) {
      setWithdrawDetails({
        accountNumber: user.bankDetails.accountNumber || '',
        ifscCode: user.bankDetails.ifscCode || '',
        bankName: user.bankDetails.bankName || '',
        accountHolderName: user.bankDetails.accountHolderName || '',
        upiId: user.bankDetails.upiId || ''
      })
    }
  }, [user])
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    utr: '',
    proofImage: null as File | null,
    qrCodeId: ''
  })
  const [selectedQR, setSelectedQR] = useState<any>(null)
  const [loadingQR, setLoadingQR] = useState(false)

  useEffect(() => {
    fetchUserData()
    fetchTransactions()
  }, [])

  const fetchUserData = async () => {
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
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async () => {
    try {
      const token = Cookies.get('token')
      const response = await fetch('/api/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const fetchRandomQR = async () => {
    setLoadingQR(true)
    try {
      const token = Cookies.get('token')
      const response = await fetch('/api/user/get-random-qr', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedQR(data.qrCode)
        setPaymentData(prev => ({ ...prev, qrCodeId: data.qrCode.id }))
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to get QR code')
      }
    } catch (error) {
      console.error('Error fetching QR code:', error)
      toast.error('Failed to load QR code')
    } finally {
      setLoadingQR(false)
    }
  }

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(depositAmount)

    const minAmount = user?.country?.code === 'GB' ? 50 : 500;
    const minAmountText = `${user?.country?.symbol || '₹'}${minAmount}`;

    if (amount < minAmount) {
      toast.error(`Minimum deposit amount is ${minAmountText}`)
      return
    }

    setPaymentData({ ...paymentData, amount })
    setShowDepositModal(false)
    
    // Fetch random QR code before showing payment modal
    await fetchRandomQR()
    setShowPaymentModal(true)
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!paymentData.utr || !paymentData.proofImage) {
      toast.error('All fields are required')
      return
    }

    if (!paymentData.qrCodeId) {
      toast.error('QR code not selected. Please try again.')
      return
    }

    try {
      const token = Cookies.get('token')
      const formData = new FormData()
      formData.append('amount', paymentData.amount.toString())
      formData.append('utr', paymentData.utr)
      formData.append('proofImage', paymentData.proofImage)
      formData.append('type', 'deposit')
      formData.append('qrCodeId', paymentData.qrCodeId)

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        toast.success('Deposit request submitted successfully!')
        setShowPaymentModal(false)
        setDepositAmount('')
        setPaymentData({ amount: 0, utr: '', proofImage: null, qrCodeId: '' })
        setSelectedQR(null)
        fetchTransactions()
      } else {
        const data = await response.json()
        toast.error(data.message || 'Failed to submit deposit request')
      }
    } catch (error) {
      console.error('Error submitting deposit:', error)
      toast.error('Something went wrong')
    }
  }

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(withdrawAmount)

    if (amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    const minAmount = user?.country?.code === 'GB' ? 50 : 500;
    const minAmountText = `${user?.country?.symbol || '₹'}${minAmount}`;

    if (amount < minAmount) {
      toast.error(`Minimum withdrawal amount is ${minAmountText}`)
      return
    }

    if (user && amount > user.rewardBalance) {
      toast.error('Insufficient commission earnings. You can only withdraw from commission earnings.')
      return
    }

    // Check if mobile number is provided
    if (!user?.mobile) {
      toast.error('Please add mobile number in your profile before making withdrawals')
      return
    }

    if (!withdrawDetails.accountNumber && !withdrawDetails.upiId) {
      toast.error('Please provide either bank details or UPI ID')
      return
    }

    try {
      const token = Cookies.get('token')

      // First, save bank details to user profile
      const profileResponse = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bankDetails: withdrawDetails
        })
      })

      if (!profileResponse.ok) {
        toast.error('Failed to save bank details')
        return
      }

      // Then, submit withdrawal request
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'withdraw',
          amount,
          withdrawalDetails: withdrawDetails
        })
      })

      if (response.ok) {
        toast.success('Withdrawal request submitted successfully! Bank details saved to your profile.')
        setShowWithdrawModal(false)
        setWithdrawAmount('')
        // Don't reset withdrawDetails anymore - keep them for next time
        fetchUserData()
        fetchTransactions()
      } else {
        const data = await response.json()
        toast.error(data.message || 'Failed to submit withdrawal request')
      }
    } catch (error) {
      console.error('Error submitting withdrawal:', error)
      toast.error('Something went wrong')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return 'text-green-600'
      case 'rejected':
        return 'text-red-600'
      default:
        return 'text-yellow-600'
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="card">
            <div className="h-24 bg-gray-300 rounded"></div>
          </div>
          <div className="card">
            <div className="h-40 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Wallet</h1>
        <p className="text-gray-600">Manage your funds</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Balance */}
        <div className="card bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 mb-1 text-sm">Total Balance</p>
              <h2 className="text-2xl font-bold">{user?.country?.symbol || '₹'}{user?.balance?.toFixed(2) || '0.00'}</h2>
            </div>
            <Wallet className="h-10 w-10 text-blue-200" />
          </div>
        </div>

        {/* Deposit Balance */}
        <div className="card bg-gradient-to-r from-green-500 to-teal-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 mb-1 text-sm">Deposit Balance</p>
              <h2 className="text-2xl font-bold">{user?.country?.symbol || '₹'}{user?.depositBalance?.toFixed(2) || '0.00'}</h2>
              <p className="text-green-200 text-xs">Cannot withdraw</p>
            </div>
            <Plus className="h-10 w-10 text-green-200" />
          </div>
        </div>

        {/* Commission Earnings */}
        <div className="card bg-gradient-to-r from-orange-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 mb-1 text-sm">Commission Earnings</p>
              <h2 className="text-2xl font-bold">{user?.country?.symbol || '₹'}{user?.rewardBalance?.toFixed(2) || '0.00'}</h2>
              <p className="text-orange-200 text-xs">Withdrawable</p>
            </div>
            <Minus className="h-10 w-10 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setShowDepositModal(true)}
          className="btn-primary flex items-center justify-center space-x-2 py-4"
        >
          <Plus className="h-5 w-5" />
          <span>Deposit</span>
        </button>

        <button
          onClick={() => setShowWithdrawModal(true)}
          disabled={!user?.rewardBalance || user.rewardBalance < 1000}
          className={`flex items-center justify-center space-x-2 py-4 ${!user?.rewardBalance || user.rewardBalance < 1000
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'btn-secondary'
            }`}
        >
          <Minus className="h-5 w-5" />
            <div className="text-center">
            <div>Withdraw</div>
            <div className="text-xs opacity-75">(Min. {user?.country?.symbol || '₹'}{user?.country?.code === 'GB' ? '25' : '300'})</div>
            <div className="text-xs opacity-75">From Rewards Only</div>
          </div>
        </button>
      </div>

      {/* Transaction History */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <History className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold">Transaction History</h3>
        </div>

        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div key={transaction._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {transaction.type === 'deposit' ? (
                  <ArrowDownLeft className="h-5 w-5 text-green-500" />
                ) : transaction.type === 'withdraw' ? (
                  <ArrowUpRight className="h-5 w-5 text-red-500" />
                ) : transaction.type === 'reward' ? (
                  <div className="h-5 w-5 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">R</span>
                  </div>
                ) : transaction.type === 'referral' ? (
                  <div className="h-5 w-5 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{user?.country?.symbol || '₹'}</span>
                  </div>
                ) : (
                  <ArrowDownLeft className="h-5 w-5 text-blue-500" />
                )}

                <div>
                  <p className="font-medium capitalize">
                    {transaction.type === 'reward' ? 'Daily Reward' : 
                     transaction.type === 'referral' ? 'Referral Bonus' : 
                     transaction.type}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(transaction.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })} at {new Date(transaction.createdAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  {transaction.utr && (
                    <p className="text-xs text-gray-500">UTR: {transaction.utr}</p>
                  )}
                  {transaction.description && (
                    <p className="text-xs text-gray-600">{transaction.description}</p>
                  )}
                  {transaction.referralData?.referredUserName && (
                    <p className="text-xs text-purple-600">
                      From: {transaction.referralData.referredUserName}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className={`font-semibold ${
                  transaction.type === 'deposit' || transaction.type === 'reward' || transaction.type === 'referral' 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {transaction.type === 'deposit' || transaction.type === 'reward' || transaction.type === 'referral' ? '+' : '-'}{user?.country?.symbol || '₹'}{transaction.amount}
                </p>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(transaction.status)}
                  <span className={`text-sm capitalize ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </div>
                {transaction.reason && (
                  <p className="text-xs text-red-500 mt-1">{transaction.reason}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <History className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No transactions yet</p>
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Deposit Money</h3>

            <form onSubmit={handleDepositSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (Minimum {user?.country?.symbol || '₹'}{user?.country?.code === 'GB' ? '50' : '500'})
                </label>
                <input
                  type="number"
                  min={user?.country?.code === 'GB' ? '50' : '500'}
                  step="1"
                  required
                  className="input-field"
                  placeholder="Enter amount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Quick Select:</p>
                <div className="grid grid-cols-3 gap-2">
                  {(user?.country?.code === 'GB' ? [50, 100, 200] : [500, 1000, 2000]).map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setDepositAmount(amount.toString())}
                      className="btn-secondary py-2 text-sm"
                    >
                      {user?.country?.symbol || '₹'}{amount}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Complete Payment</h3>

            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Amount to Pay:</p>
              <p className="text-2xl font-bold text-blue-600">{user?.country?.symbol || '₹'}{paymentData.amount}</p>
            </div>

            <div className="mb-4 text-center">
              {loadingQR ? (
                <div className="w-32 h-32 bg-gray-200 mx-auto mb-2 rounded-lg flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : selectedQR ? (
                <div>
                  <img 
                    src={selectedQR.qrImage} 
                    alt="Payment QR Code"
                    className="w-32 h-32 mx-auto mb-2 rounded-lg object-contain border"
                  />
                  <p className="text-sm font-medium text-gray-700">{selectedQR.name}</p>
                  <p className="text-xs text-gray-500">{selectedQR.upiId}</p>
                </div>
              ) : (
                <div className="w-32 h-32 bg-gray-200 mx-auto mb-2 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">Loading QR...</span>
                </div>
              )}
              <p className="text-sm text-gray-600 mt-2">Scan QR code to pay {user?.country?.symbol || '₹'}{paymentData.amount}</p>
            </div>

            <form onSubmit={handlePaymentSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UTR Number *
                </label>
                <input
                  type="text"
                  required
                  className="input-field text-gray-800"
                  placeholder="Enter your UTR"
                  value={paymentData.utr}
                  onChange={(e) => setPaymentData({ ...paymentData, utr: e.target.value })}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Proof (JPG/PNG) *
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  required
                  className="input-field"
                  onChange={(e) => setPaymentData({ ...paymentData, proofImage: e.target.files?.[0] || null })}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Withdraw Money
              <span className="text-sm text-gray-600 font-normal ml-2">(Min. ₹300)</span>
            </h3>

            <form onSubmit={handleWithdrawSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  min="300"
                  step="1"
                  required
                  className="input-field"
                  placeholder={`Enter amount (minimum ${user?.country?.symbol || '₹'}${user?.country?.code === 'GB' ? '25' : '300'})`}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
                <div className="flex justify-between text-sm mt-1">
                  <p className="text-gray-500">
                    Commission Earnings: ₹{user?.rewardBalance?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-red-500">
                    Minimum: ₹300
                  </p>
                </div>
                <p className="text-xs text-orange-600 mt-1">
                  Note: You can only withdraw from reward earnings, not deposit amount.
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-2">
                  Bank Details
                  {user?.bankDetails?.accountNumber && (
                    <span className="text-sm text-green-600 ml-2">(Saved from Profile)</span>
                  )}
                </h4>
                {user?.bankDetails?.accountNumber && (
                  <p className="text-sm text-gray-600 mb-3">
                    Your saved bank details are pre-filled. You can modify them if needed.
                  </p>
                )}
                <div className="space-y-3">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Account Number"
                    value={withdrawDetails.accountNumber}
                    onChange={(e) => setWithdrawDetails({ ...withdrawDetails, accountNumber: e.target.value })}
                  />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="IFSC Code"
                    value={withdrawDetails.ifscCode}
                    onChange={(e) => setWithdrawDetails({ ...withdrawDetails, ifscCode: e.target.value })}
                  />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Bank Name"
                    value={withdrawDetails.bankName}
                    onChange={(e) => setWithdrawDetails({ ...withdrawDetails, bankName: e.target.value })}
                  />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Account Holder Name"
                    value={withdrawDetails.accountHolderName}
                    onChange={(e) => setWithdrawDetails({ ...withdrawDetails, accountHolderName: e.target.value })}
                  />
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-2">
                  OR UPI Details
                  {user?.bankDetails?.upiId && (
                    <span className="text-sm text-green-600 ml-2">(Saved from Profile)</span>
                  )}
                </h4>
                {user?.bankDetails?.upiId && (
                  <p className="text-sm text-gray-600 mb-3">
                    Your saved UPI ID is pre-filled. You can modify it if needed.
                  </p>
                )}
                <input
                  type="text"
                  className="input-field"
                  placeholder="UPI ID (e.g., user@paytm)"
                  value={withdrawDetails.upiId}
                  onChange={(e) => setWithdrawDetails({ ...withdrawDetails, upiId: e.target.value })}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={parseFloat(withdrawAmount) < (user?.country?.code === 'GB' ? 25 : 300) || !withdrawAmount}
                  className={`flex-1 ${parseFloat(withdrawAmount) < (user?.country?.code === 'GB' ? 25 : 300) || !withdrawAmount
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'btn-primary'
                    }`}
                >
                  {parseFloat(withdrawAmount) < (user?.country?.code === 'GB' ? 25 : 300) && withdrawAmount ?
                    `Minimum ${user?.country?.symbol || '₹'}${user?.country?.code === 'GB' ? '25' : '300'} Required` :
                    'Submit Request'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
