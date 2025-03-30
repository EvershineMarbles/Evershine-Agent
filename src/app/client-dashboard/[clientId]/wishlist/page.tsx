"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { ArrowLeft, Trash2, Loader2, Heart, ShoppingCart } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "react-hot-toast"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface Product {
  _id: string
  name: string
  price: number
  image: string[]
  postId: string
  status?: "draft" | "pending" | "approved"
}

export default function WishlistPage() {
  const router = useRouter()
  const [wishlistItems, setWishlistItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<string[]>([])

  useEffect(() => {
    const fetchWishlistItems = async () => {
      try {
        setLoading(true)

        // Get wishlist IDs from localStorage - only run on client side
        let wishlistIds: string[] = []
        let cartIds: string[] = []

        if (typeof window !== "undefined") {
          wishlistIds = JSON.parse(localStorage.getItem("wishlist") || "[]")
          cartIds = JSON.parse(localStorage.getItem("cart") || "[]")
        }

        setCart(cartIds)

        if (wishlistIds.length === 0) {
          setWishlistItems([])
          setLoading(false)
          return
        }

        // Fetch all products
        const response = await axios.get(`${API_URL}/api/getAllProducts`)

        if (response.data.success) {
          const allProducts = response.data.data

          // Create a map of products by postId for easy lookup
          const productsById: Record<string, Product> = {}
          allProducts.forEach((product: Product) => {
            productsById[product.postId] = product
          })

          // Filter products that are in the wishlist
          const items = wishlistIds.map((id) => productsById[id]).filter(Boolean) // Remove undefined items

          setWishlistItems(items)
        }
      } catch (error) {
        console.error("Error fetching wishlist items:", error)
        toast.error("Failed to load wishlist items")
      } finally {
        setLoading(false)
      }
    }

    fetchWishlistItems()
  }, [])

  const removeFromWishlist = (productId: string) => {
    // Update localStorage - only on client side
    if (typeof window !== "undefined") {
      const wishlistIds = JSON.parse(localStorage.getItem("wishlist") || "[]") as string[]
      const updatedWishlist = wishlistIds.filter((id) => id !== productId)
      localStorage.setItem("wishlist", JSON.stringify(updatedWishlist))
    }

    // Update state
    setWishlistItems((prev) => prev.filter((item) => item.postId !== productId))

    toast.success("Item removed from wishlist")
  }

  const addToCart = (productId: string, productName: string) => {
    // Update localStorage - only on client side
    if (typeof window !== "undefined") {
      const cartIds = JSON.parse(localStorage.getItem("cart") || "[]") as string[]

      if (!cartIds.includes(productId)) {
        const updatedCart = [...cartIds, productId]
        localStorage.setItem("cart", JSON.stringify(updatedCart))
        setCart(updatedCart)
        toast.success(`${productName} added to cart`)
      } else {
        toast.error("Product already in cart")
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-[#194a95]" />
      </div>
    )
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-6 w-6 mr-2" />
              Back
            </button>
          </div>

          <div className="flex flex-col items-center justify-center py-16">
            <Heart className="h-24 w-24 text-gray-300 mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-8 text-center max-w-md">
              Save items you like to your wishlist and they'll appear here.
            </p>
            <Link href="/">
              <button className="px-6 py-3 bg-[#194a95] text-white rounded-lg hover:bg-[#0f3a7a] transition-colors">
                Browse Products
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-6 w-6 mr-2" />
            Back
          </button>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Wishlist</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((item) => (
            <div key={item.postId} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="relative aspect-square">
                <Image
                  src={item.image[0] || "/placeholder.svg"}
                  alt={item.name}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg"
                  }}
                />
              </div>

              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">{item.name}</h3>
                  <button
                    onClick={() => removeFromWishlist(item.postId)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                <p className="text-gray-600 mt-1">Rs. {item.price}/per sqft</p>

                <button
                  onClick={() => addToCart(item.postId, item.name)}
                  className={`mt-4 w-full py-2 px-3 rounded-lg text-sm font-medium
                            ${
                              cart.includes(item.postId)
                                ? "bg-gray-100 text-gray-800 cursor-not-allowed"
                                : "bg-[#194a95] text-white hover:bg-[#0f3a7a]"
                            } 
                            transition-colors`}
                  disabled={cart.includes(item.postId)}
                >
                  {cart.includes(item.postId) ? (
                    "Added to Cart"
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 inline-block mr-1" />
                      Add to Cart
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

