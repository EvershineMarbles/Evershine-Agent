"use client"

import type React from "react"

import { useEffect, useState } from "react"
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

async function fetchProducts(clientId: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client-dashboard/${clientId}/products`, {
      cache: "no-store",
    })

    if (!res.ok) {
      throw new Error(`Failed to fetch products: ${res.status} ${res.statusText}`)
    }

    const data = await res.json()

    if (!data || !data.data) {
      console.error("Data or data.data is undefined:", data)
      return []
    }

    // Process the image URLs to ensure they're valid
    const processedProducts = data.data.map((product: Product) => ({
      ...product,
      image:
        Array.isArray(product.image) && product.image.length > 0
          ? product.image.filter((url: string) => typeof url === "string" && url.trim() !== "")
          : ["/placeholder.svg?height=300&width=300"],
    }))

    return processedProducts
  } catch (error) {
    console.error("Error fetching products:", error)
    return []
  }
}

export default function Products() {
  const params = useParams()
  const clientId = Array.isArray(params.clientId) ? params.clientId[0] : (params.clientId as string)
  const [products, setProducts] = useState<Product[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])
  const [imageError, setImageError] = useState<{ [key: string]: boolean }>({})

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

  const handleImageError = (productId: string) => {
    setImageError((prevImageError) => ({
      ...prevImageError,
      [productId]: true,
    }))
  }

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
            <div className="relative h-64">
              <Image
                src={
                  imageError[product._id]
                    ? "/placeholder.svg"
                    : product.image && product.image.length > 0
                      ? product.image[0]
                      : "/placeholder.svg"
                }
                alt={product.name}
                fill
                className="object-cover transition-transform group-hover:scale-105 duration-300"
                onError={() => handleImageError(product._id)}
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
