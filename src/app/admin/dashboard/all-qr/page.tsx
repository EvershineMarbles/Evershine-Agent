"use client"

import type React from "react"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { Download, Loader2, Search, Grid, List, Check, ArrowLeft } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
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

function AllQR() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
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

      } else {
      }
    } catch (error) {
      console.error("Error updating price:", error)
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

      // Generate QR code for the product URL
      const productUrl = `${window.location.origin}/product/${product.postId}`
      const qrCodeDataUrl = await QRCode.toDataURL(productUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      })

      // Create a canvas element
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Could not get canvas context")

      // Set canvas dimensions
      canvas.width = 600
      canvas.height = 900

      // Load the template image
      const templateImage = document.createElement("img")
      templateImage.crossOrigin = "anonymous"

      templateImage.onload = () => {
        // Draw the template image on the canvas
        ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height)

        // Load and draw the QR code
        const qrCode = document.createElement("img")
        qrCode.crossOrigin = "anonymous"

        qrCode.onload = () => {
          // Draw QR code in the white space
          ctx.drawImage(qrCode, 380, 640, 150, 150)

          // Add product name below the QR code
          ctx.font = "bold 16px Arial"
          ctx.fillStyle = "#000000"
          ctx.textAlign = "center"

          // Position the text below the QR code
          const qrCodeCenterX = 380 + 75 // QR code X position + half width
          const textY = 810 // Position below the QR code

          // Capitalize the product name
          const capitalizedName = product.name
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ")

          // Wrap text for longer product names
          const maxWidth = 150 // Same width as QR code
          const words = capitalizedName.split(" ")
          let line = ""
          let y = textY
          let lineCount = 0
          const maxLines = 3 // Maximum number of lines to display

          for (let i = 0; i < words.length; i++) {
            // If we've reached the maximum number of lines, add ellipsis and break
            if (lineCount >= maxLines - 1 && i < words.length - 1) {
              ctx.fillText(line + "...", qrCodeCenterX, y)
              break
            }

            const testLine = line + words[i] + " "
            const metrics = ctx.measureText(testLine)
            const testWidth = metrics.width

            if (testWidth > maxWidth && i > 0) {
              ctx.fillText(line, qrCodeCenterX, y)
              line = words[i] + " "
              y += 20 // Line height
              lineCount++
            } else {
              line = testLine
            }
          }

          // Draw the last line if we haven't reached the maximum
          if (lineCount < maxLines) {
            ctx.fillText(line, qrCodeCenterX, y)
          }

          // Convert canvas to data URL and download
          const dataUrl = canvas.toDataURL("image/png")
          const link = document.createElement("a")
          link.href = dataUrl
          link.download = `evershine-product-${product.postId}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

          // Clean up
          setGeneratingQR((prev) => ({ ...prev, [product.postId]: false }))
        }

        qrCode.onerror = () => {
          setGeneratingQR((prev) => ({ ...prev, [product.postId]: false }))
        }

        qrCode.src = qrCodeDataUrl
      }

      templateImage.onerror = () => {
        setGeneratingQR((prev) => ({ ...prev, [product.postId]: false }))
      }

      templateImage.src = "/assets/qr-template.png"
    } catch (error) {
      console.error("Error generating QR code:", error)
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
              onClick={() => router.push("/admin/dashboard/products")}
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
            onClick={() => router.push("/admin/dashboard/add-product")}
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


        {/* Products Table - Tablet Responsive */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden border border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Product
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Price
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                        <Link href={`/admin/dashboard/product/${product.postId}`} className="h-10 w-10 flex-shrink-0 mr-3 block">
                      
                            <Image
                              src={
                                product.image[0] ||
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23f0f0f0'/%3E%3Cpath d='M12 16 L20 26 L28 16' stroke='%23cccccc' stroke-width='2' fill='none'/%3E%3Ccircle cx='20' cy='12' r='4' fill='%23cccccc'/%3E%3C/svg%3E"
                              }
                              alt={product.name}
                              width={40}
                              height={40}
                              className="rounded-md object-cover"
                              onError={(e) => {
                                e.currentTarget.src =
                                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23f0f0f0'/%3E%3Cpath d='M12 16 L20 26 L28 16' stroke='%23cccccc' strokeWidth='2' fill='none'/%3E%3Ccircle cx='20' cy='12' r='4' fill='%23cccccc'/%3E%3C/svg%3E"
                              }}
                            />
                          </Link>
                          <div className="ml-2 min-w-0">
                            <Link
                              href={`/admin/dashboard/product/${product.postId}`}
                              className="text-sm font-medium text-gray-900 hover:text-[#194a95] transition-colors cursor-pointer truncate block"
                            >

                              {product.name}
                            </Link>
                            <div className="text-xs text-gray-500">ID: {product.postId.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                            <input
                              type="number"
                              value={priceValues[product.postId] || ""}
                              onChange={(e) => handlePriceChange(product.postId, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, product.postId)}
                              className="pl-6 pr-2 py-1 w-20 border rounded focus:outline-none focus:ring-2 focus:ring-[#194a95]"
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
                          <span className="text-xs text-gray-500 whitespace-nowrap">/sqft</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button
                          onClick={() => generateAndDownloadQR(product)}
                          size="sm"
                          disabled={!!generatingQR[product.postId]}
                          className="bg-[#194a95] hover:bg-[#0f3a7a] whitespace-nowrap"
                        >
                          {generatingQR[product.postId] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Download QR</span>
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProtectedAllQRPage() {
  return (
        <AllQR />
    
  )
}