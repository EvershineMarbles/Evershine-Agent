import { toast } from "@/components/ui/use-toast"

export async function apiRequest(url: string, options: RequestInit = {}) {
  try {
    // Get the token
    const token = localStorage.getItem("clientImpersonationToken")

    if (!token) {
      throw new Error("No authentication token found. Please refresh the page and try again.")
    }

    // Add headers
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }

    // Make the request
    const response = await fetch(url, {
      ...options,
      headers,
    })

    // Handle non-OK responses
    if (!response.ok) {
      // Try to get detailed error message
      let errorMessage = `API error: ${response.status} ${response.statusText}`

      try {
        const errorText = await response.text()

        // Try to parse as JSON
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.message) {
            errorMessage = errorData.message
          }
        } catch (e) {
          // If not JSON, use the text as is if it exists
          if (errorText) {
            errorMessage = errorText
          }
        }
      } catch (e) {
        // Ignore error reading response
      }

      throw new Error(errorMessage)
    }

    // Parse and return the response
    return await response.json()
  } catch (error: any) {
    console.error(`API request to ${url} failed:`, error)

    // Show toast notification for API errors
    toast({
      title: "API Error",
      description: error.message || "An error occurred while communicating with the server",
      variant: "destructive",
    })

    throw error
  }
}

/**
 * Makes an API request with automatic retry for certain errors
 */
export async function apiRequestWithRetry(url: string, options: RequestInit = {}, maxRetries = 3) {
  let retries = 0
  let lastError: Error

  while (retries < maxRetries) {
    try {
      return await apiRequest(url, options)
    } catch (error: any) {
      lastError = error

      // Only retry for certain errors (network errors, 500s)
      if (error.message.includes("NetworkError") || error.message.includes("500")) {
        retries++
        console.log(`Retrying API request (${retries}/${maxRetries})...`)

        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retries)))
      } else {
        // Don't retry for client errors (400s)
        break
      }
    }
  }

  throw lastError
}

// Helper for wishlist operations
export async function addToWishlist(productId: string) {
  // Validate productId
  if (!productId || typeof productId !== "string") {
    toast({
      title: "Error",
      description: "Invalid product ID. Cannot add to wishlist.",
      variant: "destructive",
    })
    throw new Error("Invalid product ID")
  }

  return apiRequest("https://evershinebackend-2.onrender.com/api/addToWishlist", {
    method: "POST",
    body: JSON.stringify({ productId }),
  })
}

export async function removeFromWishlist(productId: string) {
  // Validate productId
  if (!productId || typeof productId !== "string") {
    toast({
      title: "Error",
      description: "Invalid product ID. Cannot remove from wishlist.",
      variant: "destructive",
    })
    throw new Error("Invalid product ID")
  }

  return apiRequest("https://evershinebackend-2.onrender.com/api/deleteUserWishlistItem", {
    method: "DELETE",
    body: JSON.stringify({ productId }),
  })
}

export async function getWishlist() {
  return apiRequest("https://evershinebackend-2.onrender.com/api/getUserWishlist")
}

export async function addToCart(productId: string) {
  // Validate productId
  if (!productId || typeof productId !== "string") {
    toast({
      title: "Error",
      description: "Invalid product ID. Cannot add to cart.",
      variant: "destructive",
    })
    throw new Error("Invalid product ID")
  }

  return apiRequest("https://evershinebackend-2.onrender.com/api/addToCart", {
    method: "POST",
    body: JSON.stringify({ productId }),
  })
}

export async function removeFromCart(productId: string) {
  // Validate productId
  if (!productId || typeof productId !== "string") {
    toast({
      title: "Error",
      description: "Invalid product ID. Cannot remove from cart.",
      variant: "destructive",
    })
    throw new Error("Invalid product ID")
  }

  return apiRequest("https://evershinebackend-2.onrender.com/api/deleteUserCartItem", {
    method: "DELETE",
    body: JSON.stringify({ productId }),
  })
}

export async function getCart() {
  return apiRequest("https://evershinebackend-2.onrender.com/api/getUserCart")
}
