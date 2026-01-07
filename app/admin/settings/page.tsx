'use client'

import { useState, useEffect } from 'react'
import { 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Eye,
  Settings as SettingsIcon
} from 'lucide-react'
import toast from 'react-hot-toast'
import Cookies from 'js-cookie'

export default function SettingsPage() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [hasLogo, setHasLogo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchLogo()
  }, [])

  const fetchLogo = async () => {
    try {
      const response = await fetch('/api/admin/logo')
      if (response.ok) {
        const data = await response.json()
        setLogoUrl(data.logoUrl)
        setHasLogo(data.hasLogo)
      }
    } catch (error) {
      console.error('Error fetching logo:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (PNG, JPG, JPEG, GIF, or WebP)')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('File size too large. Maximum size is 5MB.')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('logo', file)

      const token = Cookies.get('adminToken')
      const response = await fetch('/api/admin/logo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Logo uploaded successfully!')
        setLogoUrl(data.logoUrl + '?t=' + Date.now()) // Add timestamp to force refresh
        setHasLogo(true)
      } else {
        toast.error(data.message || 'Failed to upload logo')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Something went wrong')
    } finally {
      setUploading(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const handleLogoDelete = async () => {
    if (!confirm('Are you sure you want to delete the logo?')) return

    try {
      const token = Cookies.get('adminToken')
      const response = await fetch('/api/admin/logo', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Logo deleted successfully!')
        setLogoUrl(null)
        setHasLogo(false)
      } else {
        toast.error(data.message || 'Failed to delete logo')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Something went wrong')
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-6"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
          <SettingsIcon className="h-6 w-6 mr-2" />
          Settings
        </h1>
        <p className="text-slate-600">Manage application settings and branding</p>
      </div>

      {/* Logo Management */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center">
            <ImageIcon className="h-5 w-5 mr-2" />
            Logo Management
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Upload and manage your application logo. Recommended size: 200x60px or similar aspect ratio.
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Logo */}
            <div>
              <h3 className="text-md font-medium text-slate-900 mb-4">Current Logo</h3>
              
              {hasLogo && logoUrl ? (
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                  <img
                    src={logoUrl}
                    alt="Current Logo"
                    className="max-h-20 mx-auto mb-4"
                    style={{ maxWidth: '200px' }}
                  />
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => window.open(logoUrl, '_blank')}
                      className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Full Size</span>
                    </button>
                    <button
                      onClick={handleLogoDelete}
                      className="text-red-600 hover:text-red-700 flex items-center space-x-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                  <ImageIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500">No logo uploaded</p>
                  <p className="text-sm text-slate-400">Upload a logo to display in your application</p>
                </div>
              )}
            </div>

            {/* Upload New Logo */}
            <div>
              <h3 className="text-md font-medium text-slate-900 mb-4">
                {hasLogo ? 'Replace Logo' : 'Upload Logo'}
              </h3>
              
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  
                  <label className="cursor-pointer">
                    <span className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2">
                      <Upload className="h-4 w-4" />
                      <span>{uploading ? 'Uploading...' : 'Choose File'}</span>
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  
                  <p className="text-sm text-slate-500 mt-2">
                    PNG, JPG, JPEG, GIF, or WebP (max 5MB)
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Recommended: 200x60px or similar aspect ratio
                  </p>
                </div>
              </div>

              {uploading && (
                <div className="mt-4">
                  <div className="bg-blue-100 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-sm text-blue-700">Uploading logo...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Usage Information */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Usage Information</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• The logo will appear in the header of user dashboard</li>
              <li>• Logo is automatically optimized for web display</li>
              <li>• Changes take effect immediately after upload</li>
              <li>• Use transparent PNG for best results</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
