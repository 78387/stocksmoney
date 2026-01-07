'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Cookies from 'js-cookie'
import { 
  LayoutDashboard,
  Users,
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  Shield,
  LogOut,
  Menu,
  X,
  Bell,
  Settings,
  Search,
  ChevronDown,
  Package,
  ShoppingBag,
  QrCode,
  BarChart3,
  Percent
} from 'lucide-react'
import toast from 'react-hot-toast'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/commission', label: 'Commission', icon: Percent },
  { href: '/admin/qr-codes', label: 'QR Codes', icon: QrCode },
  { href: '/admin/qr-analytics', label: 'QR Analytics', icon: BarChart3 },
  { href: '/admin/deposits', label: 'Deposits', icon: ArrowDownLeft },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: ArrowUpRight },
  { href: '/admin/referrals', label: 'Referrals', icon: Gift },
  { href: '/admin/manage-admins', label: 'Manage Admins', icon: Shield },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  useEffect(() => {
    if (pathname === '/admin/login') {
      setLoading(false)
      return
    }

    const token = Cookies.get('adminToken')
    if (!token) {
      router.push('/admin/login')
      return
    }

    fetchAdminData()
  }, [router, pathname])

  const fetchAdminData = async () => {
    try {
      const token = Cookies.get('adminToken')
      const response = await fetch('/api/admin/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAdmin(data.admin)
      } else {
        Cookies.remove('adminToken')
        router.push('/admin/login')
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
      Cookies.remove('adminToken')
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    Cookies.remove('adminToken')
    toast.success('Logged out successfully')
    router.push('/admin/login')
  }

  if (pathname === '/admin/login') {
    return children
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-slate-300">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed positioning */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Logo Section */}
        <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">StocksMoney</h1>
              <p className="text-xs text-blue-100">Admin Panel</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:bg-white hover:bg-opacity-20 p-1 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-8 px-4">
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  {item.label}
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Admin Profile Section */}
        {admin && (
          <div className="p-4 border-t bg-slate-50">
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {admin.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {admin.name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {admin.role?.replace('_', ' ').toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Top Navigation Bar */}
        <header className="bg-white shadow-sm border-b border-slate-200 h-16 flex-shrink-0">
          <div className="flex items-center justify-between h-full px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <div className="hidden md:flex items-center space-x-2 text-sm text-slate-600">
                <span>Welcome back,</span>
                <span className="font-semibold text-slate-900">{admin?.name}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="hidden md:flex items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-10 pr-4 py-2 w-64 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Settings */}
              <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                <Settings className="h-5 w-5" />
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 p-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {admin?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-900">{admin?.name}</p>
                      <p className="text-xs text-slate-500">{admin?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 bg-slate-50 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
