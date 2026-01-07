'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Copy, 
  Share2, 
  Gift, 
  Calendar,
  DollarSign,
  UserCheck,
  UserX,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import Cookies from 'js-cookie'

interface ReferralData {
  referralCode: string
  totalReferrals: number
  totalEarnings: number
  referralHistory: Array<{
    _id: string
    name: string
    email: string
    joinedAt: string
    status: string
    bonusAmount: number
    bonusDate: string | null
  }>
  transactions: Array<{
    _id: string
    amount: number
    createdAt: string
    referralData: {
      referredUserName: string
      referredUserEmail: string
    }
  }>
}

export default function ReferralPage() {
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [referralLink, setReferralLink] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchReferralData()
    fetchUserData()
    generateReferralLink()
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
    }
  }

  const fetchReferralData = async () => {
    try {
      const token = Cookies.get('token')
      const response = await fetch('/api/referral/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setReferralData(data)
      } else {
        toast.error('Failed to load referral data')
      }
    } catch (error) {
      console.error('Error fetching referral data:', error)
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const generateReferralLink = async () => {
    try {
      const token = Cookies.get('token')
      let response = await fetch('/api/referral/generate', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 404) {
        // Generate new referral code
        response = await fetch('/api/referral/generate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      }

      if (response.ok) {
        const data = await response.json()
        setReferralLink(data.referralLink)
      }
    } catch (error) {
      console.error('Error generating referral link:', error)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      toast.success('Referral link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const shareReferralLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join StocksMoney',
          text: 'Join StocksMoney using my referral link and we both get rewards!',
          url: referralLink
        })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      copyToClipboard()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1"
    
    switch (status) {
      case 'active':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <UserCheck className="h-3 w-3" />
            <span>Active</span>
          </span>
        )
      case 'blocked':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            <UserX className="h-3 w-3" />
            <span>Blocked</span>
          </span>
        )
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            <span>{status}</span>
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-300 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Referral Program</h1>
        <p className="text-gray-600">Invite friends and earn {user?.country?.symbol || '₹'}50 when they make their first deposit!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Referrals</p>
              <p className="text-2xl font-bold">{referralData?.totalReferrals || 0}</p>
            </div>
            <Users className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Earnings</p>
              <p className="text-2xl font-bold">{user?.country?.symbol || '₹'}{referralData?.totalEarnings || 0}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Bonus Per Referral</p>
              <p className="text-2xl font-bold">{user?.country?.symbol || '₹'}50</p>
            </div>
            <Gift className="h-8 w-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Share2 className="h-5 w-5 mr-2" />
          Your Referral Link
        </h3>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="flex items-center space-x-2 mb-3">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
            />
            <button
              onClick={copyToClipboard}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                copied 
                  ? 'bg-green-500 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {copied ? 'Copied!' : <Copy className="h-4 w-4" />}
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={shareReferralLink}
              className="flex-1 btn-primary flex items-center justify-center space-x-2"
            >
              <Share2 className="h-4 w-4" />
              <span>Share Link</span>
            </button>
            
            <button
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Join StocksMoney using my referral link: ${referralLink}`)}`)}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p className="mb-2">🎁 <strong>How it works:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Share your referral link with friends</li>
            <li>When they register using your link</li>
            <li>You earn {user?.country?.symbol || '₹'}50 when they make their first deposit</li>
            <li>Your earnings are added directly to your wallet</li>
            <li>No limit on the number of referrals!</li>
          </ul>
        </div>
      </div>

      {/* Referral History */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Referral History
          </h3>
          <button
            onClick={fetchReferralData}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>

        {referralData?.referralHistory && referralData.referralHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Joined Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Bonus Earned</th>
                </tr>
              </thead>
              <tbody>
                {referralData.referralHistory.map((referral) => (
                  <tr key={referral._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{referral.name}</p>
                        <p className="text-sm text-gray-500">{referral.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(referral.joinedAt)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(referral.status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                        <span className="font-medium text-green-600">{user?.country?.symbol || '₹'}{referral.bonusAmount}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No referrals yet</p>
            <p className="text-sm text-gray-400">Start sharing your referral link to earn rewards!</p>
          </div>
        )}
      </div>
    </div>
  )
}
