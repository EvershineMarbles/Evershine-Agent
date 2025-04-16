"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Heart, Loader2, QrCode, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

interface Product {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  inWishlist?: boolean
}

export default function ClientDashboard() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const clientId = params.clientId as string
  const [clientData, setClientData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Mock products data - in a real app, you would fetch this from your API
  const [products, setProducts] = useState<Product[]>([
    {
      id: "1",
      name: "Crystallo",
      price: 1500,
      quantity: 20,
      image: "/golden-veined-marble.png",
      inWishlist: false,
    },
    {
      id: "2",
      name: "Crystallo",
      price: 1500,
      quantity: 20,
      image: "/golden-veined-marble.png",
      inWishlist: false,
    },
    {
      id: "3",
      name: "Crystallo",
      price: 1500,
      quantity: 20,
      image: "/golden-veined-marble.png",
      inWishlist: false,
    },
    {
      id: "4",
      name: "Crystallo",
      price: 1500,
      quantity: 20,
      image: "/golden-veined-marble.png",
      inWishlist: false,
    },
  ])

  useEffect(() => {
    const fetchClientData = async () => {
      setLoading(true)
      try {
        // Get the token
        const token = localStorage.getItem("clientImpersonationToken")

        if (!token) {
          throw new Error("No authentication token found. Please refresh the page and try again.")
        }

        // Use the correct API endpoint
        const response = await fetch(`https://evershinebackend-2.onrender.com/api/getClientDetails/${clientId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Client not found. Please check the client ID.")
          } else if (response.status === 401) {
            throw new Error("Authentication failed. Please refresh the token and try again.")
          } else {
            throw new Error(`API error: ${response.status} ${response.statusText}`)
          }
        }

        const data = await response.json()

        if (data.data) {
          setClientData(data.data)
        } else {
          throw new Error("Invalid response format from server")
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
        console.error("Error fetching client data:", error)
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchClientData()
  }, [clientId, toast])

  const toggleWishlist = (productId: string) => {
    setProducts(
      products.map((product) => (product.id === productId ? { ...product, inWishlist: !product.inWishlist } : product)),
    )
  }

  const addToCart = (productId: string) => {
    toast({
      title: "Added to cart",
      description: "Product has been added to your cart",
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading client data...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <div className="w-[133px] bg-black text-white flex flex-col items-center">
        <div className="p-4 mb-8">
          <Image src="/abstract-shine.png" alt="Evershine Logo" width={80} height={80} />
        </div>

        <div className="flex flex-col items-center space-y-10 flex-grow">
          <Link href={`/client-dashboard/${clientId}`} className="flex flex-col items-center">
            <div className="w-12 h-12 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-sm mt-1">Home</span>
          </Link>

          <Link href={`/client-dashboard/${clientId}/wishlist`} className="flex flex-col items-center">
            <div className="w-12 h-12 flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
            <span className="text-sm mt-1">Wishlist</span>
          </Link>

          <Link href={`/client-dashboard/${clientId}/cart`} className="flex flex-col items-center">
            <div className="w-12 h-12 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-sm mt-1">Cart</span>
          </Link>

          <div className="flex-grow"></div>

          <button
            onClick={() => {
              localStorage.removeItem("clientImpersonationToken")
              router.push("/")
            }}
            className="flex flex-col items-center mb-8"
          >
            <div className="w-12 h-12 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 17L21 12L16 7"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M21 12H9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-sm mt-1">Log out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Welcome, {clientData?.name?.split(" ")[0] || "Client"}</h1>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search Product..."
                  className="pl-10 pr-4 w-[300px] rounded-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                <Image src="/confident-leader.png" alt="Profile" width={48} height={48} />
              </div>
            </div>
          </div>

          {/* QR Code Button */}
          <Button
            className="w-full max-w-[600px] mx-auto mb-8 py-6 bg-[#194a95] hover:bg-[#194a95]/90 flex items-center justify-center"
            onClick={() =>
              toast({
                title: "QR Code Scanner",
                description: "QR code scanner functionality will be implemented soon.",
              })
            }
          >
            <QrCode className="mr-2 h-5 w-5" />
            Scan QR code
          </Button>

          {/* Products Section */}
          <div className="mb-6">
            <p className="text-lg font-medium">Showing 1-25 of 500 products</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {products.map((product) => (
              <div key={product.id} className="border rounded-lg overflow-hidden">
                <div className="relative">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    width={300}
                    height={300}
                    className="w-full h-[200px] object-cover"
                  />
                  <button className="absolute top-2 right-2 p-2" onClick={() => toggleWishlist(product.id)}>
                    <Heart className={`h-6 w-6 ${product.inWishlist ? "fill-black text-black" : "text-black"}`} />
                  </button>
                </div>

                <div className="p-4">
                  <h3 className="text-xl font-bold">{product.name}</h3>
                  <p className="text-sm mb-1">Rs. {product.price}/per sqft</p>
                  <p className="text-sm mb-4">Quantity : {product.quantity} sqft</p>

                  <Button className="w-full bg-[#383535] hover:bg-[#383535]/90" onClick={() => addToCart(product.id)}>
                    Add to Cart
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-end gap-4 mt-8">
            <Button variant="outline" className="w-32">
              Previous
            </Button>
            <Button variant="outline" className="w-32">
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
