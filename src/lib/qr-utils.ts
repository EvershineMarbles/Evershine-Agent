/**
 * Utility functions for QR code handling
 */

// Base URL for the application
const BASE_URL = typeof window !== "undefined" ? window.location.origin : "https://evershine-agent.vercel.app" // Fallback URL

/**
 * Extracts a product ID from a QR code text
 * Handles both the special format and standard URL formats
 */
export function extractProductId(qrText: string): string | null {
  // Check if it's our special format
  if (qrText.startsWith("ev://product/")) {
    return qrText.replace("ev://product/", "")
  }

  // Try to extract from URL format
  if (qrText.includes("/product/")) {
    try {
      // Try to parse as URL
      const url = new URL(qrText)
      const pathParts = url.pathname.split("/")
      const productIndex = pathParts.findIndex((part) => part === "product")

      if (productIndex !== -1 && pathParts.length > productIndex + 1) {
        return pathParts[productIndex + 1]
      }
    } catch (e) {
      // Not a URL, try simple string extraction
      const parts = qrText.split("/product/")
      if (parts.length > 1) {
        // Get the part after /product/ and remove any trailing slashes or query params
        const productId = parts[1].split("/")[0].split("?")[0]
        if (productId) return productId
      }
    }
  }

  return null
}

/**
 * Determines if the current user is an admin
 */
export function isAdmin(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem("admin_token") !== null
}

/**
 * Determines if the current user is an agent
 */
export function isAgent(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem("accessToken") !== null && !isAdmin()
}

/**
 * Gets the current client ID for an agent
 */
export function getCurrentClientId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("currentClientId")
}

/**
 * Gets the appropriate redirect URL based on user role
 */
export function getRedirectUrl(
  productId: string,
  isAdminUser: boolean,
  isAgentUser: boolean,
  clientId?: string,
): string {
  if (isAdminUser) {
    return `/admin/dashboard/product/${productId}`
  } else if (isAgentUser && clientId) {
    return `/client-dashboard/${clientId}/product/${productId}`
  } else if (isAgentUser) {
    // Agent without client context - should go to agent dashboard product page
    return `/dashboard/product/${productId}`
  } else {
    // Regular user - public product page
    return `/product/${productId}`
  }
}

/**
 * Generates a QR code URL for a product
 * Uses a standard URL format that works with all phone cameras
 */
export function generateProductQrUrl(productId: string): string {
  return `${BASE_URL}/product/${productId}`
}

/**
 * Generates a QR code URL with our special format (for internal use)
 */
export function generateInternalProductQrUrl(productId: string): string {
  return `ev://product/${productId}`
}
