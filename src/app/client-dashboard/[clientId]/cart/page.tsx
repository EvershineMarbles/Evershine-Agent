"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { ArrowLeft, Trash2, Loader2, ShoppingBag } from "lucide-react"
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
  quantity?: number
}

export default function CartPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [productsMap, setProductsMap] = useState<Record<string, Product>>({})
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        setLoading(true)

        // Get cart IDs from localStorage - only run on client side
        let cartIds: string[] = []
        if (typeof window !== "undefined") {
          cartIds = JSON.parse(localStorage.getItem("cart") || "[]")
        }

        if (cartIds.length === 0) {
          setCartItems([])
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

          setProductsMap(productsById)

          // Filter products that are in the cart
          const items = cartIds.map((id) => productsById[id]).filter(Boolean) // Remove undefined items

          // Initialize quantities
          const initialQuantities: Record<string, number> = {}
          items.forEach((item) => {
            initialQuantities[item.postId] = 1
          })

          setQuantities(initialQuantities)
          setCartItems(items)
        }
      } catch (error) {
        console.error("Error fetching cart items:", error)
        toast.error("Failed to load cart items")
      } finally {
        setLoading(false)
      }
    }

    fetchCartItems()
  }, [])

  const removeFromCart = (productId: string) => {
    // Update localStorage - only on client side
    if (typeof window !== "undefined") {
      const cartIds = JSON.parse(localStorage.getItem("cart") || "[]") as string[]
      const updatedCart = cartIds.filter((id) => id !== productId)
      localStorage.setItem("cart", JSON.stringify(updatedCart))
    }

    // Update state
    setCartItems((prev) => prev.filter((item) => item.postId !== productId))

    toast.success("Item removed from cart")
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    setQuantities((prev) => ({
      ...prev,
      [productId]: newQuantity,
    }))
  }

  const calculateSubtotal = (productId: string) => {
    const product = productsMap[productId]
    const quantity = quantities[productId] || 1
    return product.price * quantity
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + calculateSubtotal(item.postId)
    }, 0)
  }

  const handleCheckout = async () => {
    try {
      setCheckoutLoading(true)

      // Simulate API call with delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Clear cart - only on client side
      if (typeof window !== "undefined") {
        localStorage.setItem("cart", "[]")
      }

      toast.success("Order placed successfully!")

      // Redirect to success page or home
      router.push("/checkout-success")
    } catch (error) {
      console.error("Error during checkout:", error)
      toast.error("Checkout failed. Please try again.")
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-[#194a95]" />
      </div>
    )
  }

  if (cartItems.length === 0) {
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
            <ShoppingBag className="h-24 w-24 text-gray-300 mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your cart is empty</h2>
            <p className="text-gray-500 mb-8 text-center max-w-md">
              Looks like you haven&apos;t added any products to your cart yet.
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

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.postId} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative h-48 sm:h-auto sm:w-48 flex-shrink-0">
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

                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex justify-between">
                        <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                        <button
                          onClick={() => removeFromCart(item.postId)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>

                      <p className="text-gray-600 mt-1">Rs. {item.price}/per sqft</p>

                      <div className="mt-4 flex items-center">
                        <span className="text-gray-700 mr-4">Quantity:</span>
                        <div className="flex items-center border border-gray-300 rounded-md">
                          <button
                            className="px-3 py-1 border-r border-gray-300 hover:bg-gray-100"
                            onClick={() => updateQuantity(item.postId, (quantities[item.postId] || 1) - 1)}
                          >
                            -
                          </button>
                          <span className="px-4 py-1">{quantities[item.postId] || 1}</span>
                          <button
                            className="px-3 py-1 border-l border-gray-300 hover:bg-gray-100"
                            onClick={() => updateQuantity(item.postId, (quantities[item.postId] || 1) + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="mt-auto pt-4 flex justify-end">
                        <p className="font-bold text-lg">Rs. {calculateSubtotal(item.postId)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">Rs. {calculateTotal()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">Rs. 500</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (18%)</span>
                  <span className="font-medium">Rs. {Math.round(calculateTotal() * 0.18)}</span>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-lg font-bold">
                      Rs. {calculateTotal() + 500 + Math.round(calculateTotal() * 0.18)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="w-full py-3 px-4 bg-[#194a95] text-white rounded-lg hover:bg-[#0f3a7a] transition-colors
                           disabled:opacity-70 disabled:cursor-not-allowed mt-6 flex items-center justify-center"
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    "Proceed to Checkout"
                  )}
                </button>

                <Link href="/">
                  <button
                    className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg
                                   hover:bg-gray-50 transition-colors mt-3 text-center"
                  >
                    Continue Shopping
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

