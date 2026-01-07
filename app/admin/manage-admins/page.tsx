'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Plus, 
  Key, 
  Shield,
  Edit,
  Eye,
  EyeOff,
  UserCheck,
  Settings
} from 'lucide-react'
import toast from 'react-hot-toast'
import Cookies from 'js-cookie'

interface Admin {
  _id: string
  name: string
  email: string
  role: string
  permissions: {
    manageUsers: boolean
    manageTransactions: boolean
    manageProducts: boolean
    viewReports: boolean
    manageAdmins: boolean
    changePassword: boolean
  }
  createdAt: string
}

export default function ManageAdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [currentAdminId, setCurrentAdminId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
    permissions: {
      manageUsers: true,
      manageTransactions: true,
      manageProducts: true,
      viewReports: true,
      manageAdmins: false,
      changePassword: true
    }
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      const token = Cookies.get('adminToken')
      const response = await fetch('/api/admin/manage-admins', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAdmins(data.admins)
        setCurrentAdminId(data.currentAdminId)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to load admins')
      }
    } catch (error) {
      console.error('Error fetching admins:', error)
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (createForm.password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    try {
      const token = Cookies.get('adminToken')
      const response = await fetch('/api/admin/manage-admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'createAdmin',
          adminData: createForm
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Admin created successfully!')
        setShowCreateModal(false)
        setCreateForm({
          name: '',
          email: '',
          password: '',
          role: 'admin',
          permissions: {
            manageUsers: true,
            manageTransactions: true,
            manageProducts: true,
            viewReports: true,
            manageAdmins: false,
            changePassword: true
          }
        })
        fetchAdmins()
      } else {
        toast.error(data.message || 'Failed to create admin')
      }
    } catch (error) {
      console.error('Create admin error:', error)
      toast.error('Something went wrong')
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long')
      return
    }

    try {
      const token = Cookies.get('adminToken')
      const response = await fetch('/api/admin/manage-admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'changePassword',
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Password changed successfully!')
        setShowPasswordModal(false)
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        toast.error(data.message || 'Failed to change password')
      }
    } catch (error) {
      console.error('Change password error:', error)
      toast.error('Something went wrong')
    }
  }

  const handleUpdatePermissions = async (adminId: string, permissions: any, role?: string) => {
    try {
      const token = Cookies.get('adminToken')
      const response = await fetch('/api/admin/manage-admins', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'updatePermissions',
          adminId,
          permissions,
          role
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Admin permissions updated successfully!')
        setShowPermissionsModal(false)
        setSelectedAdmin(null)
        fetchAdmins()
      } else {
        toast.error(data.message || 'Failed to update permissions')
      }
    } catch (error) {
      console.error('Update permissions error:', error)
      toast.error('Something went wrong')
    }
  }

  const getRoleBadge = (role: string) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        role === 'super_admin' 
          ? 'bg-red-100 text-red-800' 
          : 'bg-blue-100 text-blue-800'
      }`}>
        {role === 'super_admin' ? 'Super Admin' : 'Admin'}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Admins</h1>
          <p className="text-slate-600">Create and manage admin accounts</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Key className="h-4 w-4" />
            <span>Change Password</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Admin</span>
          </button>
        </div>
      </div>

      {/* Admins List */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            All Admins ({admins.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-slate-700">Admin</th>
                <th className="text-left py-3 px-6 font-medium text-slate-700">Role</th>
                <th className="text-left py-3 px-6 font-medium text-slate-700">Permissions</th>
                <th className="text-left py-3 px-6 font-medium text-slate-700">Created</th>
                <th className="text-left py-3 px-6 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin._id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      {admin._id === currentAdminId && (
                        <UserCheck className="h-4 w-4 text-green-500 mr-2" />
                      )}
                      <div>
                        <p className="font-medium text-slate-900">{admin.name}</p>
                        <p className="text-sm text-slate-500">{admin.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {getRoleBadge(admin.role)}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(admin.permissions).map(([key, value]) => (
                        value && (
                          <span key={key} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </span>
                        )
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-slate-600">
                      {new Date(admin.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    {admin._id !== currentAdminId && (
                      <button
                        onClick={() => {
                          setSelectedAdmin(admin)
                          setShowPermissionsModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Admin</h3>
            
            <form onSubmit={handleCreateAdmin}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    className="input-field"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    className="input-field"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    className="input-field"
                    value={createForm.role}
                    onChange={(e) => setCreateForm({...createForm, role: e.target.value})}
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permissions
                  </label>
                  <div className="space-y-2">
                    {Object.entries(createForm.permissions).map(([key, value]) => (
                      <label key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setCreateForm({
                            ...createForm,
                            permissions: {
                              ...createForm.permissions,
                              [key]: e.target.checked
                            }
                          })}
                          className="mr-2"
                        />
                        <span className="text-sm">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Change Password</h3>
            
            <form onSubmit={handleChangePassword}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      required
                      className="input-field pr-10"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      required
                      className="input-field pr-10"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      required
                      className="input-field pr-10"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Permissions Modal */}
      {showPermissionsModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Edit Permissions - {selectedAdmin.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="space-y-2">
                  {Object.entries(selectedAdmin.permissions).map(([key, value]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setSelectedAdmin({
                          ...selectedAdmin,
                          permissions: {
                            ...selectedAdmin.permissions,
                            [key]: e.target.checked
                          }
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdatePermissions(selectedAdmin._id, selectedAdmin.permissions)}
                className="flex-1 btn-primary"
              >
                Update Permissions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
