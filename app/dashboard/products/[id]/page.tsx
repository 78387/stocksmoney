'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ShoppingCart,
  Star,
  Clock,
  ArrowLeft,
  Calendar,
  DollarSign,
  Gift,
  Shield
} from 'lucide-react'
import toast from 'react-hot-toast'
import Cookies from 'js-cookie'
import { useLocation } from '@/hooks/useLocation'

interface Product {
  dailyCommission: number
  commissionRate: number
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
  stock: number
  createdAt: string
}

interface User {
  balance: number
  country?: {
    code: string
    name: string
    currency: string
    symbol: string
  }
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const { country, formatCurrency, loading: locationLoading } = useLocation()

  useEffect(() => {
    if (params.id && !locationLoading) {
      fetchProduct(params.id as string)
      fetchUserData()
    }
  }, [params.id, locationLoading, country])

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

  const fetchProduct = async (productId: string) => {
    try {
      const token = Cookies.get('token')
      const headers: any = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/products/${productId}`, { headers })
      if (response.ok) {
        const data = await response.json()
        setProduct(data.product)
      } else {
        toast.error('Product not found')
        router.push('/dashboard/products')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Failed to load product')
      router.push('/dashboard/products')
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

  const handlePurchase = async () => {
    if (!product || !user) return

    const productPrice = getProductPrice(product)

    if (user.balance < productPrice) {
      toast.error('Insufficient wallet balance. Please add money to your wallet.')
      return
    }

    setPurchasing(true)

    try {
      const token = Cookies.get('token')
      const response = await fetch('/api/orders/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product._id,
          quantity: 1
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Product purchased successfully! Rewards will be credited daily.')
        // Redirect to orders page after a short delay
        setTimeout(() => {
          router.push('/dashboard/orders')
        }, 2000)
      } else {
        toast.error(data.message || 'Purchase failed')
      }
    } catch (error) {
      console.error('Purchase error:', error)
      toast.error('Something went wrong')
    } finally {
      setPurchasing(false)
    }
  }

  if (loading || locationLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-300 rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-20 bg-gray-300 rounded"></div>
              <div className="h-12 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
        <button
          onClick={() => router.push('/dashboard/products')}
          className="btn-primary"
        >
          Back to Products
        </button>
      </div>
    )
  }

  const productPrice = product ? getProductPrice(product) : 0
  const productSymbol = product ? getProductSymbol(product) : country.symbol
  const commissionRate = product?.commissionRate || 0
  const dailyReward = (productPrice * commissionRate) / 100
  const totalRewards = dailyReward * (product?.deadlineDays || 0)

  console.log('Product data:', product)
  console.log('Commission rate:', commissionRate)
  console.log('Daily reward:', dailyReward)

  return (
    <div className="p-4">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Products</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="space-y-4">
          <div className="aspect-w-1 aspect-h-1">
            <img
              src={product.image || '/api/placeholder/500/500'}
              alt={product.name}
              className="w-full h-96 object-contain rounded-lg bg-gray-200"
            />
          </div>

          {/* Additional Info Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Secure Purchase</span>
              </div>
              <p className="text-sm text-blue-700">100% secure payment via wallet</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Gift className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">Daily Rewards</span>
              </div>
              <p className="text-sm text-green-700">Earn {product.commissionRate}% daily rewards for {product.deadlineDays} days</p>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {product.category}
              </span>
              <div className="flex items-center space-x-1 text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
                <span className="text-gray-500 text-sm ml-2">(4.8)</span>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

            <p className="text-gray-600 text-lg leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Price */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-lg text-gray-600">Price:</span>
              <span className="text-3xl font-bold text-green-600">{productSymbol}{productPrice.toLocaleString()}</span>
            </div>
          </div>

          {/* Deadline & Rewards Info */}
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span className="font-semibold text-yellow-900">Product Deadline</span>
              </div>
              <p className="text-yellow-800">
                This product will stay in your orders for <strong>{product.deadlineDays} days</strong> after purchase.
              </p>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-900">Reward System</span>
              </div>
              <div className="space-y-2 text-green-800">
                <p>💰 <strong>Daily Reward:</strong> {productSymbol}{dailyReward.toFixed(2)}</p>
                <p>📅 <strong>Reward Days:</strong> {product.deadlineDays} days</p>
                <p>🎯 <strong>Total Rewards:</strong> {productSymbol}{totalRewards.toFixed(2)}</p>
                <p className="text-sm">Rewards are automatically credited to your wallet every 24 hours!</p>
              </div>
            </div>
          </div>

          {/* Wallet Balance */}
          {user && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                💰 Your Wallet Balance: <span className="font-bold">{formatCurrency(user.balance)}</span>
              </p>
              {user.balance < productPrice && (
                <p className="text-sm text-red-600 mt-1">
                  ⚠️ Insufficient balance. Please add {productSymbol}{(productPrice - user.balance).toFixed(2)} more to your wallet.
                </p>
              )}
            </div>
          )}

          {/* Purchase Button */}
          <div className="space-y-3">
            <button
              onClick={handlePurchase}
              disabled={purchasing || (user && user.balance < productPrice)}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-lg flex items-center justify-center space-x-2 transition-colors ${user && user.balance < productPrice
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'btn-primary'
                } disabled:opacity-50`}
            >
              <ShoppingCart className="h-5 w-5" />
              <span>
                {purchasing
                  ? 'Processing Purchase...'
                  : user && user.balance < productPrice
                    ? 'Insufficient Balance'
                    : `Buy Now for ${productSymbol}${productPrice.toLocaleString()}`
                }
              </span>
            </button>

            {user && user.balance < productPrice && (
              <button
                onClick={() => router.push('/dashboard/wallet')}
                className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Add Money to Wallet
              </button>
            )}
          </div>

          {/* Additional Info */}
          <div className="text-sm text-gray-500 space-y-1">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Added on {new Date(product.createdAt).toLocaleDateString('en-IN')}</span>
            </div>
            <p>Stock: {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
