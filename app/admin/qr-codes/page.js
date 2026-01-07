'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  QrCode,
  IndianRupee,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react';

export default function QRCodesManagement() {
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedQR, setSelectedQR] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    upiId: '',
    qrImageFile: null,
    description: ''
  })
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchQRCodes();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB')
        return
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file')
        return
      }

      setFormData(prev => ({ ...prev, qrImageFile: file }))
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', upiId: '', qrImageFile: null, description: '' })
    setImagePreview(null)
  }

  const fetchQRCodes = async () => {
    try {
      const token = Cookies.get('adminToken');
      console.log('Fetching QR codes with token:', token ? 'Present' : 'Missing');
      
      if (!token) {
        toast.error('Admin token not found. Please login again.');
        return;
      }

      const response = await fetch('/api/admin/qr-codes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('QR codes data:', data);
        setQrCodes(data.qrCodes || []);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        toast.error(errorData.error || `Failed to fetch QR codes (${response.status})`);
      }
    } catch (error) {
      console.error('Error fetching QR codes:', error);
      toast.error('Network error while fetching QR codes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQR = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.upiId || !formData.qrImageFile) {
      toast.error('Please fill all required fields and select an image');
      return;
    }

    try {
      const token = Cookies.get('adminToken');
      console.log('Adding QR with token:', token ? 'Present' : 'Missing');
      
      if (!token) {
        toast.error('Admin token not found. Please login again.');
        return;
      }

      const submitFormData = new FormData();
      submitFormData.append('name', formData.name);
      submitFormData.append('upiId', formData.upiId);
      submitFormData.append('qrImage', formData.qrImageFile);
      submitFormData.append('description', formData.description);

      console.log('Submitting form data:', {
        name: formData.name,
        upiId: formData.upiId,
        description: formData.description,
        imageSize: formData.qrImageFile?.size
      });

      const response = await fetch('/api/admin/qr-codes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitFormData
      });

      console.log('Add QR response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Add QR success:', data);
        toast.success('QR code added successfully');
        setShowAddModal(false);
        resetForm();
        fetchQRCodes();
      } else {
        const errorData = await response.json();
        console.error('Add QR error:', errorData);
        toast.error(errorData.error || `Failed to add QR code (${response.status})`);
      }
    } catch (error) {
      console.error('Error adding QR code:', error);
      toast.error('Network error while adding QR code');
    }
  };

  const handleEditQR = async (e) => {
    e.preventDefault();
    
    try {
      const token = Cookies.get('adminToken');
      const submitFormData = new FormData();
      submitFormData.append('qrCodeId', selectedQR._id);
      submitFormData.append('name', formData.name);
      submitFormData.append('upiId', formData.upiId);
      submitFormData.append('description', formData.description);
      
      // Only append image if a new one is selected
      if (formData.qrImageFile) {
        submitFormData.append('qrImage', formData.qrImageFile);
      }

      const response = await fetch('/api/admin/qr-codes', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitFormData
      });

      if (response.ok) {
        toast.success('QR code updated successfully');
        setShowEditModal(false);
        setSelectedQR(null);
        resetForm();
        fetchQRCodes();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update QR code');
      }
    } catch (error) {
      console.error('Error updating QR code:', error);
      toast.error('Error updating QR code');
    }
  };

  const toggleQRStatus = async (qrId, currentStatus) => {
    try {
      const token = Cookies.get('adminToken');
      const response = await fetch('/api/admin/qr-codes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          qrCodeId: qrId,
          isActive: !currentStatus
        })
      });

      if (response.ok) {
        toast.success(`QR code ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        fetchQRCodes();
      } else {
        toast.error('Failed to update QR code status');
      }
    } catch (error) {
      console.error('Error updating QR status:', error);
      toast.error('Error updating QR code status');
    }
  };

  const deleteQR = async (qrId) => {
    if (!confirm('Are you sure you want to delete this QR code?')) {
      return;
    }

    try {
      const token = Cookies.get('adminToken');
      const response = await fetch(`/api/admin/qr-codes?id=${qrId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('QR code deleted successfully');
        fetchQRCodes();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete QR code');
      }
    } catch (error) {
      console.error('Error deleting QR code:', error);
      toast.error('Error deleting QR code');
    }
  };

  const openEditModal = (qr) => {
    setSelectedQR(qr);
    setFormData({
      name: qr.name,
      upiId: qr.upiId,
      qrImageFile: null,
      description: qr.description || ''
    });
    setImagePreview(qr.qrImage); // Show current image as preview
    setShowEditModal(true);
  };

  const openStatsModal = (qr) => {
    setSelectedQR(qr);
    setShowStatsModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QR Codes Management</h1>
          <p className="text-gray-600">Manage payment QR codes for deposits</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} />
          Add QR Code
        </button>
      </div>

      {/* QR Codes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {qrCodes.map((qr) => (
          <div key={qr._id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{qr.name}</h3>
                <p className="text-sm text-gray-600">{qr.upiId}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  qr.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {qr.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* QR Code Image */}
            <div className="mb-4 flex justify-center">
              <img 
                src={qr.qrImage} 
                alt={`QR Code for ${qr.name}`}
                className="w-32 h-32 object-contain border rounded"
              />
            </div>

            {/* Enhanced Statistics */}
            <div className="space-y-3 mb-4">
              {/* Total Approved */}
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-800">Approved Deposits</span>
                  <span className="text-lg font-bold text-green-600">
                    ₹{qr.statistics?.totalAmount?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="text-xs text-green-600 mt-1">
                  {qr.statistics?.totalTransactions || 0} transactions
                  {qr.statistics?.avgAmount > 0 && (
                    <span> • Avg: ₹{qr.statistics.avgAmount.toLocaleString()}</span>
                  )}
                </div>
              </div>

              {/* Status Breakdown */}
              {qr.statistics?.statusBreakdown && (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {/* Pending */}
                  {qr.statistics.statusBreakdown.pending.count > 0 && (
                    <div className="bg-yellow-50 p-2 rounded text-center">
                      <div className="font-bold text-yellow-600">
                        {qr.statistics.statusBreakdown.pending.count}
                      </div>
                      <div className="text-yellow-600">Pending</div>
                      <div className="text-yellow-500">
                        ₹{qr.statistics.statusBreakdown.pending.amount.toLocaleString()}
                      </div>
                    </div>
                  )}
                  
                  {/* Rejected */}
                  {qr.statistics.statusBreakdown.rejected.count > 0 && (
                    <div className="bg-red-50 p-2 rounded text-center">
                      <div className="font-bold text-red-600">
                        {qr.statistics.statusBreakdown.rejected.count}
                      </div>
                      <div className="text-red-600">Rejected</div>
                      <div className="text-red-500">
                        ₹{qr.statistics.statusBreakdown.rejected.amount.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Last Used */}
              {qr.lastUsed && (
                <div className="text-xs text-gray-500">
                  Last used: {new Date(qr.lastUsed).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(qr)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => toggleQRStatus(qr._id, qr.isActive)}
                  className={`p-2 rounded ${
                    qr.isActive 
                      ? 'text-red-600 hover:bg-red-50' 
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                  title={qr.isActive ? 'Deactivate' : 'Activate'}
                >
                  {qr.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  onClick={() => openStatsModal(qr)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                  title="View Detailed Statistics"
                >
                  <TrendingUp size={16} />
                </button>
                <button
                  onClick={() => deleteQR(qr._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {qr.description && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm text-gray-600">{qr.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {qrCodes.length === 0 && (
        <div className="text-center py-12">
          <QrCode size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No QR Codes</h3>
          <p className="text-gray-600 mb-4">Add your first QR code to start accepting deposits</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Add QR Code
          </button>
        </div>
      )}

      {/* Add QR Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New QR Code</h2>
            <form onSubmit={handleAddQR}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="e.g., Main Account"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UPI ID *
                </label>
                <input
                  type="text"
                  value={formData.upiId}
                  onChange={(e) => setFormData({...formData, upiId: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="example@paytm"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  QR Code Image *
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    required
                  />
                  {imagePreview && (
                    <div className="flex justify-center">
                      <img 
                        src={imagePreview} 
                        alt="QR Preview" 
                        className="w-32 h-32 object-contain border rounded-lg"
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Upload QR code image (Max 5MB, JPG/PNG)
                  </p>
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  rows="3"
                  placeholder="Optional description"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add QR Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit QR Modal */}
      {showEditModal && selectedQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit QR Code</h2>
            <form onSubmit={handleEditQR}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UPI ID *
                </label>
                <input
                  type="text"
                  value={formData.upiId}
                  onChange={(e) => setFormData({...formData, upiId: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  QR Code Image
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                  {imagePreview && (
                    <div className="flex justify-center">
                      <img 
                        src={imagePreview} 
                        alt="QR Preview" 
                        className="w-32 h-32 object-contain border rounded-lg"
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    {formData.qrImageFile ? 'New image selected' : 'Leave empty to keep current image'}
                  </p>
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  rows="3"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedQR(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update QR Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statistics Modal */}
      {showStatsModal && selectedQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">QR Code Statistics - {selectedQR.name}</h2>
              <button
                onClick={() => setShowStatsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* QR Info */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-4">
                <img 
                  src={selectedQR.qrImage} 
                  alt="QR Code" 
                  className="w-20 h-20 object-contain border rounded"
                />
                <div>
                  <h3 className="font-semibold text-lg">{selectedQR.name}</h3>
                  <p className="text-gray-600">{selectedQR.upiId}</p>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(selectedQR.createdAt).toLocaleDateString()}
                  </p>
                  {selectedQR.lastUsed && (
                    <p className="text-sm text-gray-500">
                      Last used: {new Date(selectedQR.lastUsed).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <IndianRupee className="text-green-600" size={20} />
                  <span className="text-sm font-medium text-green-800">Approved Deposits</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  ₹{selectedQR.statistics?.totalAmount?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-green-600">
                  {selectedQR.statistics?.totalTransactions || 0} transactions
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="text-yellow-600" size={20} />
                  <span className="text-sm font-medium text-yellow-800">Pending</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600">
                  ₹{selectedQR.statistics?.statusBreakdown?.pending?.amount?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-yellow-600">
                  {selectedQR.statistics?.statusBreakdown?.pending?.count || 0} requests
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="text-red-600" size={20} />
                  <span className="text-sm font-medium text-red-800">Rejected</span>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  ₹{selectedQR.statistics?.statusBreakdown?.rejected?.amount?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-red-600">
                  {selectedQR.statistics?.statusBreakdown?.rejected?.count || 0} requests
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="text-purple-600" size={20} />
                  <span className="text-sm font-medium text-purple-800">Avg Amount</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  ₹{selectedQR.statistics?.avgAmount?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-purple-600">Per transaction</div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
              {selectedQR.recentTransactions && selectedQR.recentTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">UTR</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedQR.recentTransactions.map((transaction) => (
                        <tr key={transaction._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium text-gray-900">
                                {transaction.userId?.name || 'Unknown User'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {transaction.userId?.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-green-600">
                              ₹{transaction.amount?.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                              {transaction.utr}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.status === 'approved' ? 'bg-green-100 text-green-800' :
                              transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No transactions yet for this QR code</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
