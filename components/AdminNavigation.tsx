'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Package, 
  QrCode,
  BarChart3,
  ShoppingBag,
  Settings
} from 'lucide-react'

interface AdminNavigationProps {
  adminRole: 'admin' | 'super_admin'
  permissions: {
    manageUsers: boolean
    manageDeposits: boolean
    manageProducts: boolean
    manageQRCodes: boolean
    manageWithdrawals: boolean
    manageOrders: boolean
    manageAdmins: boolean
    viewQRAnalytics: boolean
    viewReports: boolean
  }
}

export default function AdminNavigation({ adminRole, permissions }: AdminNavigationProps) {
  const pathname = usePathname()

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      permission: true // Always visible
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
      permission: permissions.manageUsers
    },
    {
      name: 'Deposits',
      href: '/admin/deposits',
      icon: ArrowDownLeft,
      permission: permissions.manageDeposits
    },
    {
      name: 'Withdrawals',
      href: '/admin/withdrawals',
      icon: ArrowUpRight,
      permission: permissions.manageWithdrawals
    },
    {
      name: 'Products',
      href: '/admin/products',
      icon: Package,
      permission: permissions.manageProducts
    },
    {
      name: 'Orders',
      href: '/admin/orders',
      icon: ShoppingBag,
      permission: permissions.manageOrders
    },
    {
      name: 'QR Codes',
      href: '/admin/qr-codes',
      icon: QrCode,
      permission: permissions.manageQRCodes
    },
    {
      name: 'QR Analytics',
      href: '/admin/qr-analytics',
      icon: BarChart3,
      permission: permissions.viewQRAnalytics
    },
    {
      name: 'Manage Admins',
      href: '/admin/manage-admins',
      icon: Settings,
      permission: permissions.manageAdmins
    }
  ]

  const visibleItems = menuItems.filter(item => item.permission)

  return (
    <nav className="space-y-1">
      {visibleItems.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Icon className="mr-3 h-5 w-5" />
            {item.name}
          </Link>
        )
      })}
      
      {adminRole === 'admin' && (
        <div className="pt-4 mt-4 border-t border-gray-200">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Admin Access
          </p>
          <p className="px-3 text-xs text-gray-500 mt-1">
            Limited permissions. Contact super admin for full access.
          </p>
        </div>
      )}
    </nav>
  )
}
