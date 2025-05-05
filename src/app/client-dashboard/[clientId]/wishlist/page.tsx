"use client"

import { useState, useEffect } from "react"
import axios from "axios"

const WishlistPage = () => {
  const [wishlistItems, setWishlistItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [authStatus, setAuthStatus] = useState(null)

  // Get token from localStorage with better error handling - USING clientImpersonationToken
  const getToken = () => {
    try {
      // Use clientImpersonationToken instead of token
      const token = localStorage.getItem("clientImpersonationToken")
      if (!token) {
        console.error("No clientImpersonationToken found in localStorage")
        setAuthStatus("No clientImpersonationToken found")
        return null
      }
      return token
    } catch (e) {
      console.error("Error accessing localStorage:", e)
      setAuthStatus("Error accessing localStorage")
      return null
    }
  }

  useEffect(() => {
    fetchWishlist()
  }, [])

  const fetchWishlist = async () => {
    try {
      setLoading(true)
      console.log("Fetching wishlist...")

      const token = getToken()
      if (!token) {
        setError("Authentication required. Please log in again.")
        setLoading(false)
        return
      }

      // Log the token format (first few characters for security)
      console.log(`Token format check: ${token.substring(0, 10)}...`)
      setAuthStatus(`Using token starting with: ${token.substring(0, 10)}...`)

      // Make sure we're using the correct API URL
      const apiUrl = process.env.REACT_APP_API_URL || "https://evershinebackend-2.onrender.com"
      console.log(`Using API URL: ${apiUrl}`)

      const response = await axios.get(`${apiUrl}/api/getUserWishlist`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("Wishlist API response:", response.data)

      if (response.data.success) {
        const items = response.data.data.items || []
        setWishlistItems(items)

        // Log each item's details
        items.forEach((item, index) => {
          console.log(`Wishlist item ${index + 1}:`, {
            id: item.postId,
            name: item.name,
            basePrice: item.basePrice,
            adjustedPrice: item.price,
            commission: item.price - item.basePrice,
            commissionPercent: item.basePrice ? ((item.price / item.basePrice - 1) * 100).toFixed(2) + "%" : "N/A",
          })
        })
      } else {
        console.error("Failed to fetch wishlist:", response.data.message)
        setError("Failed to fetch wishlist: " + (response.data.message || "Unknown error"))
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error)

      // Provide more detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Response error data:", error.response.data)
        console.error("Response error status:", error.response.status)

        if (error.response.status === 401) {
          setError("Authentication failed. Please log in again.")
          setAuthStatus("Token rejected by server (401)")
        } else {
          setError(`Server error: ${error.response.status} - ${error.response.data?.message || "Unknown error"}`)
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request)
        setError("No response from server. Please check your internet connection.")
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Request setup error:", error.message)
        setError("Error setting up request: " + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const removeFromWishlist = async (productId) => {
    try {
      console.log(`Removing product ${productId} from wishlist...`)

      const token = getToken()
      if (!token) {
        alert("Authentication required. Please log in again.")
        return
      }

      // Make sure we're using the correct API URL
      const apiUrl = process.env.REACT_APP_API_URL || "https://evershinebackend-2.onrender.com"

      const response = await axios.delete(`${apiUrl}/api/deleteUserWishlistItem`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { productId },
      })

      console.log("Remove from wishlist response:", response.data)

      if (response.data.success) {
        console.log(`Product ${productId} removed successfully`)
        // Refresh the wishlist
        fetchWishlist()
      } else {
        console.error("Failed to remove item:", response.data.message)
        alert("Failed to remove item from wishlist: " + (response.data.message || "Unknown error"))
      }
    } catch (error) {
      console.error("Error removing item from wishlist:", error)

      if (error.response && error.response.status === 401) {
        alert("Authentication failed. Please log in again.")
      } else {
        alert("Error removing item from wishlist: " + (error.message || "Unknown error"))
      }
    }
  }

  const addToCart = async (productId) => {
    try {
      console.log(`Adding product ${productId} to cart...`)

      const token = getToken()
      if (!token) {
        alert("Authentication required. Please log in again.")
        return
      }

      // Make sure we're using the correct API URL
      const apiUrl = process.env.REACT_APP_API_URL || "https://evershinebackend-2.onrender.com"

      const response = await axios.post(
        `${apiUrl}/api/addToCart`,
        { productId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      console.log("Add to cart response:", response.data)

      if (response.data.success) {
        alert("Item added to cart")
      } else {
        alert(response.data.message || "Failed to add item to cart")
      }
    } catch (error) {
      console.error("Error adding item to cart:", error)

      if (error.response && error.response.status === 401) {
        alert("Authentication failed. Please log in again.")
      } else {
        alert("Error adding item to cart: " + (error.message || "Unknown error"))
      }
    }
  }

  const handleLogin = () => {
    // Redirect to login page - adjust this URL as needed
    window.location.href = "/login"
  }

  if (loading) {
    return <div className="text-center p-8">Loading wishlist...</div>
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-500 mb-4">{error}</div>
        {authStatus && <div className="text-sm text-gray-500 mb-4">Auth status: {authStatus}</div>}
        <button onClick={handleLogin} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
          Go to Login
        </button>
        <button onClick={fetchWishlist} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded ml-2">
          Try Again
        </button>
      </div>
    )
  }

  if (wishlistItems.length === 0) {
    return <div className="text-center p-8">Your wishlist is empty</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border text-left">Image</th>
              <th className="py-2 px-4 border text-left">Product</th>
              <th className="py-2 px-4 border text-left">Category</th>
              <th className="py-2 px-4 border text-left">Base Price</th>
              <th className="py-2 px-4 border text-left">Your Price</th>
              <th className="py-2 px-4 border text-left">Commission</th>
              <th className="py-2 px-4 border text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {wishlistItems.map((item) => {
              const basePrice = item.basePrice || item.price
              const commission = item.price - basePrice
              const commissionPercent = basePrice ? ((item.price / basePrice - 1) * 100).toFixed(2) : 0

              return (
                <tr key={item.postId} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">
                    {item.image && item.image.length > 0 ? (
                      <img
                        src={item.image[0] || "/placeholder.svg"}
                        alt={item.name}
                        className="w-16 h-16 object-cover"
                        onError={(e) => {
                          console.log("Image failed to load:", item.image[0])
                          e.target.src = "https://via.placeholder.com/150"
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 flex items-center justify-center">
                        <span className="text-xs text-gray-500">No image</span>
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-4 border">{item.name}</td>
                  <td className="py-2 px-4 border">{item.category}</td>
                  <td className="py-2 px-4 border">
                    {basePrice !== item.price ? (
                      <span className="line-through">${basePrice.toFixed(2)}</span>
                    ) : (
                      <span>${basePrice.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="py-2 px-4 border font-bold">${item.price.toFixed(2)}</td>
                  <td className="py-2 px-4 border">
                    {commission > 0 ? (
                      <span className="text-green-600">
                        +${commission.toFixed(2)} ({commissionPercent}%)
                      </span>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                  <td className="py-2 px-4 border">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => addToCart(item.postId)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={() => removeFromWishlist(item.postId)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Debug Information</h2>
        <button
          onClick={() => console.log("Current wishlist items:", wishlistItems)}
          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
        >
          Log Wishlist Data to Console
        </button>
        <button
          onClick={() => console.log("Auth status:", authStatus)}
          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm ml-2"
        >
          Log Auth Status
        </button>
        <button
          onClick={() => console.log("Token:", localStorage.getItem("clientImpersonationToken"))}
          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm ml-2"
        >
          Check Token
        </button>
        <p className="mt-2 text-sm text-gray-600">
          Open your browser's developer console (F12) to see detailed information about your wishlist items.
        </p>
      </div>
    </div>
  )
}

export default WishlistPage
