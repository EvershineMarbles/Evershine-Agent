"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronDown, ChevronUp, Bug, Trash2, RefreshCw } from "lucide-react"

export default function WishlistDebug() {
  const [expanded, setExpanded] = useState(false)
  const [localWishlist, setLocalWishlist] = useState<string[]>([])
  const [productId, setProductId] = useState("")
  const [debugLog, setDebugLog] = useState<string[]>([])

  // Load local wishlist data
  const loadLocalWishlist = () => {
    try {
      const savedWishlist = localStorage.getItem("wishlist")
      if (savedWishlist) {
        const wishlistIds = JSON.parse(savedWishlist)
        setLocalWishlist(wishlistIds)
        addToLog(`Loaded ${wishlistIds.length} items from local storage`)
      } else {
        setLocalWishlist([])
        addToLog("No wishlist found in local storage")
      }
    } catch (error) {
      addToLog(`Error loading local wishlist: ${error}`)
      setLocalWishlist([])
    }
  }

  // Add to debug log
  const addToLog = (message: string) => {
    setDebugLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  // Clear local wishlist
  const clearLocalWishlist = () => {
    try {
      localStorage.removeItem("wishlist")
      setLocalWishlist([])
      addToLog("Local wishlist cleared")
    } catch (error) {
      addToLog(`Error clearing local wishlist: ${error}`)
    }
  }

  // Add item to local wishlist
  const addToLocalWishlist = () => {
    if (!productId) {
      addToLog("No product ID entered")
      return
    }

    try {
      const updatedWishlist = [...localWishlist]
      if (!updatedWishlist.includes(productId)) {
        updatedWishlist.push(productId)
        localStorage.setItem("wishlist", JSON.stringify(updatedWishlist))
        setLocalWishlist(updatedWishlist)
        addToLog(`Added product ${productId} to local wishlist`)
      } else {
        addToLog(`Product ${productId} already in wishlist`)
      }
    } catch (error) {
      addToLog(`Error adding to local wishlist: ${error}`)
    }
  }

  // Remove item from local wishlist
  const removeFromLocalWishlist = (id: string) => {
    try {
      const updatedWishlist = localWishlist.filter((item) => item !== id)
      localStorage.setItem("wishlist", JSON.stringify(updatedWishlist))
      setLocalWishlist(updatedWishlist)
      addToLog(`Removed product ${id} from local wishlist`)
    } catch (error) {
      addToLog(`Error removing from local wishlist: ${error}`)
    }
  }

  // Clear debug log
  const clearLog = () => {
    setDebugLog([])
  }

  // Initialize component
  if (expanded && localWishlist.length === 0) {
    loadLocalWishlist()
  }

  if (!expanded) {
    return (
      <Button variant="outline" size="sm" className="mb-4 flex items-center gap-1" onClick={() => setExpanded(true)}>
        <Bug className="h-4 w-4" />
        Show Wishlist Debug
        <ChevronDown className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between py-2">
        <CardTitle className="text-sm font-medium">Wishlist Debug</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
          <ChevronUp className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadLocalWishlist} className="text-xs">
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearLocalWishlist}
              className="text-xs text-red-500 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear Local Wishlist
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="productId" className="text-xs">
              Add Product ID to Wishlist
            </Label>
            <div className="flex gap-2">
              <Input
                id="productId"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                placeholder="Enter product ID"
                className="text-xs"
              />
              <Button variant="outline" size="sm" onClick={addToLocalWishlist} className="text-xs">
                Add
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Local Wishlist Items ({localWishlist.length})</Label>
            <div className="max-h-40 overflow-y-auto border rounded-md p-2">
              {localWishlist.length === 0 ? (
                <p className="text-xs text-muted-foreground">No items in local wishlist</p>
              ) : (
                <ul className="space-y-1">
                  {localWishlist.map((id) => (
                    <li key={id} className="text-xs flex items-center justify-between">
                      <span className="font-mono">{id}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromLocalWishlist(id)}
                        className="h-6 w-6 p-0 text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Debug Log</Label>
              <Button variant="ghost" size="sm" onClick={clearLog} className="h-6 text-xs">
                Clear
              </Button>
            </div>
            <Textarea readOnly value={debugLog.join("\n")} className="h-32 text-xs font-mono" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
