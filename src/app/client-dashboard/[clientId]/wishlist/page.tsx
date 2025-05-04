"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { toast } from "react-toastify"

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [agentCommission, setAgentCommission] = useState(null)

  // Get token from localStorage
  const token = localStorage.getItem("token")

  useEffect(() => {
    fetchWishlist()
    fetchAgentCommission()
  }, [])

  const fetchWishlist = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/getUserWishlist`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data.success) {
        setWishlistItems(response.data.data.items || [])
      } else {
        setError("Failed to fetch wishlist")
        toast.error("Failed to fetch wishlist")
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error)
      setError("Error fetching wishlist")
      toast.error("Error fetching wishlist")
    } finally {
      setLoading(false)
    }
  }

  const fetchAgentCommission = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/client/agent-commission`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data.success) {
        setAgentCommission(response.data.data)
      }
    } catch (error) {
      console.error("Error fetching agent commission:", error)
    }
  }

  const removeFromWishlist = async (productId) => {
    try {
      const response = await axios.delete(`${process.env.REACT_APP_API_URL}/api/deleteUserWishlistItem`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { productId },
      })

      if (response.data.success) {
        toast.success("Item removed from wishlist")
        fetchWishlist() // Refresh the wishlist
      } else {
        toast.error(response.data.message || "Failed to remove item")
      }
    } catch (error) {
      console.error("Error removing item from wishlist:", error)
      toast.error("Error removing item from wishlist")
    }
  }

  const addToCart = async (productId) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/addToCart`,
        { productId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.data.success) {
        toast.success("Item added to cart")
      } else {
        toast.error(response.data.message || "Failed to add item to cart")
      }
    } catch (error) {
      console.error("Error adding item to cart:", error)
      toast.error("Error adding item to cart")
    }
  }

  // Function to calculate commission breakdown
  const getCommissionBreakdown = (basePrice, adjustedPrice) => {
    if (!basePrice || !adjustedPrice || !agentCommission) return null

    const totalCommissionAmount = adjustedPrice - basePrice
    const totalCommissionPercent = (adjustedPrice / basePrice - 1) * 100

    return {
      basePrice: basePrice.toFixed(2),
      adjustedPrice: adjustedPrice.toFixed(2),
      commissionAmount: totalCommissionAmount.toFixed(2),
      commissionPercent: totalCommissionPercent.toFixed(1),
    }
  }

  if (loading) {
    return <div className="text-center py-10">Loading wishlist...</div>
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold mb-4">Your Wishlist</h2>
        <p>Your wishlist is empty</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Your Wishlist</h2>

      {agentCommission && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold">Your Commission Information:</h3>
          <p>Base Commission Rate: {agentCommission.commissionRate}%</p>
          {agentCommission.categoryCommissions && Object.keys(agentCommission.categoryCommissions).length > 0 && (
            <div>
              <p className="font-medium mt-2">Category-Specific Rates:</p>
              <ul className="ml-4">
                {Object.entries(agentCommission.categoryCommissions).map(([category, rate]) => (
                  <li key={category}>
                    {category}: {rate}%
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlistItems.map((item) => {
          const commissionInfo = getCommissionBreakdown(item.basePrice, item.price)

          return (
            <div key={item.postId} className="border rounded-lg overflow-hidden shadow-md">
              <div className="relative h-48 overflow-hidden">
                {item.image && item.image.length > 0 ? (
                  <img
                    src={item.image[0] || "/placeholder.svg"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">No image</span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                <p className="text-gray-600 mb-2">{item.category}</p>

                <div className="mb-3">
                  {commissionInfo ? (
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Base Price:</span>
                        <span className="line-through">${commissionInfo.basePrice}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Your Price:</span>
                        <span className="text-green-600">${commissionInfo.adjustedPrice}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Includes {commissionInfo.commissionPercent}% commission (${commissionInfo.commissionAmount})
                      </div>
                    </div>
                  ) : (
                    <div className="font-bold">${item.price.toFixed(2)}</div>
                  )}
                </div>

                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => addToCart(item.postId)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex-1"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => removeFromWishlist(item.postId)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Wishlist
