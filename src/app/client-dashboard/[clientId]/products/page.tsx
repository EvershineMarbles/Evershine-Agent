"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { Heart } from "lucide-react"

interface Product {
  _id: string
  name: string
  description: string
  price: number
  image: string[]
  postId: string
}

async function fetchProducts(clientId: string): Promise<Product[]> {
  try {
    const response = await fetch(`/api/client-dashboard/${clientId}/products`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Failed to fetch products:", error)
    return []
  }
}

function getImageUrl(imageUrl: string | undefined): string {
  if (!imageUrl) return "/placeholder.svg"

  // Check if it's an S3 URL
  if (imageUrl.includes("s3.") && imageUrl.includes("amazonaws.com")) {
    console.log("Using direct S3 URL:", imageUrl)
    // Use the direct S3 URL instead of letting Next.js try to optimize it
    return imageUrl
  }

  return imageUrl || "/placeholder.svg"
}

export default function Products() {
  const params = useParams()
  const clientId = Array.isArray(params.clientId) ? params.clientId[0] : (params.clientId as string)
  const [products, setProducts] = useState<Product[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])
  const [imageError, setImageError] = useState<{ [key: string]: boolean }>({})
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (clientId) {
      fetchProducts(clientId).then((fetchedProducts) => {
        setProducts(fetchedProducts)
      })
    }
  }, [clientId])

  useEffect(() => {
    // Load wishlist from localStorage on component mount
    const storedWishlist = localStorage.getItem("wishlist")
    if (storedWishlist) {
      setWishlist(JSON.parse(storedWishlist))
    }
  }, [])

  useEffect(() => {
    // Save wishlist to localStorage whenever it changes
    localStorage.setItem("wishlist", JSON.stringify(wishlist))
  }, [wishlist])

  const toggleWishlist = (e: React.MouseEvent, postId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setWishlist((prevWishlist) => {
      if (prevWishlist.includes(postId)) {
        return prevWishlist.filter((id) => id !== postId)
      } else {
        return [...prevWishlist, postId]
      }
    })
  }

  const handleImageError = useCallback((productId: string) => {
    console.log("Image error for product:", productId)
    setImageLoadErrors((prev) => ({ ...prev, [productId]: true }))
  }, [])

  useEffect(() => {
    if (products.length > 0) {
      console.log(
        "Sample image URLs:",
        products.slice(0, 3).map((p) => p.image?.[0] || "no image"),
      )
    }
  }, [products])

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <a
            key={product._id}
            href={`/product/${product.postId}`}
            className="group relative block rounded-md overflow-hidden"
          >
            <div className="relative aspect-square">
              {/* Add a key to force re-render when the image source changes */}
              <Image
                src={imageLoadErrors[product._id] ? "/placeholder.svg" : getImageUrl(product.image?.[0])}
                alt={product.name}
                fill
                className="object-cover transition-transform group-hover:scale-105 duration-300"
                onError={() => handleImageError(product._id)}
                unoptimized={true} // This is crucial - bypass Next.js image optimization
                loading="lazy"
              />
            </div>
            <div className="p-4 bg-white">
              <h2 className="text-lg font-semibold">{product.name}</h2>
              <p className="text-gray-600">${product.price}</p>
            </div>
            <button
              onClick={(e) => toggleWishlist(e, product.postId)}
              className="absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors z-10"
              aria-label={wishlist.includes(product.postId) ? "Remove from wishlist" : "Add to wishlist"}
              type="button"
            >
              <Heart
                className={`h-5 w-5 ${
                  wishlist.includes(product.postId) ? "text-red-500 fill-red-500" : "text-gray-600"
                }`}
              />
              <span className="sidebar-tooltip absolute left-full ml-2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap z-50">
                {wishlist.includes(product.postId) ? "Remove from wishlist" : "Add to wishlist"}
              </span>
            </button>
          </a>
        ))}
      </div>
    </div>
  )
}
