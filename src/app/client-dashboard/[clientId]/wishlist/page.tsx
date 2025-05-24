"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { useSession } from "next-auth/react"
import { FaHeart, FaShoppingCart } from "react-icons/fa"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

interface Product {
  _id: string
  name: string
  price: number
  basePrice: number
  images: string[]
  description: string
  category: string
  stockQuantity: number
}

interface Client {
  _id: string
  name: string
  address: string
  phone: string
}

const ClientDashboard = () => {
  const router = useRouter()
  const { clientId } = useParams()
  const { data: session } = useSession()

  const [client, setClient] = useState<Client | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [wishlist, setWishlist] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [clientLoading, setClientLoading] = useState(true)
  const [wishlistLoading, setWishlistLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    const fetchClient = async () => {
      setClientLoading(true)
      try {
        const response = await fetch(`/api/clients/${clientId}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setClient(data)
      } catch (error) {
        console.error("Failed to fetch client:", error)
        toast.error("Failed to fetch client")
      } finally {
        setClientLoading(false)
      }
    }

    fetchClient()
  }, [clientId])

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/products")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setProducts(data)
        setFilteredProducts(data)
        const uniqueCategories = ["All", ...new Set(data.map((product: Product) => product.category))]
        setCategories(uniqueCategories)
      } catch (error) {
        console.error("Failed to fetch products:", error)
        toast.error("Failed to fetch products")
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  useEffect(() => {
    const fetchWishlist = async () => {
      setWishlistLoading(true)
      try {
        if (!session?.user?.email) {
          console.warn("Session not found")
          return
        }
        const response = await fetch(`/api/wishlist?email=${session?.user?.email}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setWishlist(data.map((item: any) => item.productId))
      } catch (error) {
        console.error("Failed to fetch wishlist:", error)
        toast.error("Failed to fetch wishlist")
      } finally {
        setWishlistLoading(false)
      }
    }

    if (session?.user?.email) {
      fetchWishlist()
    }
  }, [session?.user?.email])

  useEffect(() => {
    let results = products

    if (searchTerm) {
      results = results.filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    if (categoryFilter !== "All") {
      results = results.filter((product) => product.category === categoryFilter)
    }

    setFilteredProducts(results)
  }, [searchTerm, categoryFilter, products])

  const toggleWishlist = async (productId: string, product: Product) => {
    if (!session?.user?.email) {
      toast.error("Please sign in to add to wishlist")
      return
    }

    const inWishlist = wishlist.includes(productId)

    try {
      const response = await fetch("/api/wishlist", {
        method: inWishlist ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          price: product.price, // Use direct price instead of calculateAdjustedPrice(product)
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (inWishlist) {
        setWishlist(wishlist.filter((id) => id !== productId))
        toast.success("Removed from wishlist")
      } else {
        setWishlist([...wishlist, productId])
        toast.success("Added to wishlist")
      }
    } catch (error) {
      console.error("Failed to update wishlist:", error)
      toast.error("Failed to update wishlist")
    }
  }

  const addToCart = async (productId: string, product: Product) => {
    if (!session?.user?.email) {
      toast.error("Please sign in to add to cart")
      return
    }

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          price: product.price, // Use direct price instead of calculateAdjustedPrice(product)
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      toast.success("Added to cart")
    } catch (error) {
      console.error("Failed to add to cart:", error)
      toast.error("Failed to add to cart")
    }
  }

  if (clientLoading) {
    return (
      <div className="container mx-auto p-4">
        <Skeleton className="h-10 w-40 mb-4" />
        <Skeleton className="h-6 w-64 mb-2" />
        <Skeleton className="h-6 w-64 mb-2" />
        <Skeleton className="h-6 w-64 mb-2" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-red-500">Client not found.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Client Dashboard</h1>
      <div>
        <p>
          Client Name: <span className="font-semibold">{client.name}</span>
        </p>
        <p>
          Address: <span className="font-semibold">{client.address}</span>
        </p>
        <p>
          Phone: <span className="font-semibold">{client.phone}</span>
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between mt-6 gap-4">
        <Input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
        {loading ? (
          <>
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="group relative bg-card rounded-lg overflow-hidden border border-border hover:border-primary transition-all hover:shadow-md cursor-pointer"
                >
                  <Skeleton className="h-40 w-full" />
                  <div className="p-4">
                    <Skeleton className="h-8 w-3/4 mb-2" />
                    <Skeleton className="h-6 w-1/2" />
                  </div>
                </div>
              ))}
          </>
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full text-center">
            <p className="text-muted-foreground">No products found.</p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            return (
              <div
                key={product._id}
                className="group relative bg-card rounded-lg overflow-hidden border border-border hover:border-primary transition-all hover:shadow-md cursor-pointer"
              >
                <div className="relative">
                  <img
                    src={product.images[0] || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-40 object-cover rounded-t-lg"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="hover:bg-accent hover:text-accent-foreground"
                      onClick={() => toggleWishlist(product._id, product)}
                      disabled={wishlistLoading}
                    >
                      {wishlistLoading ? (
                        <svg
                          className="animate-spin h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      ) : wishlist.includes(product._id) ? (
                        <FaHeart className="text-red-500" />
                      ) : (
                        <FaHeart />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="hover:bg-accent hover:text-accent-foreground"
                      onClick={() => addToCart(product._id, product)}
                    >
                      <FaShoppingCart />
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-foreground line-clamp-1">{product.name}</h3>

                  {/* Updated price display */}
                  <div className="mt-2">
                    <p className="text-lg font-bold">₹{product.price.toLocaleString()}/sqft</p>
                    {product.basePrice && product.basePrice !== product.price && (
                      <p className="text-sm text-muted-foreground line-through">
                        ₹{product.basePrice.toLocaleString()}/sqft
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{product.description}</p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default ClientDashboard
