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
  