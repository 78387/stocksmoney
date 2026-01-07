'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Star, Clock, Eye, Globe } from 'lucide-react'
import toast from 'react-hot-toast'
import Cookies from 'js-cookie'
import Link from 'next/link'
import { useLocation } from '@/hooks/useLocation'
import CountrySelector from '@/components/CountrySelector'

interface Product {
  _id: string
  name: string
  description: string
  price: number
  pricing?: {
    INR?: { price: number; currency: string; symbol: string }
    GBP?: { price: number; currency: string; symbol: string }
  }
  currentPricing?: { price: number; currency: string; symbol: string }
  image: string
  category: string
  deadlineDays: number
  dailyCommission: number
  commissionRate: number
  stock: number
  targetCountry?: string
  availableCountries?: string[]
  userCountry?: { code: string; currency: string; symbol: string }
}

interface User {
  balance: number
  country?: { code: string; currency: string; symbol: string }
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const { country, formatCurrency, loading: locationLoading } = useLocation()

  useEffect(() => {
    if (!locationLoading) {
      fetchProducts()
      fetchUserData()
    }
  }, [locationLoading, country])

  const fetchProducts = async () => {
    try {
      const token = Cookies.get('token')
      const headers: any = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/products', { headers })
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products)
        console.log('Products loaded for country:', data.userCountry)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

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

  const getProductPrice = (product: Product) => {
    if (product.currentPricing) {
      return product.currentPricing.price
    }
    if (product.pricing && product.pricing[country.currency as keyof typeof product.pricing]) {
      return product.pricing[country.currency as keyof typeof product.pricing]!.price
    }
    return product.price || 0
  }

  const getProductSymbol = (product: Product) => {
    if (product.currentPricing) {
      return product.currentPricing.symbol
    }
    if (product.pricing && product.pricing[country.currency as keyof typeof product.pricing]) {
      return product.pricing[country.currency as keyof typeof product.pricing]!.symbol
    }
    return country.symbol
  }

  const handlePurchase = async (productId: string, price: number) => {
    if (!user) {
      toast.error('Please login to purchase')
      return
    }

    if (user.balance < price) {
      toast.error(`Insufficient wallet balance. Please add money to your wallet.`)
      return
    }

    setPurchasing(productId)

    try {
      const token = Cookies.get('token')
      const response = await fetch('/api/orders/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId,
          quantity: 1
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Product purchased successfully! Rewards will be credited daily.')
        // Update user balance
        setUser(prev => prev ? { ...prev, balance: prev.balance - price } : null)
        // Redirect to orders page after a short delay
        setTimeout(() => {
          window.location.href = '/dashboard/orders'
        }, 2000)
      } else {
        toast.error(data.message || 'Purchase failed')
      }
    } catch (error) {
      console.error('Purchase error:', error)
      toast.error('Something went wrong')
    } finally {
      setPurchasing(null)
    }
  }

  if (loading || locationLoading) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-3 bg-gray-300 rounded mb-4"></div>
              <div className="h-8 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Digital Products</h1>
            <p className="text-gray-600">Discover amazing digital products with daily rewards</p>
          </div>
          <CountrySelector />
        </div>

        {/* Country Info Banner */}
        {/* <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2">
            <Globe className="h-5 w-5 text-blue-600" />
            <span className="text-blue-800 font-medium">
              Showing products for {country.flag} {country.name}
            </span>
            <span className="text-blue-600">•</span>
            <span className="text-blue-700">Prices in {country.currency}</span>
          </div>
        </div> */}

        {user && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800">
              💰 Your Wallet Balance: <span className="font-bold">{formatCurrency(user.balance)}</span>
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => {
          const productPrice = getProductPrice(product)
          const productSymbol = getProductSymbol(product)
          const commissionRate = product.commissionRate || 0
          const dailyCommission = (productPrice * commissionRate) / 100
          const totalCommission = dailyCommission * (product.deadlineDays || 0)

          return (
            <div key={product._id} className="card hover:shadow-lg transition-shadow">
              <div className="aspect-w-16 aspect-h-9 mb-4">
                <img
                  src={product.image || '/api/placeholder/300/200'}
                  alt={product.name}
                  className="w-full h-80 object-fill rounded-lg bg-gray-200"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="flex flex-col items-end space-y-1">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {product.category}
                    </span>
                    {product.targetCountry && product.targetCountry !== 'BOTH' && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                        {product.targetCountry === 'IN' ? '🇮🇳 India' : '🇬🇧 UK'} Only
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-gray-600 text-sm line-clamp-2">
                  {product.description}
                </p>

                <div className="flex items-center space-x-1 text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                  <span className="text-gray-500 text-sm ml-2">(4.8)</span>
                </div>

                {/* Commission Info */}
                <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    <strong>{product.deadlineDays} days</strong> earning period ({commissionRate}% commission)
                  </span>
                </div>

                {/* Commission Calculation */}
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    💰 Daily Commission: <strong>{productSymbol}{dailyCommission.toFixed(2)}</strong>
                  </p>
                  <p className="text-xs text-yellow-800">
                    🎯 Total Commission: <strong>{productSymbol}{totalCommission.toFixed(2)}</strong> ({commissionRate}% × {product.deadlineDays || 0} days)
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-2xl font-bold text-green-600">
                    {productSymbol}{productPrice.toLocaleString()}
                  </span>

                  <div className="flex space-x-2">
                    <Link
                      href={`/dashboard/products/${product._id}`}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </Link>

                    <button
                      onClick={() => handlePurchase(product._id, productPrice)}
                      disabled={purchasing === product._id || (user && user.balance < productPrice)}
                      className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${user && user.balance < productPrice
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'btn-primary'
                        } disabled:opacity-50`}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>
                        {purchasing === product._id
                          ? 'Buying...'
                          : user && user.balance < productPrice
                            ? 'Low Balance'
                            : 'Buy Now'
                        }
                      </span>
                    </button>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products available</h3>
          <p className="text-gray-600">
            No products available for {country.flag} {country.name}. Check back later for new products!
          </p>
        </div>
      )}
    </div>
  )
}
