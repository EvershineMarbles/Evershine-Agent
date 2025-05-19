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
  
  // IMPROVED: More aggressive cart clearing function with multiple approaches
  export async function clearEntireCart(): Promise<boolean> {
    console.log("=== STARTING AGGRESSIVE CART CLEARING ===")
  
    try {
      // Clear local storage first
      localStorage.removeItem("cart")
      localStorage.removeItem("cartQuantities")
      console.log("Cleared localStorage cart data")
  
      // Get the token
      const token = localStorage.getItem("clientImpersonationToken")
      if (!token) {
        console.log("No authentication token found, only cleared local storage")
        return true
      }
  
      // APPROACH 1: Try to get current cart to identify items
      console.log("APPROACH 1: Removing items individually")
      try {
        const cartResponse = await fetch("https://evershinebackend-2.onrender.com/api/getUserCart", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
  
        if (cartResponse.ok) {
          const cartData = await cartResponse.json()
          const items = cartData.data?.items || []
          console.log(`Found ${items.length} items to remove`)
  
          // Remove each item with multiple retries
          for (const item of items) {
            if (!item.postId) continue
  
            // Try up to 3 times to remove each item
            for (let attempt = 1; attempt <= 3; attempt++) {
              try {
                console.log(`Removing item ${item.postId} (Attempt ${attempt})`)
                const removeResponse = await fetch("https://evershinebackend-2.onrender.com/api/deleteUserCartItem", {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ productId: item.postId }),
                })
  
                if (removeResponse.ok) {
                  console.log(`Successfully removed item ${item.postId}`)
                  break // Success, exit retry loop
                } else {
                  console.log(`Failed to remove item ${item.postId} on attempt ${attempt}: ${removeResponse.status}`)
                  if (attempt === 3) {
                    console.log(`All attempts failed for item ${item.postId}`)
                  }
                }
              } catch (e) {
                console.error(`Error on attempt ${attempt} for item ${item.postId}:`, e)
              }
  
              // Wait before retry
              if (attempt < 3) {
                await new Promise((resolve) => setTimeout(resolve, 500))
              }
            }
          }
        } else {
          console.log(`Failed to fetch cart: ${cartResponse.status}`)
        }
      } catch (e) {
        console.error("Error in approach 1:", e)
      }
  
      // APPROACH 2: Try to create a new empty cart (if API supports it)
      console.log("APPROACH 2: Attempting to create new empty cart")
      try {
        const createEmptyCartResponse = await fetch("https://evershinebackend-2.onrender.com/api/createEmptyCart", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }).catch(() => null)
  
        if (createEmptyCartResponse?.ok) {
          console.log("Successfully created new empty cart")
        } else {
          console.log("Create empty cart endpoint not available or failed")
        }
      } catch (e) {
        console.error("Error in approach 2:", e)
      }
  
      // APPROACH 3: Try to reset cart (if API supports it)
      console.log("APPROACH 3: Attempting to reset cart")
      try {
        const resetCartResponse = await fetch("https://evershinebackend-2.onrender.com/api/resetCart", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }).catch(() => null)
  
        if (resetCartResponse?.ok) {
          console.log("Successfully reset cart")
        } else {
          console.log("Reset cart endpoint not available or failed")
        }
      } catch (e) {
        console.error("Error in approach 3:", e)
      }
  
      // APPROACH 4: Try to update cart with empty items array (if API supports it)
      console.log("APPROACH 4: Attempting to update cart with empty items")
      try {
        const updateCartResponse = await fetch("https://evershinebackend-2.onrender.com/api/updateCart", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ items: [] }),
        }).catch(() => null)
  
        if (updateCartResponse?.ok) {
          console.log("Successfully updated cart with empty items")
        } else {
          console.log("Update cart endpoint not available or failed")
        }
      } catch (e) {
        console.error("Error in approach 4:", e)
      }
  
      // Verify the cart is now empty
      console.log("Verifying cart status after clearing attempts")
      try {
        const verifyResponse = await fetch("https://evershinebackend-2.onrender.com/api/getUserCart", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
  
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json()
          const remainingItems = verifyData.data?.items || []
  
          if (remainingItems.length > 0) {
            console.log(`WARNING: ${remainingItems.length} items still in cart after all clearing attempts`)
          } else {
            console.log("SUCCESS: Cart is now empty on server")
          }
        } else {
          console.log(`Failed to verify cart: ${verifyResponse.status}`)
        }
      } catch (e) {
        console.error("Error verifying cart:", e)
      }
  
      console.log("=== AGGRESSIVE CART CLEARING COMPLETE ===")
      return true
    } catch (e) {
      console.error("Error in clearEntireCart:", e)
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
  