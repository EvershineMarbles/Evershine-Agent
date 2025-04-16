/**
 * Utility functions for handling images
 */

/**
 * Get a valid image URL or fallback to placeholder
 * @param imageUrl The original image URL
 * @param fallbackText Text to use for the placeholder image
 * @returns A valid image URL
 */
export function getValidImageUrl(imageUrl: string | undefined, fallbackText = "Image"): string {
    // If no image URL is provided, return a placeholder
    if (!imageUrl) {
      return `/placeholder.svg?text=${encodeURIComponent(fallbackText)}`
    }
  
    // Check if it's an S3 URL
    if (imageUrl.includes("s3.") && imageUrl.includes("amazonaws.com")) {
      // For S3 URLs, we need to ensure they're properly formatted
      try {
        // Try to create a URL object to validate it
        new URL(imageUrl)
        return imageUrl
      } catch (e) {
        console.error("Invalid S3 URL:", imageUrl)
        return `/placeholder.svg?text=${encodeURIComponent(fallbackText)}`
      }
    }
  
    // Return the original URL for other cases
    return imageUrl
  }
  
  /**
   * Check if an image URL is valid
   * @param url The URL to check
   * @returns Promise that resolves to true if the image is valid
   */
  export async function isImageValid(url: string): Promise<boolean> {
    if (!url) return false
  
    try {
      const response = await fetch(url, { method: "HEAD" })
      return response.ok
    } catch (e) {
      console.error("Error checking image:", url, e)
      return false
    }
  }
  