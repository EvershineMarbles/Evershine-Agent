/**
 * Debug utilities for cart and wishlist
 */

// Log all localStorage data related to cart and wishlist
export function debugLocalStorage(): Record<string, any> {
    if (typeof window === "undefined") return {}
  
    try {
      const debug = {
        cart: null,
        cartQuantities: null,
        wishlist: null,
        timestamp: new Date().toISOString(),
      }
  
      try {
        const cart = localStorage.getItem("cart")
        debug.cart = cart ? JSON.parse(cart) : null
      } catch (e) {
        debug.cart = `Error parsing: ${e}`
      }
  
      try {
        const cartQuantities = localStorage.getItem("cartQuantities")
        debug.cartQuantities = cartQuantities ? JSON.parse(cartQuantities) : null
      } catch (e) {
        debug.cartQuantities = `Error parsing: ${e}`
      }
  
      try {
        const wishlist = localStorage.getItem("wishlist")
        debug.wishlist = wishlist ? JSON.parse(wishlist) : null
      } catch (e) {
        debug.wishlist = `Error parsing: ${e}`
      }
  
      console.log("LocalStorage Debug:", debug)
      return debug
    } catch (e) {
      console.error("Error debugging localStorage:", e)
      return { error: e }
    }
  }
  
  // Clear all cart and wishlist data
  export function clearAllLocalStorage(): void {
    if (typeof window === "undefined") return
  
    try {
      localStorage.removeItem("cart")
      localStorage.removeItem("cartQuantities")
      localStorage.removeItem("wishlist")
      console.log("All localStorage data cleared")
    } catch (e) {
      console.error("Error clearing localStorage:", e)
    }
  }
  
  // Check for inconsistencies in cart data
  export function checkCartConsistency(): { isConsistent: boolean; issues: string[] } {
    if (typeof window === "undefined") return { isConsistent: true, issues: [] }
  
    try {
      const issues: string[] = []
  
      // Check cart
      const cart = localStorage.getItem("cart")
      const cartItems = cart ? JSON.parse(cart) : []
  
      // Check cart quantities
      const cartQuantities = localStorage.getItem("cartQuantities")
      const quantities = cartQuantities ? JSON.parse(cartQuantities) : {}
  
      // Check for items in cart but not in quantities
      for (const itemId of cartItems) {
        if (quantities[itemId] === undefined) {
          issues.push(`Item ${itemId} is in cart but has no quantity`)
        }
      }
  
      // Check for quantities with no corresponding cart item
      for (const itemId in quantities) {
        if (!cartItems.includes(itemId)) {
          issues.push(`Item ${itemId} has quantity but is not in cart`)
        }
      }
  
      return {
        isConsistent: issues.length === 0,
        issues,
      }
    } catch (e) {
      console.error("Error checking cart consistency:", e)
      return {
        isConsistent: false,
        issues: [`Error checking consistency: ${e}`],
      }
    }
  }
  