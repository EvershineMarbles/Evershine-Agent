"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

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
  status?: "draft" | "pending" | "approved"
  applicationAreas?: string
  quantityAvailable?: number
}

// Add these interfaces
interface Agent {
  agentId: string
  name: string
  email: string
  commissionRate: number
  categoryCommissions?: Record<string, number>
}

export default function ProductsPage() {
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const clientId = params.clientId as string

  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [imageError, setImageError] = useState<Record<string, boolean>>({})
  // Wishlist and cart state
  const [wishlist, setWishlist] = useState<string[]>([])
  const [cart, setCart] = useState<string[]>([])
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  // Agent info state - simplified to just commission info
  const [agentCommission, setAgentCommission] = useState<{
    commissionRate: number
    categoryCommissions?: Record<string, number>
  } | null>(null)
  const [commissionLoading, setCommissionLoading] = useState(false)
  const [commissionError, setCommissionError] = useState<string | null>(null)

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

  // Save wishlist and cart to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("wishlist", JSON.stringify(wishlist))
      localStorage.setItem("cart", JSON.stringify(cart))
    }
  }, [wishlist, cart])

  // Fetch agent commission info function - using the new endpoint
  const fetchAgentCommission = useCallback(async () => {
    console.log("1. Starting to fetch agent commission info...")

    try {
      // Get the token for authorization
      const token = localStorage.getItem("clientImpersonationToken")
      if (!token) {
        console.log("2. No authentication token found")
        return
      }

      console.log("3. Token found, attempting to decode...")

      // Try to decode the token to get agent info
      try {
        const tokenParts = token.split(".")
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]))
          console.log("4. Token payload:", payload)
          console.log("5. Agent ID from token:", payload.agentId)
        }
      } catch (e) {
        console.log("Error decoding token:", e)
      }

      // Fetch agent commission from the new endpoint
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"
      console.log("6. Fetching commission from:", `${apiUrl}/api/client/agent-commission`)

      const response = await fetch(`${apiUrl}/api/client/agent-commission`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("7. Commission API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("8. API error response:", errorText)
        return
      }

      const data = await response.json()
      console.log("9. Commission API response data:", data)

      if (data.success && data.data) {
        console.log("10. AGENT COMMISSION INFO:", {
          agentId: data.data.agentId,
          name: data.data.name,
          email: data.data.email,
          commissionRate: data.data.commissionRate,
          categoryCommissions: data.data.categoryCommissions,
        })
      }
    } catch (error) {
      console.log("Error fetching commission info:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch products function
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Use environment variable if available, otherwise use a default URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"
      console.log("Fetching products from:", `${apiUrl}/api/getAllProducts`)

      // Get the token for authorization
      const token = localStorage.getItem("clientImpersonationToken")
      console.log("Using token for products request:", token ? "Token available" : "No token")

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await fetch(`${apiUrl}/api/getAllProducts`, {
        method: "GET",
        headers,
        // Add a timeout to prevent long waiting times
        signal: AbortSignal.timeout(8000), // 8 second timeout
      })

      console.log("Products API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API error response:", errorText)
        throw new Error(`API request failed with status ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("Products API response data:", data)

      if (data.success && Array.isArray(data.data)) {
        console.log("Products fetched successfully. Count:", data.data.length)

        // Process the image URLs to ensure they're valid
        const processedProducts = data.data.map((product: Product) => ({
          ...product,
          image:
            Array.isArray(product.image) && product.image.length > 0
              ? product.image.filter((url: string) => typeof url === "string" && url.trim() !== "")
              : ["/placeholder.svg?height=300&width=300"],
        }))

        setProducts(processedProducts)
      } else {
        console.error("Invalid API response format:", data)
        throw new Error(data.msg || "Invalid API response format")
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load products"
      console.error("Error fetching products:", error)
      setError(errorMessage)

      // Show error toast
      toast({
        title: "Error fetching products",
        description: "Could not load products from the server. Please try again later.",
        variant: "destructive",
      })

      // Set empty products array
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Fetch products and agent commission on component mount
  useEffect(() => {
    console.log("0. Component mounted - fetching agent commission data")
    fetchAgentCommission()
  }, [fetchAgentCommission])

  // Toggle wishlist function
  const toggleWishlist = useCallback(
    (e: React.MouseEvent, productId: string) => {
      e.preventDefault() // Prevent navigation

      if (wishlist.includes(productId)) {
        setWishlist((prev) => prev.filter((id) => id !== productId))
        toast({
          title: "Removed from wishlist",
          description: "Item has been removed from your wishlist",
          variant: "default",
        })
      } else {
        setWishlist((prev) => [...prev, productId])
        toast({
          title: "Added to wishlist",
          description: "Item has been added to your wishlist",
          variant: "default",
        })
      }
    },
    [wishlist, toast],
  )

  // Add to cart function
  const addToCart = useCallback(
    async (e: React.MouseEvent, productId: string, productName: string) => {
      e.preventDefault() // Prevent navigati

      if (cart.includes(productId)) {
        toast({
          title: "Already in cart",
          description: "This item is already in your cart",
          variant: "default",
        })
        return
      }

      try {
        // Set loading state for this specific product
        setAddingToCart((prev) => ({ ...prev, [productId]: true }))

        console.log("Adding to cart:", productId, productName)

        // Get the token
        const token = localStorage.getItem("clientImpersonationToken")

        if (!token) {
          console.error("No impersonation token found")
          toast({
            title: "Authentication Error",
            description: "No authentication token found",
            variant: "destructive",
          })
          throw new Error("No authentication token found")
        }

        // Make a direct fetch request with the token
        const response = await fetch("https://evershinebackend-2.onrender.com/api/addToCart", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId }),
        })

        console.log("Response status:", response.status, response.statusText)

        // Get the response text for debugging
        const responseText = await response.text()
        console.log("Response text:", responseText)

        // Try to parse the response a JSON
        let data
        try {
          data = JSON.parse(responseText)
          console.log("Parsed response data:", data)
        } catch (e) {
          console.error("Failed to parse response as JSON:", e)
          throw new Error(`Invalid response format: ${responseText}`)
        }

        // Check for errors
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Authentication failed. Please refresh the token.")
          } else {
            throw new Error(`API error: ${response.status} ${response.statusText}. Details: ${responseText}`)
          }
        }

        if (data.success) {
          toast({
            title: "Added to cart",
            description: `${productName} has been added to your cart`,
            variant: "default",
          })
          setCart((prev) => [...prev, productId])
        } else {
          throw new Error(data.message || "Failed to add to cart")
        }
      } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : "Failed to add item to cart. Please try again."
        console.error("Error adding to cart:", error)
        toast({
          title: "Error adding to cart",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        // Clear loading state
        setAddingToCart((prev) => ({ ...prev, [productId]: false }))
      }
    },
    [cart, toast],
  )

  // Filter products based on search query
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Handle image loading errors
  const handleImageError = useCallback((productId: string) => {
    setImageError((prev) => ({ ...prev, [productId]: true }))
  }, [])

  // Calculate commission for a product
  const getCommissionInfo = useCallback(
    (product: Product) => {
      if (!agentCommission || !product.basePrice) {
        return null
      }

      let effectiveRate = agentCommission.commissionRate

      // Check for category-specific commission
      if (agentCommission.categoryCommissions && agentCommission.categoryCommissions[product.category]) {
        effectiveRate = agentCommission.categoryCommissions[product.category]
      }

      const increase = ((product.price / product.basePrice - 1) * 100).toFixed(1)

      return {
        basePrice: product.basePrice,
        adjustedPrice: product.price,
        effectiveRate,
        increase,
      }
    },
    [agentCommission],
  )

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading agent commission data...</p>
        <p className="text-sm text-muted-foreground mt-2">Check the console for logs</p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Agent Commission Test</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-2">Testing Commission Rate</h2>
        <p>Please check the browser console (F12) to see the agent commission information.</p>
        <p className="mt-2">We've logged 10 messages with details about the agent and their commission rates.</p>

        <button
          onClick={fetchAgentCommission}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh Commission Data
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-semibold text-amber-800">Next Steps</h3>
        <p className="mt-2">
          Once we confirm the commission data is being retrieved correctly, we'll implement the full product
          functionality with proper price adjustments based on these commission rates.
        </p>
      </div>
    </div>
  )
}
