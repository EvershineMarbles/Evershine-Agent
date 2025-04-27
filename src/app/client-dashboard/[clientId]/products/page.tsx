"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Loader2, Heart, ShoppingCart } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Define the Product interface
interface Product {
  _id: string
  name: string
  price: number
  basePrice?: number
  image: string[]
  postId: string
  category: string
  description: string
  applicationAreas?: string[] | string
  quantityAvailable?: number
}

// Define the agent data interface
interface AgentData {
  name: string
  email: string
  commissionRate: number
}

export default function SimpleProductsPage() {
  // State variables
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [imageError, setImageError] = useState<Record<string, boolean>>({})
  const [wishlist, setWishlist] = useState<string[]>([])
  const [cart, setCart] = useState<string[]>([])
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [agentData, setAgentData] = useState<AgentData | null>(null)

  // API URL from environment variable or default
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"

  // Load wishlist and cart from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedWishlist = localStorage.getItem("wishlist")
        if (savedWishlist) {
          setWishlist(JSON.parse(savedWishlist))
        }

        const savedCart = localStorage.getItem("cart")
        if (savedCart) {
          setCart(JSON.parse(savedCart))
        }
      } catch (e) {
        console.error("Error loading data from localStorage:", e)
      }
    }
  }, [])

  // Debug function to check token
  const checkToken = () => {
    const token = localStorage.getItem("clientImpersonationToken") || localStorage.getItem("token")
    console.log("Current token:", token ? "Token exists" : "No token found")

    if (token) {
      try {
        // Decode JWT payload (middle part of token)
        const base64Url = token.split(".")[1]
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join(""),
        )

        console.log("Token payload:", JSON.parse(jsonPayload))
      } catch (e) {
        console.error("Error decoding token:", e)
      }
    }

    return token
  }

  // Fetch products function
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Check token and log it
      const token = checkToken()

      if (!token) {
        throw new Error("No authentication token found. Please log in again.")
      }

      // First try the client-specific endpoint
      console.log("Fetching from client endpoint:", `${apiUrl}/api/client/products`)

      const response = await fetch(`${apiUrl}/api/client/products`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      console.log("Client endpoint response status:", response.status)

      if (!response.ok) {
        console.error("Client endpoint failed with status:", response.status)
        const errorText = await response.text()
        console.error("Error response:", errorText)

        // If client endpoint fails, try the general products endpoint
        console.log("Trying fallback endpoint:", `${apiUrl}/api/getAllProducts`)
        const fallbackResponse = await fetch(`${apiUrl}/api/getAllProducts`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        console.log("Fallback endpoint response status:", fallbackResponse.status)

        if (!fallbackResponse.ok) {
          const fallbackErrorText = await fallbackResponse.text()
          console.error("Fallback error response:", fallbackErrorText)
          throw new Error(`API request failed with status ${fallbackResponse.status}`)
        }

        const fallbackData = await fallbackResponse.json()
        console.log("Fallback endpoint response data:", fallbackData)

        if (fallbackData.success && Array.isArray(fallbackData.data)) {
          setProducts(fallbackData.data)
        } else {
          throw new Error(fallbackData.msg || "Invalid API response format")
        }

        return
      }

      const data = await response.json()
      console.log("Client endpoint response data:", data)

      if (data.success && Array.isArray(data.data)) {
        // Process the image URLs to ensure they're valid
        const processedProducts = data.data.map((product: Product) => ({
          ...product,
          image:
            Array.isArray(product.image) && product.image.length > 0
              ? product.image.filter((url: string) => typeof url === "string" && url.trim() !== "")
              : ["/elegant-marble-display.png"],
        }))

        console.log(`Processed ${processedProducts.length} products`)
        setProducts(processedProducts)

        // If agent info is included in the response, use it
        if (data.agentInfo) {
          setAgentData(data.agentInfo)
        }
      } else {
        console.error("Invalid API response format:", data)
        throw new Error(data.msg || "Invalid API response format")
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load products"
      console.error("Error fetching products:", error)
      setError(errorMessage)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [apiUrl])

  // Fetch agent data separately if needed
  const fetchAgentData = useCallback(async () => {
    try {
      const token = localStorage.getItem("clientImpersonationToken") || localStorage.getItem("token")
      if (!token) return

      const response = await fetch(`${apiUrl}/api/client/agent-info`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) return

      const data = await response.json()
      if (data.success && data.data) {
        setAgentData(data.data)
      }
    } catch (error) {
      console.error("Error fetching agent data:", error)
    }
  }, [apiUrl])

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts()
    fetchAgentData()
  }, [fetchProducts, fetchAgentData])

  // Save wishlist and cart to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("wishlist", JSON.stringify(wishlist))
      localStorage.setItem("cart", JSON.stringify(cart))
    }
  }, [wishlist, cart])

  // Toggle wishlist function
  const toggleWishlist = useCallback(
    async (e: React.MouseEvent, productId: string, productName: string) => {
      e.preventDefault()

      try {
        const token = localStorage.getItem("clientImpersonationToken") || localStorage.getItem("token")
        if (!token) {
          toast({
            title: "Authentication Error",
            description: "Please log in to add items to your wishlist",
            variant: "destructive",
          })
          return
        }

        if (wishlist.includes(productId)) {
          // Remove from wishlist
          const response = await fetch(`${apiUrl}/api/deleteUserWishlistItem`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ productId }),
          })

          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`)
          }

          setWishlist((prev) => prev.filter((id) => id !== productId))
          toast({
            title: "Removed from wishlist",
            description: `${productName} has been removed from your wishlist`,
          })
        } else {
          // Add to wishlist
          const response = await fetch(`${apiUrl}/api/addToWishlist`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ productId }),
          })

          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`)
          }

          setWishlist((prev) => [...prev, productId])
          toast({
            title: "Added to wishlist",
            description: `${productName} has been added to your wishlist`,
          })
        }
      } catch (error: any) {
        console.error("Error updating wishlist:", error)
        toast({
          title: "Error updating wishlist",
          description: error.message || "Failed to update wishlist",
          variant: "destructive",
        })
      }
    },
    [wishlist, toast, apiUrl],
  )

  // Add to cart function
  const addToCart = useCallback(
    async (e: React.MouseEvent, productId: string, productName: string) => {
      e.preventDefault()

      if (cart.includes(productId)) {
        toast({
          title: "Already in cart",
          description: "This item is already in your cart",
        })
        return
      }

      try {
        setAddingToCart((prev) => ({ ...prev, [productId]: true }))

        const token = localStorage.getItem("clientImpersonationToken") || localStorage.getItem("token")
        if (!token) {
          toast({
            title: "Authentication Error",
            description: "Please log in to add items to your cart",
            variant: "destructive",
          })
          return
        }

        const response = await fetch(`${apiUrl}/api/addToCart`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId }),
        })

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          toast({
            title: "Added to cart",
            description: `${productName} has been added to your cart`,
          })
          setCart((prev) => [...prev, productId])
        } else {
          throw new Error(data.message || "Failed to add to cart")
        }
      } catch (error: any) {
        console.error("Error adding to cart:", error)
        toast({
          title: "Error adding to cart",
          description: error.message || "Failed to add item to cart",
          variant: "destructive",
        })
      } finally {
        setAddingToCart((prev) => ({ ...prev, [productId]: false }))
      }
    },
    [cart, toast, apiUrl],
  )

  // Handle image loading errors
  const handleImageError = useCallback((productId: string) => {
    setImageError((prev) => ({ ...prev, [productId]: true }))
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading products...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        {agentData && (
          <p className="text-sm text-muted-foreground mt-1">
            Prices include {agentData.commissionRate}% agent commission
          </p>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <p className="text-xl font-medium mb-4">No products found</p>
          <p className="text-muted-foreground mb-6">No products are currently available</p>
          <Button onClick={fetchProducts}>Refresh Products</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product._id} className="overflow-hidden h-full flex flex-col">
              <div className="relative aspect-square">
                <Image
                  src={
                    imageError[product._id]
                      ? "/placeholder.svg?height=300&width=300&query=marble product"
                      : product.image && product.image.length > 0 && product.image[0]
                        ? product.image[0]
                        : "/placeholder.svg?height=300&width=300&query=marble product"
                  }
                  alt={product.name}
                  fill
                  className="object-cover"
                  onError={() => handleImageError(product._id)}
                />

                {/* Wishlist button */}
                <button
                  onClick={(e) => toggleWishlist(e, product.postId, product.name)}
                  className="absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors z-10"
                  aria-label={wishlist.includes(product.postId) ? "Remove from wishlist" : "Add to wishlist"}
                  type="button"
                >
                  <Heart
                    className={`h-5 w-5 ${
                      wishlist.includes(product.postId) ? "text-red-500 fill-red-500" : "text-gray-600"
                    }`}
                  />
                </button>
              </div>

              <CardContent className="flex-grow pt-4">
                <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{product.category}</p>

                {/* Price display */}
                <div className="mt-2">
                  <p className="text-lg font-bold text-primary">₹{product.price.toLocaleString()}</p>
                  {product.basePrice && product.basePrice !== product.price && (
                    <p className="text-sm text-muted-foreground">
                      <span className="line-through">₹{product.basePrice.toLocaleString()}</span>
                    </p>
                  )}
                </div>

                {/* Application areas */}
                {product.applicationAreas && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(Array.isArray(product.applicationAreas)
                      ? product.applicationAreas
                      : product.applicationAreas.split(",").map((area) => area.trim())
                    ).map((area, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-0">
                <Button
                  onClick={(e) => addToCart(e, product.postId, product.name)}
                  className="w-full"
                  disabled={
                    cart.includes(product.postId) ||
                    addingToCart[product.postId] ||
                    (product.quantityAvailable !== undefined && product.quantityAvailable <= 0)
                  }
                  variant={cart.includes(product.postId) ? "outline" : "default"}
                >
                  {addingToCart[product.postId] ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : cart.includes(product.postId) ? (
                    "Added to Cart"
                  ) : product.quantityAvailable !== undefined && product.quantityAvailable <= 0 ? (
                    "Out of Stock"
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
