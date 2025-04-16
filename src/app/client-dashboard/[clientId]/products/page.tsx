"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, Pencil, ArrowLeft, Loader2 } from 'lucide-react'
import Image from "next/image"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Product {
  _id: string
  name: string
  price: number
  image: string[]
  postId: string
  status?: 'draft' | 'pending' | 'approved'
}

export default function Products() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'draft'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [imageError, setImageError] = useState<Record<string, boolean>>({})
  const [editLoading, setEditLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/getAllProducts`)
      if (response.data.success) {
        setProducts(response.data.data)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault()
    try {
      setEditLoading(productId)
      const response = await axios.get(`${API_URL}/api/getPostDataById?id=${productId}`)
      if (response.data.success) {
        router.push(`/edit-product/${productId}`)
      } else {
        throw new Error("Product not found")
      }
    } catch (error) {
      console.error("Error accessing product:", error)
      alert("Unable to edit product at this time")
    } finally {
      setEditLoading(null)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === 'all' || product.status === activeTab
    return matchesSearch && matchesTab
  })

  const handleImageError = (productId: string) => {
    setImageError(prev => ({ ...prev, [productId]: true }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-[#194a95]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Back Button Header */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <button 
              onClick={() => router.push('/admin-panel')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        {/* Header with Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-4xl font-bold text-[#181818]">All Products</h1>
          <div className="relative w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search Product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 w-full md:w-[300px] rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#194a95] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Filter Tabs and Add Button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'approved', 'draft'] as const).map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab 
                    ? "bg-[#194a95] text-white" 
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <button 
            onClick={() => router.push('/add-product')}
            className="px-6 py-3 rounded-lg bg-[#194a95] text-white w-full md:w-auto justify-center
                     hover:bg-[#0f3a7a] transition-colors active:transform active:scale-95"
          >
            Add New Product
          </button>
        </div>

        {/* Products Count */}
        <p className="text-gray-600 mb-6">
          Showing {filteredProducts.length} of {products.length} products
        </p>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-8">
          {filteredProducts.map((product) => (
            <div key={product._id} className="group relative bg-white rounded-2xl overflow-hidden border border-gray-200/80 hover:border-gray-300/80 transition-colors">
              <Link 
                href={`/product/${product.postId}`}
                className="block"
              >
                <div className="p-3">
                  <div className="relative w-full overflow-hidden rounded-xl bg-gray-50
                              aspect-[4/3] sm:aspect-[4/3] md:aspect-[4/3] lg:aspect-square">
                    <Image
                      src={imageError[product._id] ? "/placeholder.svg" : (product.image[0] || "/placeholder.svg")}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105 duration-300"
                      onError={() => handleImageError(product._id)}
                    />
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                      {product.name}
                    </h3>
                    <div className="relative z-10 -mt-1 -mr-1 flex-shrink-0" onClick={(e) => e.preventDefault()}>
                      <button 
                        onClick={(e) => handleEdit(e, product.postId)}
                        className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-50"
                        disabled={editLoading === product.postId}
                      >
                        {editLoading === product.postId ? (
                          <Loader2 className="h-4 w-4 animate-spin text-[#194a95]" />
                        ) : (
                          <Pencil className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 mt-0.5">Rs. {product.price}/per sqft</p>
                  {product.status && (
                    <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs ${
                      product.status === 'approved' ? 'bg-green-100 text-green-800' :
                      product.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found</p>
          </div>
        )}

        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <div className="flex justify-end gap-4 mt-8">
            <button className="px-6 py-3 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors w-32">
              Previous
            </button>
            <button className="px-6 py-3 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors w-32">
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}