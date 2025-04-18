// Add this function to fetch wishlist items with better error handling and debugging
export async function fetchWishlistItems() {
  try {
    const token = localStorage.getItem("clientImpersonationToken")

    if (!token) {
      throw new Error("No authentication token found")
    }

    console.log("Fetching wishlist with token:", token.substring(0, 10) + "...")

    const response = await fetch("https://evershinebackend-2.onrender.com/api/getUserWishlist", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    console.log(`Wishlist API response status: ${response.status}`)

    if (!response.ok) {
      // Try to get more detailed error information
      let errorMessage = `API error: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        if (errorData && errorData.message) {
          errorMessage = errorData.message
        }
      } catch (e) {
        // If we can't parse the error as JSON, just use the status
      }

      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log("Wishlist API response data:", data)

    return data
  } catch (error) {
    console.error("Error fetching wishlist items:", error)
    throw error
  }
}

// Add this function to sync local wishlist with server
export async function syncLocalWishlistWithServer(clientId: string, localItems: any[]) {
  try {
    const token = localStorage.getItem("clientImpersonationToken")

    if (!token) {
      throw new Error("No authentication token found")
    }

    // Get server wishlist first
    const response = await fetch("https://evershinebackend-2.onrender.com/api/getUserWishlist", {
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
    const serverItems = data.data?.items || []

    // Find items in local storage that aren't on the server
    const serverItemIds = serverItems.map((item: any) => item.postId)
    const itemsToSync = localItems.filter((item) => !serverItemIds.includes(item.postId))

    // Add each missing item to the server
    for (const item of itemsToSync) {
      await fetch("https://evershinebackend-2.onrender.com/api/addToWishlist", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId: item.postId }),
      })
    }

    return true
  } catch (error) {
    console.error("Error syncing wishlist:", error)
    return false
  }
}
