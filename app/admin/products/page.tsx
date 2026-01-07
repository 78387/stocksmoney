'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, Globe, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import Cookies from 'js-cookie'

interface Product {
  _id: string
  name: string
  description: string
  pricing: {
    INR?: { price: number; currency: string; symbol: string }
    GBP?: { price: number; currency: string; symbol: string }
  }
  price: number
  image: string
  category: string
  deadlineDays: number
  commissionRate: number
  stock: number
  status: string
  targetCountry: string
  availableCountries: string[]
  createdAt: string
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [countryFilter, setCountryFilter] = useState<string>('ALL')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pricing: {
      INR: { price: 0, currency: 'INR', symbol: '₹' },
      GBP: { price: 0, currency: 'GBP', symbol: '£' }
    },
    image: '',
    category: 'Digital Product',
    deadlineDays: 30,
    commissionRate: 0,
    stock: 999,
    targetCountry: 'BOTH',
    availableCountries: ['IN', 'GB']
  })

  const [imagePreview, setImagePreview] = useState<string>('')

  useEffect(() => {
    fetchProducts()
  }, [countryFilter])

  const fetchProducts = async () => {
    try {
      const token = Cookies.get('adminToken')
      const url = countryFilter === 'ALL' 
        ? '/api/admin/products' 
        : `/api/admin/products?country=${countryFilter}`
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProducts(data.products)
      } else {
        toast.error('Failed to fetch products')
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.description) {
      toast.error('Name and description are required')
      return
    }

    if (!formData.pricing.INR.price && !formData.pricing.GBP.price) {
      toast.error('At least one currency pricing is required')
      return
    }

    try {
      const token = Cookies.get('adminToken')
      const method = editingProduct ? 'PUT' : 'POST'
      const body = editingProduct 
        ? { ...formData, id: editingProduct._id }
        : formData

      const response = await fetch('/api/admin/products', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        setShowModal(false)
        setEditingProduct(null)
        resetForm()
        fetchProducts()
      } else {
        toast.error(data.message || 'Operation failed')
      }
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error('Something went wrong')
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      pricing: product.pricing || {
        INR: { price: product.price || 0, currency: 'INR', symbol: '₹' },
        GBP: { price: 0, currency: 'GBP', symbol: '£' }
      },
      image: product.image,
      category: product.category,
      deadlineDays: product.deadlineDays,
      commissionRate: product.commissionRate || 0,
      stock: product.stock,
      targetCountry: product.targetCountry || 'BOTH',
      availableCountries: product.availableCountries || ['IN', 'GB']
    })
    setImagePreview(product.image || '')
    setImageFile(null)
    setShowModal(true)
  }

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const token = Cookies.get('adminToken')
      const response = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: productId, status: 'inactive' })
      })

      if (response.ok) {
        toast.success('Product deleted successfully')
        fetchProducts()
      } else {
        toast.error('Failed to delete product')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Something went wrong')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      pricing: {
        INR: { price: 0, currency: 'INR', symbol: '₹' },
        GBP: { price: 0, currency: 'GBP', symbol: '£' }
      },
      image: '',
      category: 'Digital Product',
      deadlineDays: 30,
      commissionRate: 0,
      stock: 999,
      targetCountry: 'BOTH',
      availableCountries: ['IN', 'GB']
    })
    setImagePreview('')
  }



  const getCountryBadge = (product: Product) => {
    if (product.targetCountry === 'IN') {
      return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">🇮🇳 India Only</span>
    }
    if (product.targetCountry === 'GB') {
      return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">🇬🇧 UK Only</span>
    }
    return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">🌍 Both Countries</span>
  }

  const getPriceDisplay = (product: Product) => {
    const prices = []
    if (product.pricing?.INR?.price) {
      prices.push(`₹${product.pricing.INR.price}`)
    }
    if (product.pricing?.GBP?.price) {
      prices.push(`£${product.pricing.GBP.price}`)
    }
    if (prices.length === 0 && product.price) {
      prices.push(`₹${product.price}`)
    }
    return prices.join(' / ') || 'No price set'
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products Management</h1>
          <p className="text-gray-600">Manage country-specific products and pricing</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null)
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Country Filter */}
      <div className="mb-6 flex items-center space-x-4">
        <Filter className="h-5 w-5 text-gray-500" />
        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Countries</option>
          <option value="IN">🇮🇳 India</option>
          <option value="GB">🇬🇧 United Kingdom</option>
        </select>
        <span className="text-sm text-gray-600">
          Showing {products.length} products
        </span>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pricing
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Target Country
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img
                      src={product.image || '/api/placeholder/60/60'}
                      alt={product.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.category}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {getPriceDisplay(product)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {product.deadlineDays} days | {product.commissionRate || 0}% commission
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getCountryBadge(product)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.stock}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    product.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {products.length === 0 && (
          <div className="text-center py-12">
            <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">
              {countryFilter === 'ALL' 
                ? 'Create your first product to get started'
                : `No products found for ${countryFilter === 'IN' ? 'India' : 'United Kingdom'}`
              }
            </p>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.image}
                  onChange={(e) => {
                    setFormData({ ...formData, image: e.target.value })
                    setImagePreview(e.target.value)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border"
                      onError={() => setImagePreview('')}
                    />
                  </div>
                )}
              </div>

              {/* Pricing Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    🇮🇳 India Price (INR)
                  </label>
                  <input
                    type="number"
                    value={formData.pricing.INR.price}
                    onChange={(e) => setFormData({
                      ...formData,
                      pricing: {
                        ...formData.pricing,
                        INR: { ...formData.pricing.INR, price: Number(e.target.value) }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    🇬🇧 UK Price (GBP)
                  </label>
                  <input
                    type="number"
                    value={formData.pricing.GBP.price}
                    onChange={(e) => setFormData({
                      ...formData,
                      pricing: {
                        ...formData.pricing,
                        GBP: { ...formData.pricing.GBP, price: Number(e.target.value) }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reward Days
                  </label>
                  <input
                    type="number"
                    value={formData.deadlineDays}
                    onChange={(e) => setFormData({ ...formData, deadlineDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Country
                </label>
                <select
                  value={formData.targetCountry}
                  onChange={(e) => setFormData({ ...formData, targetCountry: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="BOTH">Both Countries</option>
                  <option value="IN">India Only</option>
                  <option value="GB">UK Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingProduct(null)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
