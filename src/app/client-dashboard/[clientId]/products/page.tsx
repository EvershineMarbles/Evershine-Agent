"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Search, Loader2, Heart, ShoppingCart, AlertCircle, RefreshCw } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Define the Product interface
interface Product {
  _id: string
  name: string
  price: number
  basePrice?: number // Original price before commission
  image: string[]
  postId: string
  category: string
  description: string
  status?: "draft" | "pending" | "approved"
  applicationAreas?: string[] | string
  quantityAvailable?: number
}

// Define the agent data interface
interface AgentData {
  agentId: string
  name: string
  email: string
  commissionRate: number
}

export default function ProductsPage() {
  // State variables
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [imageError, setImageError] = useState<Record<string, boolean>>({})
  const [wishlist, setWishlist] = useState<string[]>([])
  const [cart, setCart] = useState<string[]>([])
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [agentData, setAgentData] = useState<AgentData | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [sortOption, setSortOption] = useState<string>("default")

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

  // Fetch products function - Use the client-specific endpoint
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get the client impersonation token
      const token = localStorage.getItem("clientImpersonationToken") || localStorage.getItem("token")

      if (!token) {
        throw new Error("No authentication token found. Please log in again.")
      }

      // Use the client-specific endpoint that returns prices with commission already applied
      console.log("Fetching from client endpoint:", `${apiUrl}/api/client/products`)

      const response = await fetch(`${apiUrl}/api/client/products`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(8000), // 8 second timeout
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()
      console.log("Client endpoint response:", data)

      if (data.success && Array.isArray(data.data)) {
        // Process the image URLs to ensure they're valid
        const processedProducts = data.data.map((product: Product) => ({
          ...product,
          image:
            Array.isArray(product.image) && product.image.length > 0
              ? product.image.filter((url: string) => typeof url === "string" && url.trim() !== "")
              : ["/placeholder.svg?height=300&width=300"],
        }))

        setProducts(processedProducts)

        // Extract unique categories
        const uniqueCategories = Array.from(new Set(processedProducts.map((product: Product) => product.category)))

        // If agent info is included in the response, use it
        if (data.agentInfo) {
          setAgentData(data.agentInfo)
        }
      } else {
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
  }, [apiUrl, toast])

  // Fetch agent data separately if needed
  const fetchAgentData = useCallback(async () => {
    try {
      // Get the token
      const token = localStorage.getItem("clientImpersonationToken") || localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      // Use the client-specific endpoint for agent info
      const response = await fetch(`${apiUrl}/api/client/agent-info`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()
      console.log("Agent data response:", data)

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
      e.preventDefault() // Prevent navigation

      try {
        // Get the token
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
            variant: "default",
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
            variant: "default",
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
      e.preventDefault() // Prevent navigation

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
        const token = localStorage.getItem("clientImpersonationToken") || localStorage.getItem("token")

        if (!token) {
          toast({
            title: "Authentication Error",
            description: "Please log in to add items to your cart",
            variant: "destructive",
          })
          throw new Error("No authentication token found")
        }

        // Make a direct fetch request with the token
        const response = await fetch(`${apiUrl}/api/addToCart`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId }),
        })

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Authentication failed. Please log in again.")
          } else {
            const errorText = await response.text()
            throw new Error(`API error: ${response.status}. Details: ${errorText}`)
          }
        }

        const data = await response.json()

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
    [cart, toast, apiUrl],
  )

  // Filter products based on search query and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory ? product.category === selectedCategory : true

    return matchesSearch && matchesCategory
  })

  // Sort products based on selected option
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortOption) {
      case "price-low-high":
        return a.price - b.price
      case "price-high-low":
        return b.price - a.price
      case "name-a-z":
        return a.name.localeCompare(b.name)
      case "name-z-a":
        return b.name.localeCompare(a.name)
      default:
        return 0 // Default sorting (by creation date) is handled by the API
    }
  })

  // Handle image loading errors
  const handleImageError = useCallback((productId: string) => {
    setImageError((prev) => ({ ...prev, [productId]: true }))
  }, [])

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("")
    setSelectedCategory(null)
    setSortOption("default")
  }

  // Add this function to your products-page.tsx file

  const debugToken = () => {
    try {
      const token = localStorage.getItem("clientImpersonationToken") || localStorage.getItem("token")
      if (!token) {
        console.error("No token found in localStorage")
        toast({
          title: "Authentication Error",
          description: "No token found. Please log in again.",
          variant: "destructive",
        })
        return
      }

      // Decode the token (JWT tokens are in format: header.payload.signature)
      const parts = token.split(".")
      if (parts.length !== 3) {
        console.error("Invalid token format")
        return
      }

      try {
        // Base64 decode the payload part
        const payload = JSON.parse(atob(parts[1]))
        console.log("Token payload:", payload)

        toast({
          title: "Token Information",
          description: `Client ID: ${payload.clientId || "N/A"}, Agent: ${payload.agentEmail || payload.email || "N/A"}`,
          variant: "default",
        })
      } catch (e) {
        console.error("Error decoding token:", e)
      }
    } catch (error) {
      console.error("Error in debugToken:", error)
    }
  }

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
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          {agentData && (
            <p className="text-sm text-muted-foreground mt-1">
              Prices include {agentData.commissionRate}% agent commission
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Use relative paths instead of absolute paths */}
          <Link href="./wishlist" className="relative">
            <Heart className="h-6 w-6 text-gray-600" />
            {wishlist.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </Link>

          <Link href="./cart" className="relative">
            <ShoppingCart className="h-6 w-6 text-gray-600" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </Link>
          {/* Add a debug button somewhere in your UI */}
          <Button variant="outline" size="sm" onClick={debugToken} className="ml-2">
            Debug Token
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
        {/* Sidebar filters */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>

              {/* Categories */}
              <div>
                <h3 className="font-medium mb-2">Categories</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-left px-2 py-1 rounded-md text-sm ${
                      selectedCategory === null ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-2 py-1 rounded-md text-sm ${
                        selectedCategory === category ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort options */}
              <div>
                <h3 className="font-medium mb-2">Sort By</h3>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full p-2 rounded-md border border-input bg-background text-sm"
                >
                  <option value="default">Default</option>
                  <option value="price-low-high">Price: Low to High</option>
                  <option value="price-high-low">Price: High to Low</option>
                  <option value="name-a-z">Name: A to Z</option>
                  <option value="name-z-a">Name: Z to A</option>
                </select>
              </div>

              {/* Reset filters */}
              <Button variant="outline" size="sm" onClick={resetFilters} className="w-full">
                Reset Filters
              </Button>
            </CardContent>
          </Card>

          {/* Agent info card */}
          {agentData && (
            <Card>
              <CardHeader>
                <CardTitle>Your Agent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{agentData.name}</p>
                  <p className="text-sm text-muted-foreground">{agentData.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="bg-primary/10">
                      {agentData.commissionRate}% Commission
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Products grid */}
        <div>
          {/* Results summary */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              Showing {sortedProducts.length} {sortedProducts.length === 1 ? "product" : "products"}
              {selectedCategory ? ` in ${selectedCategory}` : ""}
              {searchQuery ? ` matching "${searchQuery}"` : ""}
            </p>
            <Button variant="ghost" size="sm" onClick={fetchProducts}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {sortedProducts.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <p className="text-xl font-medium mb-4">No products found</p>
              <p className="text-muted-foreground mb-6">
                {searchQuery || selectedCategory
                  ? "Try different search terms or filters"
                  : "No products are currently available"}
              </p>
              <Button onClick={resetFilters}>Clear Filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProducts.map((product) => (
                <Card key={product._id} className="group overflow-hidden h-full flex flex-col">
                  <div className="relative aspect-square">
                    <Image
                      src={
                        imageError[product._id]
                          ? "/placeholder.svg?height=300&width=300&query=product"
                          : product.image && product.image.length > 0 && product.image[0]
                            ? product.image[0]
                            : "/placeholder.svg?height=300&width=300&query=product"
                      }
                      alt={product.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105 duration-300"
                      onError={() => handleImageError(product._id)}
                    />

                    {/* Wishlist button overlay */}
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
                    <h3 className="font-semibold text-lg text-foreground line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{product.category}</p>

                    {/* Price display - showing the commission-adjusted price */}
                    <div className="mt-2">
                      <p className="text-lg font-bold text-primary">₹{product.price.toLocaleString()}</p>

                      {/* Show the base price for comparison */}
                      {product.basePrice && product.basePrice !== product.price && (
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground">
                            <span className="line-through">₹{product.basePrice.toLocaleString()}</span>
                          </p>
                          <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-800 rounded-full">
                            Agent Price
                          </span>
                        </div>
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
                      className={`w-full ${cart.includes(product.postId) ? "bg-muted text-muted-foreground" : ""}`}
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
      </div>
    </div>
  )
}
