'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Cookies from 'js-cookie'
import {
  ShoppingBag,
  ShoppingCart,
  User,
  Wallet,
  Users,
  MoreHorizontal,
  LogOut
} from 'lucide-react'
import toast from 'react-hot-toast'

const navItems = [
  { href: '/dashboard/products', label: 'Products', icon: ShoppingBag },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
  { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
  { href: '/dashboard/referral', label: 'Referral', icon: Users },
  { href: '/dashboard/more', label: 'More', icon: MoreHorizontal },
]

interface User {
  id: string
  name: string
  email: string
  balance: number
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchUserData()
    fetchLogo()
  }, []) // Empty dependency array to run only once

  const fetchLogo = async () => {
    try {
      const response = await fetch('/api/admin/logo')
      if (response.ok) {
        const data = await response.json()
        if (data.hasLogo) {
          setLogoUrl(data.logoUrl)
        }
      }
    } catch (error) {
      console.error('Error fetching logo:', error)
    }
  }

  const fetchUserData = async () => {
    if (isAuthenticating) return // Prevent multiple simultaneous requests
    
    try {
      setIsAuthenticating(true)
      const token = Cookies.get('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        // Clear invalid token and redirect
        Cookies.remove('token')
        router.push('/login')
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      Cookies.remove('token')
      router.push('/login')
    } finally {
      setLoading(false)
      setIsAuthenticating(false)
    }
  }

  const handleLogout = () => {
    Cookies.remove('token')
    toast.success('Logged out successfully')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="max-w-[100px] object-contain"
                />
              ) : (
                <h1 className="text-xl font-bold text-gray-900">StocksMoney</h1>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">₹{user.balance?.toFixed(2) || '0.00'}</span>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom padding to prevent content from being hidden behind nav */}
      <div className="h-20"></div>
    </div>
  )
}
