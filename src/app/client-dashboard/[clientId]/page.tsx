"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, AlertCircle, Search, Heart } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Product {
  _id: string
  name: string
  price: number
  image: string[]
  postId: string
  category: string
  quantityAvailable?: number
  description?: string
}

export default function ClientDashboard() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const clientId = params.clientId as string

  const [clientData, setClientData] = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [productsError, setProductsError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [wishlist, setWishlist] = useState<string[]>([])
  const [cart, setCart] = useState<string[]>([])
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({})

  // Fetch client data
  useEffect(() => {
    const fetchClientData = async () => {
      setLoading(true)
      try {
        // Get the token
        const token = localStorage.getItem("clientImpersonationToken")

        if (!token) {
          throw new Error("No authentication token found. Please refresh the page and try again.")
        }

        // Use the correct API endpoint
        const response = await fetch(`https://evershinebackend-2.onrender.com/api/getClientDetails/${clientId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Client not found. Please check the client ID.")
          } else if (response.status === 401) {
            throw new Error("Authentication failed. Please refresh the token and try again.")
          } else {
            throw new Error(`API error: ${response.status} ${response.statusText}`)
          }
        }

        const data = await response.json()

        if (data.data) {
          setClientData(data.data)
        } else {
          throw new Error("Invalid response format from server")
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
        console.error("Error fetching client data:", error)
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchClientData()
  }, [clientId, toast])

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true)
        setProductsError(null)

        const response = await fetch("https://evershinebackend-2.onrender.com/api/getAllProducts", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        if (data.success && Array.isArray(data.data)) {
          console.log("Products fetched successfully:", data.data)

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
          throw new Error(data.msg || "Invalid API response format")
        }
      } catch (error: any) {
        console.error("Error fetching products:", error)
        setProductsError(error.message || "Failed to load products")
        toast({
          title: "Error fetching products",
          description: "Could not load products from the server. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setProductsLoading(false)
      }
    }

    fetchProducts()
  }, [toast])

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

  // Toggle wishlist function
  const toggleWishlist = (e: React.MouseEvent, productId: string) => {
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
  }

  // Add to cart function
  const addToCart = async (e: React.MouseEvent, productId: string, productName: string) => {
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
      const token = localStorage.getItem("clientImpersonationToken")

      if (!token) {
        throw new Error("No authentication token found. Please refresh the token and try again.")
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

      // Check for errors
      if (!response.ok) {
        let errorMessage = `API error: ${response.status} ${response.statusText}`

        try {
          const errorText = await response.text()
          console.error("Error response body:", errorText)

          // Try to parse as JSON if possible
          try {
            const errorJson = JSON.parse(errorText)
            if (errorJson.message) {
              errorMessage = errorJson.message
            }
          } catch (e) {
            // If not JSON, use the text as is
            if (errorText) {
              errorMessage = errorText
            }
          }
        } catch (e) {
          console.error("Could not read error response:", e)
        }

        if (response.status === 401) {
          errorMessage = "Authentication failed. Please refresh the token and try again."
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log("Add to cart response:", data)

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
      console.error("Error adding to cart:", error)
      toast({
        title: "Error adding to cart",
        description: error.message || "Failed to add item to cart. Please try again.",
        variant: "destructive",
      })
    } finally {
      // Clear loading state
      setAddingToCart((prev) => ({ ...prev, [productId]: false }))
    }
  }

  // Filter products based on search query
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading client data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 md:p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 flex flex-col items-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Client Data</h2>
            <p className="text-red-700 mb-4 text-center">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700 text-white">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-3xl font-bold mb-8">Welcome, {clientData?.name?.split(" ")[0] || "Client"}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-muted-foreground">Name</dt>
                <dd className="font-medium">{clientData?.name || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Mobile</dt>
                <dd className="font-medium">{clientData?.mobile || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Email</dt>
                <dd className="font-medium">{clientData?.email || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">City</dt>
                <dd className="font-medium">{clientData?.city || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Profession</dt>
                <dd className="font-medium">{clientData?.profession || "N/A"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link href={`/client-dashboard/${clientId}/products`}>
                <Button variant="outline" className="w-full">
                  Browse Products
                </Button>
              </Link>
              <Link href={`/client-dashboard/${clientId}/cart`}>
                <Button variant="outline" className="w-full">
                  View Cart
                </Button>
              </Link>
              <Link href={`/client-dashboard/${clientId}/wishlist`}>
                <Button variant="outline" className="w-full">
                  My Wishlist
                </Button>
              </Link>
              <Link href={`/client-dashboard/${clientId}/orders`}>
                <Button variant="outline" className="w-full">
                  Order History
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Cart Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">You have {cart.length} item(s) in your cart</p>
            <Link href={`/client-dashboard/${clientId}/cart`}>
              <Button className="w-full">View Cart</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Products Section */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Featured Products</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {productsLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : productsError ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <p className="text-red-700">{productsError}</p>
              <Button onClick={() => window.location.reload()} className="mt-4 bg-red-600 hover:bg-red-700 text-white">
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.slice(0, 8).map((product) => (
              <div
                key={product._id || product.postId}
                className="group relative bg-card rounded-lg overflow-hidden border border-border hover:border-primary transition-all hover:shadow-md"
              >
                <div className="relative aspect-square">
                  <Image
                    src={
                      product.image && product.image.length > 0
                        ? product.image[0]
                        : "/placeholder.svg?height=300&width=300"
                    }
                    alt={product.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105 duration-300"
                  />

                  {/* Wishlist button overlay */}
                  <button
                    onClick={(e) => toggleWishlist(e, product.postId)}
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

                <div className="p-4">
                  <h3 className="font-semibold text-lg text-foreground line-clamp-1">{product.name}</h3>
                  <p className="text-lg font-bold mt-2">₹{product.price.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-1">{product.category}</p>

                  {product.quantityAvailable !== undefined && (
                    <p className="text-sm mt-1">
                      {product.quantityAvailable > 0 ? `In stock: ${product.quantityAvailable}` : "Out of stock"}
                    </p>
                  )}

                  <button
                    onClick={(e) => addToCart(e, product.postId, product.name)}
                    className={`mt-4 w-full py-2 rounded-lg text-sm font-medium
                              ${
                                cart.includes(product.postId)
                                  ? "bg-muted text-muted-foreground"
                                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
                              } 
                              transition-colors`}
                    disabled={
                      cart.includes(product.postId) ||
                      addingToCart[product.postId] ||
                      (product.quantityAvailable !== undefined && product.quantityAvailable <= 0)
                    }
                    type="button"
                  >
                    {addingToCart[product.postId] ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : cart.includes(product.postId) ? (
                      "Added to Cart"
                    ) : product.quantityAvailable !== undefined && product.quantityAvailable <= 0 ? (
                      "Out of Stock"
                    ) : (
                      "Add to Cart"
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredProducts.length > 8 && (
          <div className="mt-8 text-center">
            <Link href={`/client-dashboard/${clientId}/products`}>
              <Button variant="outline">View All Products</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
