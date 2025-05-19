"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, Loader2, Search, Grid, List, Check, AlertCircle } from 'lucide-react'
import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { toast } from "sonner"
import QRCode from "qrcode"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  const [priceValues, setPriceValues] = useState<Record<string, string>>({})
  const [updatingPrice, setUpdatingPrice] = useState<Record<string, boolean>>({})
  const [generatingQR, setGeneratingQR] = useState<Record<string, boolean>>({})
  const [previewQR, setPreviewQR] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [templateLoaded, setTemplateLoaded] = useState(false)
  const [templateError, setTemplateError] = useState(false)

  // Create refs for template image
  const templateImageRef = useRef<HTMLImageElement | null>(null)

  // Preload template image
  useEffect(() => {
    const preloadTemplate = async () => {
      try {
        const img = new Image()
        img.crossOrigin = "anonymous"
        
        // Promise to handle image loading
        const loadImage = () => {
          return new Promise<void>((resolve, reject) => {
            img.onload = () => {
              setTemplateLoaded(true)
              templateImageRef.current = img
              resolve()
            }
            img.onerror = () => reject(new Error("Failed to load template"))
            // Try the first path
            img.src = "/assets/qr-template.png"
          })
        }
        
        try {
          await loadImage()
        } catch (error) {
          // Try alternative path
          img.src = "/qr-template.png"
          img.onload = () => {
            setTemplateLoaded(true)
            templateImageRef.current = img
          }
          img.onerror = () => {
            console.error("Failed to load QR template from all paths")
            setTemplateError(true)
          }
        }
      } catch (error) {
        console.error("Error preloading template:", error)
        setTemplateError(true)
      }
    }
    
    preloadTemplate()
  }, [])

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
      } else {
        toast.error("Failed to fetch products")
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      toast.error("Failed to load products. Please try again.")
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

  const generateQRCode = async (product: Product, download = false) => {
    try {
      if (download) {
        setGeneratingQR((prev) => ({ ...prev, [product.postId]: true }))
      }
      
      // Generate QR code with our special format for role-based access
      const productData = `ev://product/${product.postId}`
      const qrCodeDataUrl = await QRCode.toDataURL(productData, {
        width: 200,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      })

      // If just previewing, return the QR code data URL
      if (!download) {
        return qrCodeDataUrl
      }

      // Simple direct download function that will work as a fallback
      const downloadBasicQR = () => {
        console.log("Falling back to basic QR download")
        const link = document.createElement("a")
        link.href = qrCodeDataUrl
        link.download = `evershine-product-${product.postId}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        setGeneratingQR((prev) => ({ ...prev, [product.postId]: false }))
        toast.success("Basic QR code downloaded successfully")
      }

      // If template failed to load, use basic QR
      if (templateError || !templateLoaded || !templateImageRef.current) {
        downloadBasicQR()
        return null
      }

      // Create a canvas element
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        throw new Error("Could not get canvas context")
      }

      // Set canvas dimensions
      canvas.width = 600
      canvas.height = 900

      // Create a new Image for the QR code
      const qrCode = new Image()
      qrCode.crossOrigin = "anonymous"
      
      try {
        // Load QR code image
        await new Promise<void>((resolve, reject) => {
          qrCode.onload = () => resolve()
          qrCode.onerror = () => reject(new Error("Failed to load QR code"))
          qrCode.src = qrCodeDataUrl
        })

        // Draw the template image on the canvas
        ctx.drawImage(templateImageRef.current, 0, 0, canvas.width, canvas.height)

        // Draw the QR code
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

        if (download) {
          // Use direct download approach which is more reliable
          const link = document.createElement("a")
          link.href = dataUrl
          link.download = `evershine-product-${product.postId}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

          setGeneratingQR((prev) => ({ ...prev, [product.postId]: false }))
          toast.success("QR code downloaded successfully")
        }

        return dataUrl
      } catch (error) {
        console.error("Error in fancy QR generation:", error)
        // Fall back to basic QR download if needed
        if (download) {
          downloadBasicQR()
        }
        return qrCodeDataUrl
      }
    } catch (error) {
      console.error("Error generating QR code:", error)
      if (download) {
        toast.error("Failed to generate QR code: " + (error instanceof Error ? error.message : "Unknown error"))
        setGeneratingQR((prev) => ({ ...prev, [product.postId]: false }))
      }
      return null
    }
  }

  const handlePreviewQR = async (product: Product) => {
    setSelectedProduct(product)
    const qrCodeUrl = await generateQRCode(product, false)
    setPreviewQR(qrCodeUrl)
  }

  const handleDownloadQR = async (product: Product) => {
    await generateQRCode(product, true)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#194a95]" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        {/* Header with Search - Repositioned to top right */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
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
            <h1 className="text-2xl md:text-4xl font-bold text-[#181818]">All Products</h1>
          </div>

          <div className="relative w-full md:w-auto">
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
            <button 
              className="flex items-center gap-1 px-4 py-2 bg-[#194a95] text-white" 
              aria-label="List view"
            >
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
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
          </p>
          
          {templateError && (
            <div className="flex items-center text-amber-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span>QR template not found. Basic QR codes will be used.</span>
            </div>
          )}
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200 rounded-lg">
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
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Link href={`/product/${product.postId}`} className="h-10 w-10 flex-shrink-0 mr-3 block">
                          <Image
                            src={product.image[0] || "/placeholder.svg?height=40&width=40&query=product"}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="rounded-md object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg?key=amh3a"
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
                    
                        <Button
                          onClick={() => handleDownloadQR(product)}
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
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center">
                    <p className="text-gray-500 text-lg">No products found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* QR Code Preview Dialog */}
        <Dialog open={!!previewQR} onOpenChange={(open) => !open && setPreviewQR(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>QR Code Preview</DialogTitle>
              <DialogDescription>
                {selectedProduct?.name} - ID: {selectedProduct?.postId.slice(0, 8)}...
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center p-4">
              {previewQR && (
                <div className="relative">
                  <img 
                    src={previewQR || "/placeholder.svg"} 
                    alt="QR Code Preview" 
                    className="max-w-full h-auto border rounded-md"
                  />
                </div>
              )}
              <div className="mt-4 flex justify-center">
                <Button
                  onClick={() => selectedProduct && handleDownloadQR(selectedProduct)}
                  disabled={!!selectedProduct && !!generatingQR[selectedProduct.postId]}
                  className="bg-[#194a95] hover:bg-[#0f3a7a]"
                >
                  {selectedProduct && generatingQR[selectedProduct.postId] ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download QR Code
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
