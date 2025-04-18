// Types
export interface CartItem {
    postId: string
    quantity: number
  }
  
  // Get cart quantities from localStorage
  export function getCartQuantities(): Record<string, number> {
    try {
      const savedCartQuantities = localStorage.getItem("cartQuantities")
      return savedCartQuantities ? JSON.parse(savedCartQuantities) : {}
    } catch (e) {
      console.error("Error getting cart quantities:", e)
      return {}
    }
  }
  
  // Set quantity for a specific product in cart
  export function setCartItemQuantity(productId: string, quantity: number): void {
    try {
      const cartQuantities = getCartQuantities()
      cartQuantities[productId] = quantity
      localStorage.setItem("cartQuantities", JSON.stringify(cartQuantities))
    } catch (e) {
      console.error("Error setting cart quantity:", e)
    }
  }
  
  // Get quantity for a specific product in cart
  export function getCartItemQuantity(productId: string): number {
    try {
      const cartQuantities = getCartQuantities()
      return cartQuantities[productId] || 1
    } catch (e) {
      console.error("Error getting cart quantity:", e)
      return 1
    }
  }
  
  // Remove a product from cart quantities
  export function removeCartItemQuantity(productId: string): void {
    try {
      const cartQuantities = getCartQuantities()
      delete cartQuantities[productId]
      localStorage.setItem("cartQuantities", JSON.stringify(cartQuantities))
    } catch (e) {
      console.error("Error removing cart quantity:", e)
    }
  }
  
  // Clear all cart quantities
  export function clearCartQuantities(): void {
    try {
      localStorage.removeItem("cartQuantities")
    } catch (e) {
      console.error("Error clearing cart quantities:", e)
    }
  }
  
  // Clear all cart data (both items and quantities)
  export async function clearEntireCart(): Promise<boolean> {
    try {
      // Clear local storage
      localStorage.removeItem("cart")
      localStorage.removeItem("cartQuantities")
  
      // Clear server-side cart if we have a token
      const token = localStorage.getItem("clientImpersonationToken")
      if (token) {
        // Make API call to clear cart on server
        const response = await fetch("https://evershinebackend-2.onrender.com/api/clearCart", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }).catch((err) => {
          console.error("Error clearing server cart:", err)
          return null
        })
  
        // If API doesn't exist or fails, we still cleared local storage
        if (response && !response.ok) {
          console.warn("Failed to clear server cart, but local cart was cleared")
        }
      }
  
      return true
    } catch (e) {
      console.error("Error clearing cart:", e)
      return false
    }
  }
  
  // Check if cart is empty
  export function isCartEmpty(): boolean {
    try {
      const savedCart = localStorage.getItem("cart")
      return !savedCart || JSON.parse(savedCart).length === 0
    } catch (e) {
      console.error("Error checking if cart is empty:", e)
      return true
    }
  }
  