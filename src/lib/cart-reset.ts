/**
 * This file contains functions to completely reset the cart
 * when normal clearing methods fail
 */

// Function to completely reset the cart using multiple approaches
export async function forceResetCart(token: string): Promise<boolean> {
    console.log("Starting force reset of cart")
    let success = false
  
    // Try to directly modify the database document if possible
    try {
      const response = await fetch("https://evershinebackend-2.onrender.com/api/forceResetCart", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }).catch(() => null)
  
      if (response?.ok) {
        console.log("Force reset cart successful")
        success = true
      }
    } catch (e) {
      console.error("Force reset cart failed:", e)
    }
  
    // If direct reset failed, try to create a new cart
    if (!success) {
      try {
        // First try to delete the cart completely
        await fetch("https://evershinebackend-2.onrender.com/api/deleteCart", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }).catch(() => null)
  
        // Then create a new empty cart
        const createResponse = await fetch("https://evershinebackend-2.onrender.com/api/createCart", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ items: [] }),
        }).catch(() => null)
  
        if (createResponse?.ok) {
          console.log("Created new empty cart")
          success = true
        }
      } catch (e) {
        console.error("Create new cart failed:", e)
      }
    }
  
    return success
  }
  
  // Function to check if the cart has been corrupted
  export async function isCartCorrupted(token: string): Promise<boolean> {
    try {
      const response = await fetch("https://evershinebackend-2.onrender.com/api/getUserCart", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
  
      if (!response.ok) return true
  
      const data = await response.json()
      const items = data.data?.items || []
  
      // Check for abnormally high quantities (likely corrupted)
      return items.some((item) => item.quantity > 100)
    } catch (e) {
      console.error("Error checking cart corruption:", e)
      return false
    }
  }
  