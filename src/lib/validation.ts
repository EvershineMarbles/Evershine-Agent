export interface Product {
    _id: string
    name: string
    price: number
    image: string[]
    postId: string
    category: string
    description?: string
    quantityAvailable?: number
    applicationAreas?: string[]
  }
  
  export interface WishlistItem extends Product {
    quantity: number
  }
  
  /**
   * Validates a product object to ensure it has all required fields
   */
  export function validateProduct(product: any): product is Product {
    if (!product) return false
  
    // Check required fields
    if (!product.postId || typeof product.postId !== "string") return false
    if (!product.name || typeof product.name !== "string") return false
    if (typeof product.price !== "number") return false
  
    return true
  }
  
  // Update the validateWishlistItem function to be more lenient with validation
  export function validateWishlistItem(item: any): item is WishlistItem {
    // Basic validation to ensure we have an item
    if (!item) return false
  
    // Check for essential properties
    if (!item.postId || typeof item.postId !== "string") return false
    if (!item.name || typeof item.name !== "string") return false
    if (typeof item.price !== "number") return false
  
    // For quantity, accept any number or default to 1
    if (item.quantity === undefined || item.quantity === null) {
      item.quantity = 1
    }
  
    // For quantityAvailable, accept any number or default to 0
    if (item.quantityAvailable === undefined || item.quantityAvailable === null) {
      item.quantityAvailable = 0
    }
  
    return true
  }
  
  /**
   * Ensures an array of products only contains valid products
   */
  export function filterValidProducts<T extends Product>(products: T[]): T[] {
    return products.filter(validateProduct)
  }
  
  // Update the filterValidWishlistItems function to provide better logging
  export function filterValidWishlistItems(items: any[]): WishlistItem[] {
    if (!items || !Array.isArray(items)) {
      console.warn("filterValidWishlistItems received invalid input:", items)
      return []
    }
  
    console.log(`Filtering ${items.length} wishlist items`)
  
    const validItems = items.filter((item) => {
      const isValid = validateWishlistItem(item)
      if (!isValid) {
        console.warn("Invalid wishlist item:", item)
      }
      return isValid
    })
  
    console.log(`Found ${validItems.length} valid wishlist items`)
    return validItems
  }
  