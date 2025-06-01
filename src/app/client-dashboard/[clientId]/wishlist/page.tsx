"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Trash2, Loader2, Heart, ShoppingCart, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import axios from "axios"

interface WishlistItem {
  _id: string
  postId: string
  name: string
  price: number
  basePrice?: number
  updatedPrice?: number // Backend calculated price
  image: string[]
  category: string
  customQuantity?: number
  customFinish?: string
  customThickness?: string
  commissionInfo?: {
    currentAgentCommission: number
    consultantLevelCommission: number
    totalCommission: number
    consultantLevel: string
  }
}

export default function WishlistPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const clientId = params.clientId as string

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<Record<string, { removing: boolean; addingToCart: boolean }>>({})
  const [cartCount, setCartCount] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [editingCustomFields, setEditingCustomFields] = useState<
    Record<
      string,
      {
        customQuantity?: number
        customFinish?: string
        customThickness?: string
      }
    >
  >({})

  const finishOptions = ["Polish", "Leather", "Flute", "River", "Satin", "Dual"]

  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"
  }

  const getToken = () => {
    try {
      const token = localStorage.getItem("clientImpersonationToken") || localStorage.getItem("token")
      if (!token) {
        setError("No authentication token found. Please log in again.")
        return null
      }
      return token
    } catch (e) {
      setError("Error accessing authentication. Please refresh the page.")
      return null
    }
  }

  const fetchWishlist = async () => {
    try {
      setLoading(true)

      const token = getToken()
      if (!token) {
        setLoading(false)
        return
      }

      const apiUrl = getApiUrl()

      // Use client-specific wishlist endpoint
      const response = await axios.get(`${apiUrl}/api/getUserWishlist`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data.success) {
        const items = response.data.data.items || []
        setWishlistItems(items)

        const initialState: Record<string, { removing: boolean; addingToCart: boolean }> = {}
        const initialQuantities: Record<string, number> = {}

        items.forEach((item: WishlistItem) => {
          const itemId = item.postId || item._id
          initialState[itemId] = { removing: false, addingToCart: false }
          initialQuantities[itemId] = item.customQuantity || 1000
        })

        setActionLoading(initialState)
        setQuantities(initialQuantities)
      } else {
        setError("Failed to fetch wishlist: " + (response.data.message || "Unknown error"))
      }
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        setError("Authentication failed. Please log in again.")
      } else {
        setError("Error loading wishlist. Please try again.")
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchCartCount = async () => {
    try {
      const token = getToken()
      if (!token) return

      const apiUrl = getApiUrl()

      const response = await axios.get(`${apiUrl}/api/getUserCart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data.success && response.data.data && Array.isArray(response.data.data.items)) {
        setCartCount(response.data.data.items.length)
      }
    } catch (error) {
      // Silently fail for cart count
    }
  }

  useEffect(() => {
    fetchWishlist()
    fetchCartCount()
  }, [])

  const handleQuantityChange = (itemId: string, value: string) => {
    const numValue = Number.parseInt(value)

    if (!isNaN(numValue) && numValue > 0) {
      setQuantities((prev) => ({
        ...prev,
        [itemId]: numValue,
      }))
    }
  }

  const removeFromWishlist = async (productId: string) => {
    try {
      setActionLoading((prev) => ({
        ...prev,
        [productId]: { ...prev[productId], removing: true },
      }))

      const token = getToken()
      if (!token) return

      const apiUrl = getApiUrl()

      const response = await axios.delete(`${apiUrl}/api/deleteUserWishlistItem`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { productId },
      })

      if (response.data.success) {
        setWishlistItems((prev) => prev.filter((item) => (item.postId || item._id) !== productId))

        toast({
          title: "Item removed",
          description: "Item has been removed from your wishlist",
        })
      } else {
        toast({
          title: "Failed to remove item",
          description: response.data.message || "Unknown error",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        toast({
          title: "Authentication failed",
          description: "Please log in again to continue.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to remove item from wishlist",
          variant: "destructive",
        })
      }
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [productId]: { ...prev[productId], removing: false },
      }))
    }
  }

  const handleCustomFieldChange = (itemId: string, field: string, value: string | number) => {
    setEditingCustomFields((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }))

    // Sync main quantity field when custom quantity changes
    if (field === "customQuantity" && typeof value === "number" && value > 0) {
      setQuantities((prev) => ({
        ...prev,
        [itemId]: value,
      }))
    }
  }

  const saveCustomFields = async (productId: string) => {
    try {
      const token = getToken()
      if (!token) return

      const apiUrl = getApiUrl()
      const customFields = editingCustomFields[productId]

      if (!customFields) return

      const response = await axios.put(
        `${apiUrl}/api/updateWishlistItem`,
        {
          productId,
          customQuantity: customFields.customQuantity,
          customFinish: customFields.customFinish,
          customThickness: customFields.customThickness,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.data.success) {
        setWishlistItems((prev) =>
          prev.map((item) => {
            const itemId = item.postId || item._id
            if (itemId === productId) {
              return {
                ...item,
                customQuantity: customFields.customQuantity,
                customFinish: customFields.customFinish,
                customThickness: customFields.customThickness,
              }
            }
            return item
          }),
        )

        // Sync the main quantity field with custom quantity
        if (customFields.customQuantity) {
          setQuantities((prev) => ({
            ...prev,
            [productId]: customFields.customQuantity,
          }))
        }

        setEditingCustomFields((prev) => {
          const newState = { ...prev }
          delete newState[productId]
          return newState
        })

        toast({
          title: "Custom fields updated",
          description: "Your custom specifications have been saved and quantity synced",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update custom fields",
        variant: "destructive",
      })
    }
  }

  const addToCart = async (productId: string) => {
    try {
      setActionLoading((prev) => ({
        ...prev,
        [productId]: { ...prev[productId], addingToCart: true },
      }))

      const token = getToken()
      if (!token) return

      const apiUrl = getApiUrl()
      const quantity = quantities[productId] || 1000
      const item = wishlistItems.find((item) => (item.postId || item._id) === productId)

      if (!item) {
        toast({
          title: "Error",
          description: "Product not found in wishlist",
          variant: "destructive",
        })
        return
      }

      const customFields = editingCustomFields[productId] || {
        customQuantity: item?.customQuantity,
        customFinish: item?.customFinish,
        customThickness: item?.customThickness,
      }

      // Prepare the request payload - match the expected format
      const requestPayload = {
        productId: productId,
        quantity: quantity,
        ...(customFields.customQuantity && { customQuantity: customFields.customQuantity }),
        ...(customFields.customFinish && { customFinish: customFields.customFinish }),
        ...(customFields.customThickness && { customThickness: customFields.customThickness }),
      }

      console.log("Adding to cart with payload:", requestPayload)

      // Add to cart - let backend calculate price
      const response = await axios.post(`${apiUrl}/api/addToCart`, requestPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 second timeout
      })

      console.log("Add to cart response:", response.data)

      if (response.data.success) {
        // Only remove from wishlist if add to cart was successful
        try {
          await axios.delete(`${apiUrl}/api/deleteUserWishlistItem`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            data: { productId },
            timeout: 5000,
          })
        } catch (deleteError) {
          console.warn("Failed to remove from wishlist after adding to cart:", deleteError)
          // Don't fail the entire operation if wishlist removal fails
        }

        // Update local state
        setWishlistItems((prev) => prev.filter((item) => (item.postId || item._id) !== productId))
        setCartCount((prev) => prev + 1)

        toast({
          title: "Added to cart",
          description: `${item.name} has been added to your cart with quantity: ${quantity}`,
          action: (
            <Button variant="outline" size="sm" onClick={() => router.push(`/client-dashboard/${clientId}/cart`)}>
              View Cart
            </Button>
          ),
        })
      } else {
        toast({
          title: "Failed to add item",
          description: response.data.message || "Failed to add item to cart",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Add to cart error:", error)

      let errorMessage = "Failed to add item to cart. Please try again."

      if (error.response) {
        // Server responded with error status
        console.error("Server error response:", error.response.data)
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = "Network error. Please check your connection."
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [productId]: { ...prev[productId], addingToCart: false },
      }))
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchWishlist()
    fetchCartCount()
  }

  const handleLogin = () => {
    router.push("/agent-login")
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your wishlist...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center mb-4">
            <div className="h-6 w-6 text-red-500 mr-2" />
            <h2 className="text-xl font-semibold text-red-700">Error Loading Wishlist</h2>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button onClick={handleLogin} variant="default">
              Go to Login
            </Button>
            <Button onClick={fetchWishlist} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 md:p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-3">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl md:text-2xl font-bold">Your Wishlist</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing} className="relative">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>

          <Link
            href={`/client-dashboard/${clientId}/cart`}
            className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ShoppingCart className="h-5 w-5 text-gray-600" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-8 bg-muted/20 rounded-lg">
          <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-lg font-medium mb-2">Your wishlist is empty</p>
          <p className="text-muted-foreground mb-4">Add some products to your wishlist to see them here</p>
          <Button
            onClick={() => router.push(`/client-dashboard/${clientId}/products`)}
            className="bg-primary hover:bg-primary/90"
          >
            Browse Products
          </Button>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="p-3 bg-muted/20 border-b border-border">
            <h2 className="font-medium">Wishlist Items ({wishlistItems.length})</h2>
          </div>
          <div className="divide-y divide-border">
            {wishlistItems.map((item) => {
              const itemId = item.postId || item._id
              const displayPrice = item.updatedPrice || item.price
              const hasCommission = item.updatedPrice && item.updatedPrice !== item.price
              const originalPrice = item.basePrice || item.price
              const isEditing = editingCustomFields[itemId]
              const currentCustomFields = isEditing || {
                customQuantity: item.customQuantity,
                customFinish: item.customFinish,
                customThickness: item.customThickness,
              }

              return (
                <div key={itemId} className="p-3">
                  {/* Main Product Row - Tablet Layout */}
                  <div className="flex items-center gap-3">
                    {/* Product Image */}
                    <Link href={`/client-dashboard/${clientId}/product/${itemId}`} className="flex-shrink-0">
                      <div className="relative h-16 w-16 rounded-lg overflow-hidden border border-gray-200 hover:border-primary/30 transition-all duration-200 hover:shadow-sm cursor-pointer group">
                        <Image
                          src={
                            item.image && item.image.length > 0 ? item.image[0] : "/placeholder.svg?height=64&width=64"
                          }
                          alt={item.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                          unoptimized={true}
                        />
                      </div>
                    </Link>

                    {/* Product Details */}
                    <div className="flex-grow min-w-0">
                      <Link href={`/client-dashboard/${clientId}/product/${itemId}`} className="block group">
                        <h3 className="font-medium text-sm text-gray-900 group-hover:text-primary transition-colors duration-200 cursor-pointer line-clamp-1">
                          {item.name || "Unknown Product"}
                        </h3>
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5">{item.category || "Uncategorized"}</p>

                      {/* Price Display */}
                      <div className="mt-1">
                        {hasCommission ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="font-semibold text-sm text-green-600">
                                ₹{displayPrice.toLocaleString()}
                              </span>
                              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                                Commission ✓
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 line-through">₹{originalPrice.toLocaleString()}</p>
                          </div>
                        ) : (
                          <span className="font-semibold text-sm text-primary">₹{displayPrice.toLocaleString()}</span>
                        )}
                      </div>
                      {/* Add Specifications Button - only show if no custom specs exist */}
                      {!item.customQuantity && !item.customFinish && !item.customThickness && !isEditing && (
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setEditingCustomFields((prev) => ({
                                ...prev,
                                [itemId]: {
                                  customQuantity: undefined,
                                  customFinish: undefined,
                                  customThickness: undefined,
                                },
                              }))
                            }
                            className="h-7 text-xs px-3 text-primary border-primary/30 hover:bg-primary/10"
                          >
                            + Add Specifications
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Quantity and Actions - Right Side */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <label className="text-xs font-medium text-gray-700 whitespace-nowrap">Qty:</label>
                        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden focus-within:border-primary">
                          <Input
                            type="number"
                            min="1"
                            value={quantities[itemId] || 1000}
                            onChange={(e) => handleQuantityChange(itemId, e.target.value)}
                            className="h-8 w-16 text-center border-0 focus:ring-0 focus:border-0 text-xs"
                          />
                        </div>
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => addToCart(itemId)}
                        disabled={actionLoading[itemId]?.addingToCart}
                        className="flex items-center gap-1 px-2 py-1 h-8 text-xs"
                      >
                        {actionLoading[itemId]?.addingToCart ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <ShoppingCart className="h-3 w-3" />
                        )}
                        Add to Cart
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeFromWishlist(itemId)}
                        disabled={actionLoading[itemId]?.removing}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 h-8 w-8 flex-shrink-0"
                      >
                        {actionLoading[itemId]?.removing ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Custom Specifications - Ultra Compact */}
                  {(item.customQuantity || item.customFinish || item.customThickness || isEditing) && (
                    <div className="mt-2 bg-gray-50 rounded-md p-2 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-medium text-gray-900">Custom Specifications</h4>
                        {!isEditing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setEditingCustomFields((prev) => ({
                                ...prev,
                                [itemId]: {
                                  customQuantity: item.customQuantity,
                                  customFinish: item.customFinish,
                                  customThickness: item.customThickness,
                                },
                              }))
                            }
                            className="h-6 text-xs px-2 text-primary hover:text-primary/80"
                          >
                            Edit
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Quantity</label>
                          {isEditing ? (
                            <Input
                              type="number"
                              value={currentCustomFields.customQuantity || ""}
                              onChange={(e) =>
                                handleCustomFieldChange(itemId, "customQuantity", Number(e.target.value))
                              }
                              className="h-7 text-xs"
                              placeholder="sqft"
                            />
                          ) : (
                            <p className="text-xs font-medium text-gray-900">
                              {item.customQuantity ? `${item.customQuantity} sqft` : "Not specified"}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Finish</label>
                          {isEditing ? (
                            <select
                              value={currentCustomFields.customFinish || ""}
                              onChange={(e) => handleCustomFieldChange(itemId, "customFinish", e.target.value)}
                              className="h-7 w-full px-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary focus:border-primary"
                            >
                              <option value="">Select finish</option>
                              {finishOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <p className="text-xs font-medium text-gray-900">{item.customFinish || "Not specified"}</p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Thickness</label>
                          {isEditing ? (
                            <Input
                              type="text"
                              value={currentCustomFields.customThickness || ""}
                              onChange={(e) => handleCustomFieldChange(itemId, "customThickness", e.target.value)}
                              className="h-7 text-xs"
                              placeholder="mm"
                            />
                          ) : (
                            <p className="text-xs font-medium text-gray-900">
                              {item.customThickness ? `${item.customThickness} mm` : "Not specified"}
                            </p>
                          )}
                        </div>
                      </div>

                      {isEditing && (
                        <div className="flex gap-2 mt-2 pt-2 border-t border-gray-200">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => saveCustomFields(itemId)}
                            className="h-6 text-xs px-2"
                          >
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setEditingCustomFields((prev) => {
                                const newState = { ...prev }
                                delete newState[itemId]
                                return newState
                              })
                            }
                            className="h-6 text-xs px-2"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="p-2 bg-muted/10 border-t border-border">
            <div className="flex justify-end">
              <Link href={`/client-dashboard/${clientId}/products`} className="text-xs text-primary hover:underline">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
