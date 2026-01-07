'use client'

import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Shield,
  FileText,
  HelpCircle,
  ExternalLink
} from 'lucide-react'

export default function MorePage() {
  const companyInfo = {
    name: 'StocksMoney Pvt Ltd',
    description: 'Leading digital products marketplace for financial tools and educational resources.',
    email: 'support@stocksmoney.com',
    phone: '98765 43210',
    address: '221B Baker Street , London, NW1 6XE, United Kingdom',
    website: 'https://stocksmoney.com',
    founded: '2023',
    employees: '50-100'
  }

  const menuItems = [
    {
      icon: Shield,
      title: 'Privacy Policy',
      description: 'How we protect your data',
      action: () => window.open('/privacy-policy', '_blank')
    },
    {
      icon: FileText,
      title: 'Terms of Service',
      description: 'Our terms and conditions',
      action: () => window.open('/terms-of-service', '_blank')
    },
    {
      icon: HelpCircle,
      title: 'Help & Support',
      description: 'Get help with your account',
      action: () => window.open('/support', '_blank')
    },
    {
      icon: Globe,
      title: 'Visit Website',
      description: 'Explore our main website',
      action: () => window.open(companyInfo.website, '_blank')
    }
  ]

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">More</h1>
        <p className="text-gray-600">Company information and resources</p>
      </div>

      {/* Company Info Card */}
      <div className="card mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{companyInfo.name}</h2>
            <p className="text-gray-600">Est. {companyInfo.founded}</p>
          </div>
        </div>

        <p className="text-gray-700 mb-4">{companyInfo.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{companyInfo.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{companyInfo.phone}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Globe className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Website</p>
                <a
                  href={companyInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:text-blue-800"
                >
                  {companyInfo.website}
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium">{companyInfo.address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        {menuItems.map((item, index) => {
          const Icon = item.icon
          return (
            <button
              key={index}
              onClick={item.action}
              className="w-full card hover:shadow-lg transition-shadow text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
                <ExternalLink className="h-5 w-5 text-gray-400" />
              </div>
            </button>
          )
        })}
      </div>

      {/* App Info */}
      <div className="card mt-6">
        <h3 className="text-lg font-semibold mb-4">App Information</h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Version</span>
            <span className="font-medium">1.0.0</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Last Updated</span>
            <span className="font-medium">August 2024</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Platform</span>
            <span className="font-medium">Web App</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Company Size</span>
            <span className="font-medium">{companyInfo.employees} employees</span>
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className="card mt-6 bg-blue-50 border-blue-200">
        <div className="flex items-center space-x-3 mb-3">
          <HelpCircle className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900">Need Help?</h3>
        </div>

        <p className="text-blue-800 mb-4">
          Our support team is here to help you with any questions or issues.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={`mailto:${companyInfo.email}`}
            className="btn-primary flex items-center justify-center space-x-2"
          >
            <Mail className="h-4 w-4" />
            <span>Email Support</span>
          </a>

          <a
            href={`tel:${companyInfo.phone}`}
            className="btn-secondary flex items-center justify-center space-x-2"
          >
            <Phone className="h-4 w-4" />
            <span>Call Support</span>
          </a>
        </div>
      </div>
    </div>
  )
}
