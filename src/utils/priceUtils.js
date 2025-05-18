/**
 * Utility functions for handling product pricing
 */

/**
 * Fetches the current price for a specific product
 * @param {string} productId - The product ID to fetch price for
 * @returns {Promise<{success: boolean, price: number, basePrice: number}>}
 */
export const fetchProductPrice = async (productId) => {
    try {
      const token = localStorage.getItem("clientImpersonationToken")
      if (!token) {
        return { success: false, error: "No authentication token found" }
      }
  
      const response = await fetch(`https://evershinebackend-2.onrender.com/api/getProductPrice/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
  
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }
  
      const data = await response.json()
  
      if (data.success) {
        return {
          success: true,
          price: data.price,
          basePrice: data.basePrice,
        }
      } else {
        return { success: false, error: data.message || "Failed to fetch price" }
      }
    } catch (error) {
      console.error("Error fetching product price:", error)
      return { success: false, error: error.message }
    }
  }
  
  /**
   * Fetches prices for multiple products at once
   * @param {string[]} productIds - Array of product IDs to fetch prices for
   * @returns {Promise<{success: boolean, prices: Record<string, {price: number, basePrice: number}>}>}
   */
  export const fetchMultipleProductPrices = async (productIds) => {
    try {
      const token = localStorage.getItem("clientImpersonationToken")
      if (!token) {
        return { success: false, error: "No authentication token found" }
      }
  
      const response = await fetch(`https://evershinebackend-2.onrender.com/api/getBulkProductPrices`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productIds }),
      })
  
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }
  
      const data = await response.json()
  
      if (data.success) {
        return {
          success: true,
          prices: data.prices,
        }
      } else {
        return { success: false, error: data.message || "Failed to fetch prices" }
      }
    } catch (error) {
      console.error("Error fetching multiple product prices:", error)
      return { success: false, error: error.message }
    }
  }
  