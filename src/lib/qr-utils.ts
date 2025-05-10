/**
 * Utility functions for QR code handling
 */

/**
 * Extracts a product ID from a QR code text
 * Handles both the special format and legacy URL formats
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
    return localStorage.getItem("accessToken") !== null
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
  export function getRedirectUrl(productId: string, isAdminUser: boolean, clientId?: string): string {
    if (isAdminUser) {
      return `/admin/dashboard/product/${productId}`
    } else if (clientId) {
      return `/client-dashboard/${clientId}/product/${productId}`
    } else {
      // Default fallback - should not normally be used
      return `/product/${productId}`
    }
  }
  
  /**
   * Generates a QR code URL with our special format
   */
  export function generateProductQrUrl(productId: string): string {
    return `ev://product/${productId}`
  }
  