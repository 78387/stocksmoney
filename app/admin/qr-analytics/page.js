'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';
import { 
  BarChart3,
  TrendingUp,
  IndianRupee,
  Users,
  Calendar,
  Download,
  Filter,
  Search,
  QrCode,
  Eye
} from 'lucide-react';

export default function QRAnalytics() {
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [sortBy, setSortBy] = useState('totalAmount');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchQRAnalytics();
  }, []);

  const fetchQRAnalytics = async () => {
    try {
      const token = Cookies.get('adminToken');
      const response = await fetch('/api/admin/qr-codes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQrCodes(data.qrCodes || []);
      } else {
        toast.error('Failed to fetch QR analytics');
      }
    } catch (error) {
      console.error('Error fetching QR analytics:', error);
      toast.error('Error fetching QR analytics');
    } finally {
      setLoading(false);
    }
  };

  const sortedQRCodes = [...qrCodes].sort((a, b) => {
    const aValue = a.statistics?.[sortBy] || 0;
    const bValue = b.statistics?.[sortBy] || 0;
    return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
  });

  const totalStats = qrCodes.reduce((acc, qr) => ({
    totalAmount: acc.totalAmount + (qr.statistics?.totalAmount || 0),
    totalTransactions: acc.totalTransactions + (qr.statistics?.totalTransactions || 0),
    activeQRs: acc.activeQRs + (qr.isActive ? 1 : 0),
    totalQRs: acc.totalQRs + 1
  }), { totalAmount: 0, totalTransactions: 0, activeQRs: 0, totalQRs: 0 });

  const exportData = () => {
    const csvData = qrCodes.map(qr => ({
      'QR Name': qr.name,
      'UPI ID': qr.upiId,
      'Status': qr.isActive ? 'Active' : 'Inactive',
      'Total Deposits': qr.statistics?.totalAmount || 0,
      'Total Transactions': qr.statistics?.totalTransactions || 0,
      'Average Amount': qr.statistics?.avgAmount || 0,
      'Pending Amount': qr.statistics?.statusBreakdown?.pending?.amount || 0,
      'Pending Count': qr.statistics?.statusBreakdown?.pending?.count || 0,
      'Rejected Amount': qr.statistics?.statusBreakdown?.rejected?.amount || 0,
      'Rejected Count': qr.statistics?.statusBreakdown?.rejected?.count || 0,
      'Created Date': new Date(qr.createdAt).toLocaleDateString(),
      'Last Used': qr.lastUsed ? new Date(qr.lastUsed).toLocaleDateString() : 'Never'
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QR Code Analytics</h1>
          <p className="text-gray-600">Detailed analysis of QR code performance and deposits</p>
        </div>
        <button
          onClick={exportData}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
        >
          <Download size={20} />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <IndianRupee className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Deposits</p>
              <p className="text-2xl font-bold text-green-600">
                ₹{totalStats.totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-blue-600">
                {totalStats.totalTransactions.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <QrCode className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active QR Codes</p>
              <p className="text-2xl font-bold text-purple-600">
                {totalStats.activeQRs} / {totalStats.totalQRs}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg per Transaction</p>
              <p className="text-2xl font-bold text-orange-600">
                ₹{totalStats.totalTransactions > 0 ? Math.round(totalStats.totalAmount / totalStats.totalTransactions).toLocaleString() : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-500" />
            <span className="font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="totalAmount">Total Amount</option>
              <option value="totalTransactions">Total Transactions</option>
              <option value="avgAmount">Average Amount</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="desc">Highest First</option>
              <option value="asc">Lowest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* QR Codes Analytics Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  QR Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approved Deposits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rejected
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Used
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedQRCodes.map((qr) => (
                <tr key={qr._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img 
                        src={qr.qrImage} 
                        alt="QR" 
                        className="w-10 h-10 object-contain border rounded mr-3"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{qr.name}</div>
                        <div className="text-sm text-gray-500">{qr.upiId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      qr.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {qr.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-green-600">
                      ₹{(qr.statistics?.totalAmount || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {qr.statistics?.totalTransactions || 0} transactions
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-yellow-600">
                      ₹{(qr.statistics?.statusBreakdown?.pending?.amount || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {qr.statistics?.statusBreakdown?.pending?.count || 0} requests
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-red-600">
                      ₹{(qr.statistics?.statusBreakdown?.rejected?.amount || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {qr.statistics?.statusBreakdown?.rejected?.count || 0} requests
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Avg: ₹{(qr.statistics?.avgAmount || 0).toLocaleString()}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min(100, ((qr.statistics?.totalAmount || 0) / Math.max(totalStats.totalAmount, 1)) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {qr.lastUsed 
                      ? new Date(qr.lastUsed).toLocaleDateString()
                      : 'Never used'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {qrCodes.length === 0 && (
          <div className="text-center py-12">
            <QrCode size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No QR Codes Found</h3>
            <p className="text-gray-600">Add QR codes to start tracking deposits</p>
          </div>
        )}
      </div>
    </div>
  );
}
