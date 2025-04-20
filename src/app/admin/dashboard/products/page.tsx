"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, PlusCircle, Loader2, MoreHorizontal, Package } from "lucide-react"
import Image from "next/image"

interface Product {
  _id: string
  name: string
  price: number
  category: string
  status: "active" | "draft" | "out_of_stock"
  image: string[]
  createdAt: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    // Fetch products
    const fetchProducts = async () => {
      try {
        // In a real app, you would fetch this data from your API
        // For now, we'll use mock data
        const mockProducts: Product[] = [
          {
            _id: "1",
            name: "Italian Marble - Statuario",
            price: 2500,
            category: "Marble",
            status: "active",
            image: ["/polished-marble-swirls.png"],
            createdAt: "2023-01-15",
          },
          {
            _id: "2",
            name: "Granite - Black Galaxy",
            price: 1800,
            category: "Granite",
            status: "active",
            image: ["/speckled-granite-slab.png"],
            createdAt: "2023-02-20",
          },
          {
            _id: "3",
            name: "Quartz - White Sparkle",
            price: 2200,
            category: "Quartz",
            status: "out_of_stock",
            image: ["/amethyst-geode.png"],
            createdAt: "2023-03-10",
          },
          {
            _id: "4",
            name: "Sandstone - Desert Gold",
            price: 1500,
            category: "Sandstone",
            status: "draft",
            image: ["/textured-sandstone-cliff.png"],
            createdAt: "2023-01-05",
          },
        ]

        setProducts(mockProducts)
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Filter products based on search query
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "draft":
        return "bg-yellow-100 text-yellow-800"
      case "out_of_stock":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Format status text
  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <Button className="bg-blue hover:bg-blue/90">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add New Product
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Search products by name or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl font-medium mb-2">No products found</p>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? "Try a different search term" : "Add your first product to get started"}
            </p>
            <Button className="bg-blue hover:bg-blue/90">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add New Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Product</th>
                    <th className="text-left py-3 px-4">Category</th>
                    <th className="text-right py-3 px-4">Price (₹/sqft)</th>
                    <th className="text-center py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Created</th>
                    <th className="text-center py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="relative h-10 w-10 rounded-md overflow-hidden mr-3">
                            <Image
                              src={product.image[0] || "/placeholder.svg?height=40&width=40"}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <span>{product.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{product.category}</td>
                      <td className="py-3 px-4 text-right">₹{product.price.toLocaleString()}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(product.status)}`}>
                          {formatStatus(product.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
