"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, Package, Printer, Download, Share2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

// Define interfaces for type safety
interface OrderItem {
  name: string
  category: string
  price: number
  basePrice?: number
  quantity: number
}

interface ShippingAddress {
  street?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
}

interface Order {
  orderId: string
  items: OrderItem[]
  totalAmount: number
  status: string
  paymentStatus: string
  createdAt: string
  shippingAddress?: ShippingAddress
}

// Add the CommissionData interface from wishlist page
interface CommissionData {
  agentId: string
  name: string
  email: string
  commissionRate: number
  categoryCommissions?: Record<string, number>
}

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const clientId = params.clientId as string
  const orderId = params.orderId as string
  const invoiceRef = useRef<HTMLDivElement>(null)

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  // Add commission-related state from wishlist page
  const [commissionData, setCommissionData] = useState<CommissionData | null>(null)
  const [overrideCommissionRate, setOverrideCommissionRate] = useState<number | null>(null)

  // Get API URL from environment or use default
  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"
  }

  // Get token from localStorage
  const getToken = () => {
    try {
      // Try both token storage options
      const token = localStorage.getItem("clientImpersonationToken") || localStorage.getItem("token")
      if (!token) {
        setError("No authentication token found. Please log in again.")
        return null
      }
      return token
    } catch (e) {
      setError("Error accessing authentication. Please refresh the page.")
      return null
    }
  }

  // Add fetchCommissionData function from wishlist page
  const fetchCommissionData = async () => {
    try {
      const token = getToken()
      if (!token) return null

      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/api/client/agent-commission`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        console.error("Failed to fetch commission data:", response.status)
        return null
      }

      const data = await response.json()
      if (data.success && data.data) {
        setCommissionData(data.data)
        return data.data
      }
      return null
    } catch (error) {
      console.error("Error fetching commission data:", error)
      return null
    }
  }

  // Load saved commission rate from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Use a client-specific key for commission rate
      const savedRate = localStorage.getItem(`commission-override-${clientId}`)
      if (savedRate) {
        setOverrideCommissionRate(Number(savedRate))
      } else {
        // Reset to null if no saved rate for this client
        setOverrideCommissionRate(null)
      }
    }
  }, [clientId])

  // Fetch client data to get consultant level
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const token = getToken()
        if (!token) return

        const apiUrl = getApiUrl()
        const response = await fetch(`${apiUrl}/api/getClientDetails/${clientId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          console.error("Failed to fetch client data:", response.status)
          return
        }

        const data = await response.json()
        if (data.success && data.data) {
          // Set commission rate based on consultant level color
          if (data.data.consultantLevel) {
            const consultantLevel = data.data.consultantLevel
            console.log("Client consultant level:", consultantLevel)

            // Map color to commission rate
            let commissionRate = null
            switch (consultantLevel) {
              case "red":
                commissionRate = 5
                break
              case "yellow":
                commissionRate = 10
                break
              case "purple":
                commissionRate = 15
                break
              default:
                commissionRate = null
            }

            // Set the override commission rate
            setOverrideCommissionRate(commissionRate)
            console.log(`Setting commission rate to ${commissionRate}% based on consultant level ${consultantLevel}`)
          }
        }
      } catch (error) {
        console.error("Error fetching client data:", error)
      }
    }

    fetchClientData()
  }, [clientId])

  // Calculate adjusted price with commission (from wishlist page)
  const calculateAdjustedPrice = (item: OrderItem) => {
    // Always use basePrice (which should be the original price)
    const basePrice = item.basePrice || item.price

    // Get the default commission rate (from agent or category-specific)
    let defaultRate = commissionData?.commissionRate || 0

    // Check for category-specific commission
    if (commissionData?.categoryCommissions && item.category && commissionData.categoryCommissions[item.category]) {
      defaultRate = commissionData.categoryCommissions[item.category]
    }

    // Add the override rate to the default rate if an override is set
    const finalRate = overrideCommissionRate !== null ? defaultRate + overrideCommissionRate : defaultRate

    // Calculate adjusted price based on the original basePrice
    const adjustedPrice = basePrice * (1 + finalRate / 100)

    return Math.round(adjustedPrice * 100) / 100 // Round to 2 decimal places
  }

  // Update the fetchOrder function to use the correct API endpoint
  const fetchOrder = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = getToken()
      if (!token) {
        setLoading(false)
        return
      }

      // First fetch commission data
      await fetchCommissionData()

      const apiUrl = getApiUrl()
      console.log(`Fetching order ${orderId} with token:`, token.substring(0, 15) + "...")

      // Use the direct order endpoint from your backend
      const response = await fetch(`${apiUrl}/api/orders/${orderId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }).catch(() => {
        // If specific order endpoint fails, fall back to fetching all orders
        console.log("Specific order endpoint failed, falling back to all orders")
        return fetch(`${apiUrl}/api/clients/${clientId}/orders`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
      })

      // Check for errors
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please refresh the token and try again.")
        } else {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }
      }

      const data = await response.json()
      console.log("ORDER DETAILS - API response:", data)

      // Handle different response formats
      if (data && data.data && !Array.isArray(data.data)) {
        // Single order response
        setOrder(data.data)
      } else if (data && !Array.isArray(data) && data.orderId) {
        // Direct order object response
        setOrder(data)
      } else {
        // Array of orders response - find the specific order
        const ordersArray = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []
        const foundOrder = ordersArray.find((o: Order) => o.orderId === orderId)

        if (foundOrder) {
          setOrder(foundOrder)
        } else {
          throw new Error(`Order #${orderId} not found`)
        }
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load order details. Please try again."
      console.error("Error fetching order:", error)
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

  // Initialize data on component mount
  useEffect(() => {
    fetchOrder()
  }, [clientId, orderId, toast])

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Calculate order total with adjusted prices
  const calculateAdjustedTotal = (order: Order) => {
    return order.items.reduce((total, item) => {
      const adjustedPrice = calculateAdjustedPrice(item)
      return total + adjustedPrice * item.quantity
    }, 0)
  }

  // Handle print invoice
  const handlePrint = () => {
    window.print()
  }

  // Handle download PDF
  const handleDownloadPdf = async () => {
    if (!invoiceRef.current || !order) return

    try {
      setGeneratingPdf(true)
      toast({
        title: "Generating PDF",
        description: "Please wait while we generate your invoice PDF...",
      })

      // Add a class to prepare the element for PDF generation
      invoiceRef.current.classList.add("generating-pdf")

      // Create a clone of the invoice element to modify for PDF
      const invoiceElement = invoiceRef.current.cloneNode(true) as HTMLElement

      // Make sure all content is visible for PDF
      const hiddenElements = invoiceElement.querySelectorAll(".print\\:block")
      hiddenElements.forEach((el) => {
        ;(el as HTMLElement).style.display = "block"
      })

      // Hide elements that shouldn't be in the PDF
      const printHiddenElements = invoiceElement.querySelectorAll(".print\\:hidden")
      printHiddenElements.forEach((el) => {
        ;(el as HTMLElement).style.display = "none"
      })

      // Set background color to white
      invoiceElement.style.backgroundColor = "white"
      invoiceElement.style.padding = "20px"

      // Temporarily append to document for rendering
      invoiceElement.style.position = "absolute"
      invoiceElement.style.left = "-9999px"
      document.body.appendChild(invoiceElement)

      // Generate canvas from the prepared element
      const canvas = await html2canvas(invoiceElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      })

      // Remove the temporary element
      document.body.removeChild(invoiceElement)

      // Create PDF
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // Calculate dimensions to fit the image properly on the PDF
      const imgWidth = 210 // A4 width in mm (portrait)
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)

      // Save the PDF
      pdf.save(`Invoice-${order.orderId}.pdf`)

      // Remove the class after PDF generation
      invoiceRef.current.classList.remove("generating-pdf")

      toast({
        title: "PDF Generated",
        description: "Your invoice has been downloaded successfully.",
        variant: "success",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setGeneratingPdf(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading order details...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 md:p-8">
        <div className="flex items-center mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Go back</span>
          </Button>
          <h1 className="text-3xl font-bold">Order Details</h1>
        </div>

        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-red-800">
            <p>{error}</p>
            <Button
              variant="outline"
              className="mt-2 border-red-300 text-red-800 hover:bg-red-100"
              onClick={() => fetchOrder()}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>

        <Button variant="outline" onClick={() => router.back()}>
          Back to Orders
        </Button>
      </div>
    )
  }

  // No order found state
  if (!order) {
    return (
      <div className="p-6 md:p-8">
        <div className="flex items-center mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Go back</span>
          </Button>
          <h1 className="text-3xl font-bold">Order Details</h1>
        </div>

        <Card className="text-center py-12">
          <CardContent className="pt-6">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-medium mb-4">Order not found</h2>
            <p className="text-muted-foreground mb-6">The requested order could not be found</p>
            <Button
              onClick={() => router.push(`/client-dashboard/${clientId}`)}
              className="bg-primary hover:bg-primary/90"
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div ref={invoiceRef}>
        {/* Print-friendly header that only shows when printing */}
        <div className="hidden print:block mb-8">
          <h1 className="text-3xl font-bold text-center">INVOICE</h1>
          <p className="text-center text-muted-foreground">Order #{order.orderId}</p>
        </div>

        {/* Regular header that hides when printing */}
        <div className="flex items-center justify-between mb-8 print:hidden">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Go back</span>
            </Button>
            <h1 className="text-3xl font-bold">Invoice</h1>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={generatingPdf}>
              {generatingPdf ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        <Card className="mb-8 overflow-hidden">
          <CardHeader className="bg-muted/20 pb-3">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
              <div>
                <CardTitle className="text-lg">Order #{order.orderId}</CardTitle>
                <p className="text-sm text-muted-foreground">Placed on {formatDate(order.createdAt)}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge
                  variant={
                    order.status === "delivered"
                      ? "success"
                      : order.status === "shipped"
                        ? "info"
                        : order.status === "processing"
                          ? "warning"
                          : order.status === "cancelled"
                            ? "destructive"
                            : "outline"
                  }
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
                <Badge
                  variant={
                    order.paymentStatus === "paid"
                      ? "success"
                      : order.paymentStatus === "failed"
                        ? "destructive"
                        : "warning"
                  }
                >
                  Payment: {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-medium text-lg mb-2">Billing Information</h3>
                <div className="text-sm">
                  <p className="font-medium">Client ID: {clientId}</p>
                  {order.shippingAddress ? (
                    <>
                      <p className="mt-2">{order.shippingAddress.street}</p>
                      <p>
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                      </p>
                      <p>{order.shippingAddress.country}</p>
                    </>
                  ) : (
                    <p className="text-muted-foreground mt-2">No billing address provided</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-lg mb-2">Shipping Information</h3>
                <div className="text-sm">
                  {order.shippingAddress ? (
                    <>
                      <p>{order.shippingAddress.street}</p>
                      <p>
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                      </p>
                      <p>{order.shippingAddress.country}</p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No shipping address provided</p>
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <h3 className="font-medium text-lg mb-4">Order Items</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item, index) => {
                  const adjustedPrice = calculateAdjustedPrice(item)
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="text-right">
                        ₹
                        {adjustedPrice.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        ₹
                        {(adjustedPrice * item.quantity).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            <div className="mt-6 flex flex-col items-end">
              <div className="w-full md:w-1/3 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>
                    ₹
                    {calculateAdjustedTotal(order).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>₹0.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>Included</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>
                    ₹
                    {calculateAdjustedTotal(order).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-muted/10 justify-between py-4 print:hidden">
            <Button variant="outline" onClick={() => router.back()}>
              Back to Orders
            </Button>
            <Button variant="default">Track Order</Button>
          </CardFooter>
        </Card>

        <div className="text-center text-sm text-muted-foreground mt-8 print:mt-16">
          <p>Thank you for your business!</p>
          <p className="mt-1">If you have any questions, please contact our support team.</p>
          <p className="mt-4 print:hidden">
            <Link href={`/client-dashboard/${clientId}`} className="text-primary hover:underline">
              Back to Dashboard
            </Link>
          </p>
        </div>

        {/* Print-only footer */}
        <div className="hidden print:block mt-16 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>This is an electronically generated invoice and does not require a signature.</p>
        </div>
      </div>

      {/* Add global styles for PDF generation */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        .generating-pdf {
          background-color: white !important;
        }
      `}</style>
    </div>
  )
}
