"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Search, Loader2, Heart, ShoppingCart, AlertCircle, QrCode } from 'lucide-react'
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ErrorBoundary } from "@/components/error-boundary"
import { Button } from "@/components/ui/button"

// Define the Product interface with commission info
interface Product {
 _id: string
 name: string
 price: number
 basePrice?: number
 updatedPrice?: number
 image: string[]
 postId: string
 category: string
 description: string
 status?: "draft" | "pending" | "approved"
 applicationAreas?: string
 quantityAvailable?: number
 commissionInfo?: {
   currentAgentCommission: number
   consultantLevelCommission: number
   totalCommission: number
   consultantLevel: string
 }
}

export default function ProductsPage() {
 console.log("🚀 ProductsPage rendering")

 const params = useParams()
 const router = useRouter()
 const clientId = params.clientId as string

 const { toast } = useToast()
 const [products, setProducts] = useState<Product[]>([])
 const [loading, setLoading] = useState(true)
 const [searchQuery, setSearchQuery] = useState("")
 const [imageError, setImageError] = useState<Record<string, boolean>>({})
 const [wishlist, setWishlist] = useState<string[]>([])
 const [cart, setCart] = useState<string[]>([])
 const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({})
 const [addingToWishlist, setAddingToWishlist] = useState<Record<string, boolean>>({})
 const [error, setError] = useState<string | null>(null)
 const [clientData, setClientData] = useState<any>(null)

 // Fetch products function with DETAILED CONSOLE LOGGING
 const fetchProducts = useCallback(async () => {
   try {
     setLoading(true)
     setError(null)

     console.log("🔄 STARTING PRODUCT FETCH...")
     console.log(`👤 Client ID: ${clientId}`)

     const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"
     const endpoint = `${apiUrl}/api/getClientProducts`
     
     console.log(`🌐 API Endpoint: ${endpoint}`)

     const token = localStorage.getItem("clientImpersonationToken")
     console.log(`🔑 Token exists: ${!!token}`)

     if (!token) {
       throw new Error("No authentication token found. Please refresh the page.")
     }

     const headers: Record<string, string> = {
       "Content-Type": "application/json",
       "Authorization": `Bearer ${token}`
     }

     console.log("📡 Making API request...")

     const response = await fetch(endpoint, {
       method: "GET",
       headers,
       signal: AbortSignal.timeout(10000),
     })

     console.log(`📊 Response Status: ${response.status}`)
     console.log(`📊 Response OK: ${response.ok}`)

     if (!response.ok) {
       throw new Error(`API request failed with status ${response.status}`)
     }

     const data = await response.json()
     
     console.log("🎯 RAW BACKEND RESPONSE:")
     console.log("=====================================")
     console.log(JSON.stringify(data, null, 2))
     console.log("=====================================")

     if (data.success && Array.isArray(data.data)) {
       console.log(`✅ SUCCESS: Received ${data.data.length} products from backend`)

       // DETAILED LOGGING FOR EACH PRODUCT
       console.log("📦 DETAILED PRODUCT ANALYSIS:")
       console.log("=====================================")
       
       data.data.forEach((product: Product, index: number) => {
         console.log(`🏷️ PRODUCT ${index + 1}: ${product.name}`)
         console.log(`   📋 Status: ${product.status || 'Not set'}`)
         console.log(`   💰 Original Price: ₹${product.price}`)
         console.log(`   💎 Base Price: ₹${product.basePrice || 'Not set'}`)
         console.log(`   🎯 Updated Price: ₹${product.updatedPrice || 'Not set'}`)
         console.log(`   📈 Commission Info:`, product.commissionInfo || 'Not provided')
         
         // Determine what price will be displayed
         const displayPrice = product.updatedPrice || product.price
         const hasCommission = product.updatedPrice && product.updatedPrice !== product.price
         
         console.log(`   🖥️ FRONTEND WILL DISPLAY: ₹${displayPrice}`)
         console.log(`   ✨ Has Commission Applied: ${hasCommission ? 'YES' : 'NO'}`)
         console.log(`   🎨 Price Color: ${hasCommission ? 'GREEN (commission applied)' : 'DEFAULT'}`)
         console.log(`   ---`)
       })
       
       console.log("=====================================")

       // Filter out products with missing postId
       const validProducts = data.data.filter(
         (product: Product) => product.postId && typeof product.postId === "string",
       )

       if (validProducts.length < data.data.length) {
         console.warn(`⚠️ Filtered out ${data.data.length - validProducts.length} products with invalid postId`)
       }

       // Process the image URLs
       const processedProducts = validProducts.map((product: Product) => {
         return {
           ...product,
           image:
             Array.isArray(product.image) && product.image.length > 0
               ? product.image.filter((url: string) => typeof url === "string" && url.trim() !== "")
               : ["/placeholder.svg"],
           basePrice: product.basePrice || product.price,
         }
       })

       console.log(`🎯 FINAL: Setting ${processedProducts.length} products in state`)
       setProducts(processedProducts)

       // Log what will be shown in UI
       console.log("🖥️ UI DISPLAY SUMMARY:")
       processedProducts.forEach((product, index) => {
         const displayPrice = product.updatedPrice || product.price
         const hasCommission = product.updatedPrice && product.updatedPrice !== product.price
         console.log(`   ${index + 1}. ${product.name} - ₹${displayPrice} ${hasCommission ? '(Commission Applied ✓)' : '(Original Price)'}`)
       })

     } else {
       console.error("❌ Invalid API response format:", data)
       throw new Error(data.message || "Invalid API response format")
     }
   } catch (error: any) {
     const errorMessage = error instanceof Error ? error.message : "Failed to load products"
     console.error("❌ FETCH ERROR:", error)
     setError(errorMessage)

     toast({
       title: "Error fetching products",
       description: "Could not load products from the server. Please try again later.",
       variant: "destructive",
     })

     setProducts([])
   } finally {
     setLoading(false)
     console.log("🏁 Product fetch completed")
   }
 }, [toast, clientId])

 // Fetch products on component mount
 useEffect(() => {
   console.log("🎬 Component mounted, fetching products...")
   fetchProducts()
 }, [fetchProducts])

 // Rest of your component code remains the same...
 // (toggleWishlist, addToCart, etc.)

 // Filter products based on search query
 const filteredProducts = products.filter(
   (product) =>
     product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     product.category.toLowerCase().includes(searchQuery.toLowerCase()),
 )

 console.log(`🔍 FILTERED PRODUCTS: ${filteredProducts.length} out of ${products.length} total`)

 // Loading state
 if (loading) {
   return (
     <div className="flex flex-col items-center justify-center h-[80vh]">
       <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
       <p className="text-muted-foreground">Loading all products with pricing...</p>
     </div>
   )
 }

 return (
   <ErrorBoundary>
     <div className="p-6 md:p-8">
       {/* Debug Info */}
       <div className="mb-4 p-4 bg-gray-100 rounded-lg">
         <h3 className="font-bold mb-2">🔍 Debug Info:</h3>
         <p>Total Products Loaded: {products.length}</p>
         <p>Filtered Products: {filteredProducts.length}</p>
         <p>Client ID: {clientId}</p>
         <button 
           onClick={fetchProducts}
           className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
         >
           🔄 Refresh Products
         </button>
       </div>

       {error && (
         <Alert variant="destructive" className="mb-4">
           <AlertCircle className="h-4 w-4" />
           <AlertDescription>{error}</AlertDescription>
         </Alert>
       )}

       <div className="flex justify-between items-center mb-8">
         <h1 className="text-3xl font-bold">All Products (No Filters)</h1>
       </div>

       <div className="relative mb-6">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
         <input
           type="text"
           placeholder="Search products by name or category..."
           value={searchQuery}
           onChange={(e) => setSearchQuery(e.target.value)}
           className="pl-10 pr-4 py-2 w-full rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
         />
       </div>

       {filteredProducts.length === 0 ? (
         <div className="text-center py-12">
           <p className="text-xl font-medium mb-4">No products found</p>
           <p className="text-muted-foreground mb-6">
             {searchQuery ? "Try a different search term" : "No products are currently available"}
           </p>
           <button
             onClick={fetchProducts}
             className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
           >
             🔄 Refresh Products
           </button>
         </div>
       ) : (
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
           {filteredProducts.map((product) => {
             // CONSOLE LOG FOR EACH PRODUCT RENDER
             const displayPrice = product.updatedPrice || product.price
             const hasCommission = product.updatedPrice && product.updatedPrice !== product.price
             const originalPrice = product.basePrice || product.price

             console.log(`🎨 RENDERING: ${product.name} - Display: ₹${displayPrice}, Commission: ${hasCommission}`)

             return (
               <div
                 key={product._id}
                 className="group relative bg-card rounded-lg overflow-hidden border border-border hover:border-primary transition-all hover:shadow-md cursor-pointer"
               >
                 <div className="p-3">
                   <div className="relative w-full overflow-hidden rounded-xl bg-gray-50 aspect-square">
                     <Image
                       src={imageError[product._id] ? "/placeholder.svg" : product.image?.[0] || "/placeholder.svg"}
                       alt={product.name}
                       fill
                       unoptimized={true}
                       className="object-cover transition-transform group-hover:scale-105 duration-300"
                       onError={() => setImageError((prev) => ({ ...prev, [product._id]: true }))}
                     />
                   </div>
                 </div>

                 <div className="p-4">
                   <h3 className="font-semibold text-lg text-foreground line-clamp-1">{product.name}</h3>
                   
                   {/* Status Badge */}
                   <div className="mt-1">
                     <span className={`text-xs px-2 py-1 rounded ${
                       product.status === 'approved' ? 'bg-green-100 text-green-700' :
                       product.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                       'bg-gray-100 text-gray-700'
                     }`}>
                       {product.status || 'No Status'}
                     </span>
                   </div>

                   {/* ENHANCED PRICE DISPLAY WITH BACKEND CALCULATIONS */}
                   <div className="mt-2">
                     {hasCommission ? (
                       <div className="space-y-1">
                         <div className="flex items-center gap-2">
                           <p className="text-lg font-bold text-green-600">₹{displayPrice.toLocaleString()}/sqft</p>
                           <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                             Commission Applied ✓
                           </span>
                         </div>
                         <p className="text-sm text-gray-500 line-through">₹{originalPrice.toLocaleString()}/sqft</p>
                         {product.commissionInfo && (
                           <p className="text-xs text-gray-600">
                             +{product.commissionInfo.totalCommission}% total commission
                           </p>
                         )}
                       </div>
                     ) : (
                       <div className="space-y-1">
                         <p className="text-lg font-bold">₹{displayPrice.toLocaleString()}/sqft</p>
                         <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                           Original Price
                         </span>
                       </div>
                     )}
                   </div>

                   <p className="text-sm text-muted-foreground mt-1">
                     <span className="font-medium">Category:</span> {product.category}
                   </p>

                   {/* Debug info for each product */}
                   <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                     <p>Backend Price: ₹{product.price}</p>
                     <p>Updated Price: ₹{product.updatedPrice || 'None'}</p>
                     <p>Displaying: ₹{displayPrice}</p>
                   </div>
                 </div>
               </div>
             )
           })}
         </div>
       )}
     </div>
   </ErrorBoundary>
 )
}