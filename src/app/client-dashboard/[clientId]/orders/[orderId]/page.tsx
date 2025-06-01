"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, Package, Printer, Download } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

interface OrderItem {
  name: string
  category: string
  price: number
  basePrice?: number
  updatedPrice?: number // Backend calculated price
  quantity: number
  customQuantity?: number
  customFinish?: string
  customThickness?: string
  commissionInfo?: {
    currentAgentCommission: number
    consultantLevelCommission: number
    totalCommission: number
    consultantLevel: string
  }
}

interface ShippingAddress {
  street?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
}

interface AdditionalCharges {
  loadingFee: number
  woodPackaging: number
  insurance: number
  transportAdvance: number
  gstRate: number
  gstAmount: number
}

interface Order {
  orderId: string
  items: OrderItem[]
  totalAmount: number
  status: string
  paymentStatus: string
  createdAt: string
  shippingAddress?: ShippingAddress
  additionalCharges?: AdditionalCharges
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

  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"
  }

  const getToken = () => {
    try {
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

  const fetchOrder = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = getToken()
      if (!token) {
        setLoading(false)
        return
      }

      const apiUrl = getApiUrl()

      const response = await fetch(`${apiUrl}/api/orders/${orderId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }).catch(() => {
        console.log("Specific order endpoint failed, falling back to all orders")
        return fetch(`${apiUrl}/api/clients/${clientId}/orders`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please refresh the token and try again.")
        } else {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }
      }

      const data = await response.json()

      if (data && data.data && !Array.isArray(data.data)) {
        setOrder(data.data)
      } else if (data && !Array.isArray(data) && data.orderId) {
        setOrder(data)
      } else {
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

  useEffect(() => {
    fetchOrder()
  }, [clientId, orderId, toast])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const calculateAdjustedTotal = (order: Order) => {
    if (order.totalAmount) {
      return order.totalAmount
    }

    return order.items.reduce((total, item) => {
      const displayPrice = item.updatedPrice || item.price
      return total + displayPrice * item.quantity
    }, 0)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current || !order) return

    try {
      setGeneratingPdf(true)
      toast({
        title: "Generating PDF",
        description: "Please wait while we generate your invoice PDF...",
      })

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const element = invoiceRef.current

      const originalStyles = {
        background: element.style.background,
        padding: element.style.padding,
      }

      element.style.background = "white"
      element.style.padding = "15px"

      const printElements = element.querySelectorAll(".print\\:block")
      const printStyles = Array.from(printElements).map((el) => {
        const style = (el as HTMLElement).style.display
        ;(el as HTMLElement).style.display = "block"
        return style
      })

      const hiddenElements = element.querySelectorAll(".print\\:hidden")
      const hiddenStyles = Array.from(hiddenElements).map((el) => {
        const style = (el as HTMLElement).style.display
        ;(el as HTMLElement).style.display = "none"
        return style
      })

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      })

      element.style.background = originalStyles.background
      element.style.padding = originalStyles.padding

      printElements.forEach((el, i) => {
        ;(el as HTMLElement).style.display = printStyles[i]
      })

      hiddenElements.forEach((el, i) => {
        ;(el as HTMLElement).style.display = hiddenStyles[i]
      })

      const imgData = canvas.toDataURL("image/jpeg", 1.0)
      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`Invoice-${order.orderId}.pdf`)

      toast({
        title: "PDF Generated",
        description: "Your invoice has been downloaded successfully.",
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading order details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Go back</span>
          </Button>
          <h1 className="text-2xl font-bold">Order Details</h1>
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

  if (!order) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Go back</span>
          </Button>
          <h1 className="text-2xl font-bold">Order Details</h1>
        </div>

        <Card className="text-center py-8">
          <CardContent className="pt-6">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium mb-4">Order not found</h2>
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
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div ref={invoiceRef}>
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold text-center">INVOICE</h1>
          <p className="text-center text-muted-foreground">Order #{order.orderId}</p>
        </div>

        <div className="flex items-center justify-between mb-6 print:hidden">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Go back</span>
            </Button>
            <h1 className="text-2xl font-bold">Invoice</h1>
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
          </div>
        </div>

        <Card className="mb-6 overflow-hidden">
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
                      ? "default"
                      : order.status === "shipped"
                        ? "secondary"
                        : order.status === "processing"
                          ? "outline"
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
                      ? "default"
                      : order.paymentStatus === "failed"
                        ? "destructive"
                        : "outline"
                  }
                >
                  Payment: {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-medium text-base mb-2">Billing Information</h3>
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
                <h3 className="font-medium text-base mb-2">Shipping Information</h3>
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

            <Separator className="my-4" />

            <h3 className="font-medium text-base mb-3">Order Items</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Item</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Custom Specs</TableHead>
                    <TableHead className="text-right text-xs">Price</TableHead>
                    <TableHead className="text-right text-xs">Qty</TableHead>
                    <TableHead className="text-right text-xs">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item, index) => {
                    const displayPrice = item.updatedPrice || item.price
                    const hasCommission = item.updatedPrice && item.updatedPrice !== item.price
                    const originalPrice = item.basePrice || item.price

                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-sm">{item.name}</TableCell>
                        <TableCell className="text-sm">{item.category}</TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            {item.customQuantity && <div>Qty: {item.customQuantity} sqft</div>}
                            {item.customFinish && <div>Finish: {item.customFinish}</div>}
                            {item.customThickness && <div>Thickness: {item.customThickness} mm</div>}
                            {!item.customQuantity && !item.customFinish && !item.customThickness && (
                              <div className="text-muted-foreground">Standard specs</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="space-y-1">
                            {hasCommission ? (
                              <>
                                <div className="font-medium text-green-600 text-sm">
                                  ₹
                                  {displayPrice.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>
                                <div className="text-xs text-gray-500 line-through">
                                  ₹
                                  {originalPrice.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>
                                {item.commissionInfo && (
                                  <div className="text-xs text-gray-600">+{item.commissionInfo.totalCommission}%</div>
                                )}
                              </>
                            ) : (
                              <div className="font-medium text-sm">
                                ₹
                                {displayPrice.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm">{item.quantity}</TableCell>
                        <TableCell className="text-right text-sm">
                          ₹
                          {(displayPrice * item.quantity).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Additional Charges Section */}
            {order.additionalCharges && (
              <>
                <Separator className="my-4" />
                <h3 className="font-medium text-base mb-3">Additional Charges</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Charge Type</TableHead>
                        <TableHead className="text-xs">Description</TableHead>
                        <TableHead className="text-right text-xs">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.additionalCharges.loadingFee > 0 && (
                        <TableRow>
                          <TableCell className="font-medium text-sm">Loading Fee</TableCell>
                          <TableCell className="text-sm text-muted-foreground">Material loading charges</TableCell>
                          <TableCell className="text-right text-sm">
                            ₹
                            {order.additionalCharges.loadingFee.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                        </TableRow>
                      )}
                      {order.additionalCharges.woodPackaging > 0 && (
                        <TableRow>
                          <TableCell className="font-medium text-sm">Wood Packaging</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {order.additionalCharges.woodPackaging === 1500 && "Basic packaging"}
                            {order.additionalCharges.woodPackaging === 2500 && "Standard packaging"}
                            {order.additionalCharges.woodPackaging === 3500 && "Premium packaging"}
                            {order.additionalCharges.woodPackaging === 4500 && "Deluxe packaging"}
                            {![1500, 2500, 3500, 4500].includes(order.additionalCharges.woodPackaging) &&
                              "Custom packaging"}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            ₹
                            {order.additionalCharges.woodPackaging.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                        </TableRow>
                      )}
                      {order.additionalCharges.insurance > 0 && (
                        <TableRow>
                          <TableCell className="font-medium text-sm">Insurance</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            ₹345 per lakh of billing amount
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            ₹
                            {order.additionalCharges.insurance.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                        </TableRow>
                      )}
                      {order.additionalCharges.transportAdvance > 0 && (
                        <TableRow>
                          <TableCell className="font-medium text-sm">Transport Advance</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            Transportation advance payment
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            ₹
                            {order.additionalCharges.transportAdvance.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}

            {/* Updated Total Calculation */}
            <div className="mt-4 flex flex-col items-end">
              <div className="w-full md:w-1/2 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Items Subtotal:</span>
                  <span>
                    ₹
                    {order.items
                      .reduce((total, item) => {
                        const displayPrice = item.updatedPrice || item.price
                        return total + displayPrice * item.quantity
                      }, 0)
                      .toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                  </span>
                </div>

                {order.additionalCharges && (
                  <>
                    {order.additionalCharges.loadingFee > 0 && (
                      <div className="flex justify-between">
                        <span>Loading Fee:</span>
                        <span>
                          ₹
                          {order.additionalCharges.loadingFee.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}
                    {order.additionalCharges.woodPackaging > 0 && (
                      <div className="flex justify-between">
                        <span>Wood Packaging:</span>
                        <span>
                          ₹
                          {order.additionalCharges.woodPackaging.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}
                    {order.additionalCharges.insurance > 0 && (
                      <div className="flex justify-between">
                        <span>Insurance:</span>
                        <span>
                          ₹
                          {order.additionalCharges.insurance.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}
                    {order.additionalCharges.transportAdvance > 0 && (
                      <div className="flex justify-between">
                        <span>Transport Advance:</span>
                        <span>
                          ₹
                          {order.additionalCharges.transportAdvance.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between">
                      <span>Subtotal before GST:</span>
                      <span>
                        ₹
                        {(order.totalAmount - (order.additionalCharges.gstAmount || 0)).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    {order.additionalCharges.gstAmount > 0 && (
                      <div className="flex justify-between">
                        <span>GST ({order.additionalCharges.gstRate}%):</span>
                        <span>
                          ₹
                          {order.additionalCharges.gstAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}
                  </>
                )}

                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Amount:</span>
                  <span className="text-primary">
                    ₹
                    {order.totalAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-muted/10 justify-between py-3 print:hidden">
            <Button variant="outline" onClick={() => router.back()}>
              Back to Orders
            </Button>
            <Button variant="default">Track Order</Button>
          </CardFooter>
        </Card>

        <div className="text-center text-sm text-muted-foreground mt-6 print:mt-12">
          <p>Thank you for your business!</p>
          <p className="mt-1">If you have any questions, please contact our support team.</p>
          <p className="mt-4 print:hidden">
            <Link href={`/client-dashboard/${clientId}`} className="text-primary hover:underline">
              Back to Dashboard
            </Link>
          </p>
        </div>

        <div className="hidden print:block mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>This is an electronically generated invoice and does not require a signature.</p>
        </div>
      </div>

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
