"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { toast } from "react-hot-toast"
import { FaShoppingCart, FaTrash, FaSync } from "react-icons/fa"
import { getWishlist, removeFromWishlist, addToCart, updateWishlistPrices } from "@/lib/api-utils"

export default function WishlistPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.clientId as string

  const [wishlistItems, setWishlistItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [consultantLevel, setConsultantLevel] = useState<string | null>(null)
  const [commissionRate, setCommissionRate] = useState<number>(0)

  useEffect(() => {
    fetchWishlist()
    // Fetch consultant level from localStorage
    const level = localStorage.getItem("consultantLevel")
    if (level) {
      setConsultantLevel(level)
      // Set commission rate based on consultant level
      if (level === "red") setCommissionRate(5)
      else if (level === "yellow") setCommissionRate(10)
      else if (level === "purple") setCommissionRate(15)
    }
  }, [clientId])

  const fetchWishlist = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getWishlist()

      if (response.success) {
        setWishlistItems(response.data.items || [])
      } else {
        setError(response.message || "Failed to fetch wishlist")
        toast.error("Failed to fetch wishlist")
      }
    } catch (err: any) {
      console.error("Error fetching wishlist:", err)
      setError(err.message || "An error occurred while fetching wishlist")
      toast.error("Failed to fetch wishlist")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      const response = await removeFromWishlist(productId)

      if (response.success) {
        setWishlistItems(wishlistItems.filter((item) => item.postId !== productId))
        toast.success("Item removed from wishlist")
      } else {
        toast.error(response.message || "Failed to remove item")
      }
    } catch (err: any) {
      console.error("Error removing from wishlist:", err)
      toast.error(err.message || "Failed to remove item")
    }
  }

  const handleAddToCart = async (productId: string) => {
    try {
      const response = await addToCart(productId)

      if (response.success) {
        toast.success("Item added to cart")
        // Optionally remove from wishlist after adding to cart
        await handleRemoveFromWishlist(productId)
      } else {
        toast.error(response.message || "Failed to add item to cart")
      }
    } catch (err: any) {
      console.error("Error adding to cart:", err)
      toast.error(err.message || "Failed to add item to cart")
    }
  }

  const handleUpdatePrices = async () => {
    try {
      setRefreshing(true)
      const response = await updateWishlistPrices(commissionRate)

      if (response.success) {
        toast.success("Wishlist prices updated")
        fetchWishlist() // Refresh the wishlist
      } else {
        toast.error(response.message || "Failed to update prices")
      }
    } catch (err: any) {
      console.error("Error updating prices:", err)
      toast.error(err.message || "Failed to update prices")
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-red-500 text-xl mb-4">Error: {error}</div>
        <button onClick={fetchWishlist} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Wishlist</h1>
        <div className="flex items-center space-x-4">
          {consultantLevel && (
            <div className="flex items-center">
              <span className="mr-2">Consultant Level:</span>
              <div
                className={`w-4 h-4 rounded-full ${
                  consultantLevel === "red"
                    ? "bg-red-500"
                    : consultantLevel === "yellow"
                      ? "bg-yellow-500"
                      : consultantLevel === "purple"
                        ? "bg-purple-500"
                        : "bg-gray-500"
                }`}
              ></div>
              <span className="ml-2">({commissionRate}% commission)</span>
            </div>
          )}
          <button
            onClick={handleUpdatePrices}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300"
          >
            {refreshing ? (
              <>
                <FaSync className="animate-spin mr-2" />
                Updating...
              </>
            ) : (
              <>
                <FaSync className="mr-2" />
                Update Prices & Refresh
              </>
            )}
          </button>
        </div>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-xl text-gray-500 mb-4">Your wishlist is empty</p>
          <Link
            href={`/client-dashboard/${clientId}/products`}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            <div key={item.postId} className="border rounded-lg overflow-hidden shadow-md">
              <div className="relative h-48 bg-gray-200">
                {item.image && item.image.length > 0 ? (
                  <Image
                    src={item.image[0] || "/placeholder.svg"}
                    alt={item.name}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                )}
              </div>

              <div className="p-4">
                <h2 className="text-lg font-semibold mb-2">{item.name}</h2>
                <p className="text-gray-600 mb-2">Category: {item.category}</p>
                <p className="text-gray-600 mb-2">
                  Application Areas:{" "}
                  {Array.isArray(item.applicationAreas) ? item.applicationAreas.join(", ") : item.applicationAreas}
                </p>
                <p className="text-xl font-bold text-blue-600 mb-4">₹{item.price.toFixed(2)}</p>

                <div className="flex justify-between">
                  <button
                    onClick={() => handleAddToCart(item.postId)}
                    className="flex items-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    <FaShoppingCart className="mr-2" />
                    Add to Cart
                  </button>

                  <button
                    onClick={() => handleRemoveFromWishlist(item.postId)}
                    className="flex items-center px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    <FaTrash className="mr-2" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
