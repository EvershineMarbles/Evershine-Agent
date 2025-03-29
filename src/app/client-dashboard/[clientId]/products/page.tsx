"use client"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart } from "@/components/ui/heart"

// Sample product data
const products = [
  {
    id: 1,
    name: "Premium Dog Food",
    description: "High-quality nutrition for adult dogs",
    price: 49.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Dog Food",
    inStock: true,
  },
  {
    id: 2,
    name: "Grain-Free Cat Food",
    description: "Specially formulated for sensitive cats",
    price: 39.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Cat Food",
    inStock: true,
  },
  {
    id: 3,
    name: "Small Animal Bedding",
    description: "Soft, absorbent bedding for small pets",
    price: 12.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Small Animals",
    inStock: false,
  },
  {
    id: 4,
    name: "Bird Seed Mix",
    description: "Nutritious blend for all bird types",
    price: 8.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Bird Supplies",
    inStock: true,
  },
  {
    id: 5,
    name: "Aquarium Filter",
    description: "Advanced filtration for clear water",
    price: 29.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Fish Supplies",
    inStock: true,
  },
  {
    id: 6,
    name: "Pet Grooming Brush",
    description: "Gentle brush for all coat types",
    price: 15.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Grooming",
    inStock: true,
  },
]

export default async function ProductsPage({ params }: { params: Promise<{ clientId: string }> }) {
  // Await the params
  const resolvedParams = await params
  const clientId = resolvedParams.clientId

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex gap-2">
          <Button variant="outline">Filter</Button>
          <Button variant="outline">Sort</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <CardHeader className="p-0">
              <div className="relative">
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Heart />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <Badge variant={product.inStock ? "default" : "destructive"}>
                  {product.inStock ? "In Stock" : "Out of Stock"}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mb-2">{product.description}</p>
              <p className="font-bold">${product.price.toFixed(2)}</p>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex gap-2">
              <Button
                className="w-full"
                disabled={!product.inStock}
                onClick={() => console.log(`Add ${product.name} to cart for client ${clientId}`)}
              >
                Add to Cart
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

