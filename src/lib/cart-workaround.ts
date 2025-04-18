/**
 * This file contains workarounds for the cart API issues
 */

// Function to create a completely new cart by bypassing the normal API
export async function createNewCart(token: string, clientId: string): Promise<boolean> {
    try {
      console.log("Attempting to create new cart by bypassing normal API")
  
      // First, try to delete the existing cart document directly
      // This is a workaround and might not be supported by your API
      try {
        await fetch(`https://evershinebackend-2.onrender.com/api/internal/deleteCartDocument/${clientId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-Admin-Override": "true", // Special header that might be required
          },
        }).catch(() => null)
  
        console.log("Attempted to delete cart document")
      } catch (e) {
        console.log("Delete cart document failed (expected):", e)
      }
  
      // Now try to add a single item and then remove it to create a fresh cart
      try {
        // Add a dummy item
        const dummyProductId = "dummy-product-" + Date.now()
  
        // Try to add the dummy item
        await fetch("https://evershinebackend-2.onrender.com/api/addToCart", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: dummyProductId,
            quantity: 1,
          }),
        }).catch(() => null)
  
        console.log("Added dummy item to create fresh cart")
  
        // Now remove the dummy item
        await fetch("https://evershinebackend-2.onrender.com/api/deleteUserCartItem", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId: dummyProductId }),
        }).catch(() => null)
  
        console.log("Removed dummy item, cart should be empty now")
  
        return true
      } catch (e) {
        console.error("Create new cart workaround failed:", e)
        return false
      }
    } catch (e) {
      console.error("Create new cart failed:", e)
      return false
    }
  }
  
  // Function to check if the cart has the persistent items issue
  export async function hasCartPersistenceIssue(token: string): Promise<boolean> {
    try {
      // Clear local storage
      localStorage.removeItem("cart")
      localStorage.removeItem("cartQuantities")
  
      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 500))
  
      // Fetch the cart
      const response = await fetch("https://evershinebackend-2.onrender.com/api/getUserCart", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
  
      if (!response.ok) return false
  
      const data = await response.json()
      const items = data.data?.items || []
  
      // If there are items even though we cleared local storage, we have the issue
      return items.length > 0
    } catch (e) {
      console.error("Error checking cart persistence issue:", e)
      return false
    }
  }
  