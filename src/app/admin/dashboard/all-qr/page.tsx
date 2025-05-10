"use client"

import type React from "react"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, Loader2, Search, Grid, List, Check } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { toast } from "sonner"
import QRCode from "qrcode"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface Product {
  _id: string
  name: string
  price: number
  image: string[]
  postId: string
  status?: "draft" | "pending" | "approved"
  category?: string
  thickness?: string
  size?: string
  sizeUnit?: string
  finishes?: string
}

export default function AllQR() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  // const [previewProduct, setPreviewProduct] = useState<Product | null>(null)
  const [priceValues, setPriceValues] = useState<Record<string, string>>({})
  const [updatingPrice, setUpdatingPrice] = useState<Record<string, boolean>>({})
  const [generatingQR, setGeneratingQR] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/getAllProducts`)
      if (response.data.success) {
        const productsData = response.data.data
        setProducts(productsData)

        // Initialize price values for all products
        const initialPriceValues: Record<string, string> = {}
        productsData.forEach((product: Product) => {
          initialPriceValues[product.postId] = product.price.toString()
        })
        setPriceValues(initialPriceValues)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter((product) => {
    return product.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // const handlePreviewQR = (product: Product) => {
  //   setPreviewProduct(product)
  // }

  // const closePreview = () => {
  //   setPreviewProduct(null)
  // }

  const handlePriceChange = (productId: string, value: string) => {
    setPriceValues((prev) => ({
      ...prev,
      [productId]: value,
    }))
  }

  const updatePrice = async (productId: string) => {
    try {
      const newPrice = priceValues[productId]

      if (!newPrice || isNaN(Number(newPrice)) || Number(newPrice) <= 0) {
        toast.error("Please enter a valid price")
        return
      }

      setUpdatingPrice((prev) => ({ ...prev, [productId]: true }))

      // Using the correct endpoint for updating product price
      const response = await axios.post(`${API_URL}/api/updateProduct/${productId}`, {
        price: Number(newPrice),
      })

      if (response.data.success) {
        // Update the local state
        setProducts(
          products.map((product) => (product.postId === productId ? { ...product, price: Number(newPrice) } : product)),
        )

        toast.success("Price updated successfully")
      } else {
        toast.error(response.data.msg || "Failed to update price")
      }
    } catch (error) {
      console.error("Error updating price:", error)
      toast.error("Failed to update price. Please try again.")
    } finally {
      setUpdatingPrice((prev) => ({ ...prev, [productId]: false }))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, productId: string) => {
    if (e.key === "Enter") {
      updatePrice(productId)
    }
  }

  const generateAndDownloadQR = async (product: Product) => {
    try {
      setGeneratingQR((prev) => ({ ...prev, [product.postId]: true }))
      toast.info("Generating QR code...")

      // Generate QR code with our special format for role-based access
      const productData = `ev://product/${product.postId}`
      const qrCodeDataUrl = await QRCode.toDataURL(productData, {
        width: 300,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      })

      // Create a simple image with just the QR code
      // This simplifies the process and avoids canvas issues
      const link = document.createElement("a")
      link.href = qrCodeDataUrl
      link.download = `evershine-product-${product.postId}.png`
      document.body.appendChild(link)

      // Trigger the download
      link.click()

      // Clean up
      document.body.removeChild(link)
      setGeneratingQR((prev) => ({ ...prev, [product.postId]: false }))
      toast.success("QR code downloaded successfully")
    } catch (error) {
      console.error("Error generating QR code:", error)
      toast.error("Failed to generate QR code: " + (error instanceof Error ? error.message : "Unknown error"))
      setGeneratingQR((prev) => ({ ...prev, [product.postId]: false }))
    }
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
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        {/* Header with Search - Repositioned to top right */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/admin/dashboard`)}
              className="hover:bg-gray-100"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-4xl font-bold text-[#181818]">All Products</h1>
          </div>

          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search Product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 w-full md:w-[300px] rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#194a95] focus:border-transparent [&::placeholder]:text-gray-500"
              />
            </div>
          </div>
        </div>
        {/* View Toggle and Add Button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-2 border rounded-lg overflow-hidden">
            <button
              onClick={() => router.push("admin/dashboard/products")}
              className="flex items-center gap-1 px-4 py-2 text-gray-600 hover:bg-gray-100"
              aria-label="Grid view"
            >
              <Grid className="h-4 w-4" />
              <span>Grid</span>
            </button>
            <button className="flex items-center gap-1 px-4 py-2 bg-[#194a95] text-white" aria-label="List view">
              <List className="h-4 w-4" />
              <span>List</span>
            </button>
          </div>
          <button
            onClick={() => router.push("/add-product")}
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

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Link href={`/product/${product.postId}`} className="h-10 w-10 flex-shrink-0 mr-3 block">
                        <Image
                          src={product.image[0] || "/placeholder.svg"}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="rounded-md object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg"
                          }}
                        />
                      </Link>
                      <div className="ml-2">
                        <Link
                          href={`/product/${product.postId}`}
                          className="text-sm font-medium text-gray-900 hover:text-[#194a95] transition-colors cursor-pointer"
                        >
                          {product.name}
                        </Link>
                        <div className="text-xs text-gray-500">ID: {product.postId.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          value={priceValues[product.postId] || ""}
                          onChange={(e) => handlePriceChange(product.postId, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, product.postId)}
                          className="pl-6 pr-2 py-1 w-24 border rounded focus:outline-none focus:ring-2 focus:ring-[#194a95]"
                          min="1"
                          step="any"
                        />
                      </div>
                      <button
                        onClick={() => updatePrice(product.postId)}
                        disabled={updatingPrice[product.postId]}
                        className="p-1 text-green-600 hover:text-green-800"
                      >
                        {updatingPrice[product.postId] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </button>
                      <span className="text-xs text-gray-500">/per sqft</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end space-x-2">
                      <Link href={`/product/${product.postId}`} passHref>
                        <Button variant="outline" size="sm" className="text-[#194a95] border-[#194a95]">
                          Preview
                        </Button>
                      </Link>
                      <Button
                        onClick={() => generateAndDownloadQR(product)}
                        size="sm"
                        disabled={!!generatingQR[product.postId]}
                        className="bg-[#194a95] hover:bg-[#0f3a7a]"
                      >
                        {generatingQR[product.postId] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" /> Download QR
                          </>
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found</p>
          </div>
        )}
      </div>

      {/* QR Code Preview Modal */}
      {/* {previewProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">QR Code Preview</h3>
              <button onClick={closePreview} className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col items-center">
              <QRCodeGenerator
                productId={previewProduct.postId}
                productName={previewProduct.name}
                category={previewProduct.category}
                thickness={previewProduct.thickness}
                size={previewProduct.size}
                sizeUnit={previewProduct.sizeUnit}
                finishes={previewProduct.finishes}
              />
              <div className="text-center mt-4">
                <h4 className="font-medium">{previewProduct.name}</h4>
                <p className="text-sm text-gray-500">₹{previewProduct.price}/per sqft</p>
              </div>
            </div>
          </div>
        </div>
      )} */}
    </div>
  )
}
