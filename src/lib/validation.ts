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
  
  // Replace the validateWishlistItem function with this implementation:
  export function validateWishlistItem(item: any): item is WishlistItem {
    // First check if it's a valid product
    if (!validateProduct(item)) return false
  
    // Then check wishlist-specific fields
    // Use a type assertion to tell TypeScript we're checking for a WishlistItem
    const wishlistItem = item as Partial<WishlistItem>
    if (typeof wishlistItem.quantity !== "number" || wishlistItem.quantity < 1) return false
  
    return true
  }
  
  /**
   * Ensures an array of products only contains valid products
   */
  export function filterValidProducts<T extends Product>(products: T[]): T[] {
    return products.filter(validateProduct)
  }
  
  /**
   * Ensures an array of wishlist items only contains valid items
   */
  export function filterValidWishlistItems(items: any[]): WishlistItem[] {
    return items.filter(validateWishlistItem)
  }
  