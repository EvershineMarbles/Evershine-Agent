export interface WishlistItem {
    _id: string
    postId: string
    name: string
    price: number
    image: string[]
    category: string
    description?: string
    quantityAvailable?: number
  }
  
  // Base API URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"
  
  /**
   * Get the authentication token
   */
  const getToken = (): string | null => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("clientImpersonationToken")
  }
  
  /**
   * Fetch the wishlist from the API
   */
  export const fetchWishlist = async (): Promise<WishlistItem[]> => {
    try {
      const token = getToken()
      if (!token) {
        console.warn("No authentication token found")
        return getLocalWishlist()
      }
  
      console.log("Fetching wishlist from API...")
      const response = await fetch(`${API_URL}/api/getUserWishlist`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
  
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }
  
      const data = await response.json()
      console.log("Wishlist API response:", data)
  
      if (data.success && data.data && Array.isArray(data.data.items)) {
        // Store the wishlist IDs in local storage for backup
        const wishlistIds = data.data.items.map((item: WishlistItem) => item.postId)
        localStorage.setItem("wishlist", JSON.stringify(wishlistIds))
  
        return data.data.items
      } else {
        console.warn("Invalid API response format, falling back to local storage")
        return getLocalWishlist()
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error)
      return getLocalWishlist()
    }
  }
  
  /**
   * Get wishlist from local storage
   */
  export const getLocalWishlist = (): WishlistItem[] => {
    try {
      const savedWishlist = localStorage.getItem("wishlist")
      if (!savedWishlist) return []
  
      const wishlistIds = JSON.parse(savedWishlist)
      if (!Array.isArray(wishlistIds)) return []
  
      // Create placeholder items for local storage IDs
      return wishlistIds.map((id: string) => ({
        _id: id,
        postId: id,
        name: "Product (Local)",
        price: 0,
        image: [],
        category: "Unknown",
      }))
    } catch (error) {
      console.error("Error getting local wishlist:", error)
      return []
    }
  }
  
  /**
   * Add an item to the wishlist
   */
  export const addToWishlist = async (productId: string): Promise<boolean> => {
    try {
      const token = getToken()
      if (!token) {
        // Fall back to local storage
        addToLocalWishlist(productId)
        return true
      }
  
      console.log(`Adding product ${productId} to wishlist...`)
      const response = await fetch(`${API_URL}/api/addToWishlist`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      })
  
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }
  
      const data = await response.json()
  
      if (data.success) {
        // Update local storage as well
        addToLocalWishlist(productId)
        return true
      } else {
        throw new Error(data.message || "Failed to add to wishlist")
      }
    } catch (error) {
      console.error("Error adding to wishlist:", error)
      // Still add to local storage as fallback
      addToLocalWishlist(productId)
      return false
    }
  }
  
  /**
   * Remove an item from the wishlist
   */
  export const removeFromWishlist = async (productId: string): Promise<boolean> => {
    try {
      const token = getToken()
      if (!token) {
        // Fall back to local storage
        removeFromLocalWishlist(productId)
        return true
      }
  
      console.log(`Removing product ${productId} from wishlist...`)
  
      // First, try to remove from local storage to ensure UI consistency
      removeFromLocalWishlist(productId)
  
      const response = await fetch(`${API_URL}/api/deleteUserWishlistItem`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      })
  
      // Log the full response for debugging
      const responseText = await response.text()
      console.log(`API response (${response.status}):`, responseText)
  
      // Try to parse the response as JSON if possible
      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.warn("Could not parse response as JSON:", e)
      }
  
      if (!response.ok) {
        // Even if the API call fails, we've already removed it from local storage
        // so the UI will be consistent
        console.warn(`API error: ${response.status}, but item removed from local storage`)
        return true
      }
  
      return true
    } catch (error) {
      console.error("Error removing from wishlist:", error)
      // Still remove from local storage as fallback
      removeFromLocalWishlist(productId)
      return true
    }
  }
  
  /**
   * Add an item to the local wishlist
   */
  const addToLocalWishlist = (productId: string): void => {
    try {
      const savedWishlist = localStorage.getItem("wishlist")
      const wishlistIds = savedWishlist ? JSON.parse(savedWishlist) : []
  
      if (!wishlistIds.includes(productId)) {
        wishlistIds.push(productId)
        localStorage.setItem("wishlist", JSON.stringify(wishlistIds))
      }
    } catch (error) {
      console.error("Error adding to local wishlist:", error)
    }
  }
  
  /**
   * Remove an item from the local wishlist
   */
  const removeFromLocalWishlist = (productId: string): void => {
    try {
      const savedWishlist = localStorage.getItem("wishlist")
      if (!savedWishlist) return
  
      const wishlistIds = JSON.parse(savedWishlist)
      const updatedWishlist = wishlistIds.filter((id: string) => id !== productId)
      localStorage.setItem("wishlist", JSON.stringify(updatedWishlist))
    } catch (error) {
      console.error("Error removing from local wishlist:", error)
    }
  }
  
  /**
   * Check if an item is in the wishlist
   */
  export const isInWishlist = (productId: string): boolean => {
    try {
      const savedWishlist = localStorage.getItem("wishlist")
      if (!savedWishlist) return false
  
      const wishlistIds = JSON.parse(savedWishlist)
      return wishlistIds.includes(productId)
    } catch (error) {
      console.error("Error checking wishlist:", error)
      return false
    }
  }
  
  /**
   * Fetch product details for wishlist items
   */
  export const fetchProductDetails = async (productIds: string[]): Promise<WishlistItem[]> => {
    if (!productIds.length) return []
  
    try {
      // Fetch all products
      const response = await fetch(`${API_URL}/api/getAllProducts`)
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }
  
      const data = await response.json()
      if (!data.success || !Array.isArray(data.data)) {
        throw new Error("Invalid API response format")
      }
  
      // Filter products by ID
      const products = data.data.filter((product: any) => productIds.includes(product.postId))
  
      return products.map((product: any) => ({
        _id: product._id,
        postId: product.postId,
        name: product.name,
        price: product.price,
        image: product.image || [],
        category: product.category,
        description: product.description,
        quantityAvailable: product.quantityAvailable,
      }))
    } catch (error) {
      console.error("Error fetching product details:", error)
      return []
    }
  }
  