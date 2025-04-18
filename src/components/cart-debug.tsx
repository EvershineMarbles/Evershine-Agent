"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown, ChevronUp, Bug, Trash2, RefreshCw } from "lucide-react"
import { debugLocalStorage, clearAllLocalStorage, checkCartConsistency } from "@/lib/debug-utils"
import { clearEntireCart } from "@/lib/cart-service"

export default function CartDebug() {
  const [expanded, setExpanded] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [consistency, setConsistency] = useState<any>(null)

  // Load debug info
  const loadDebugInfo = () => {
    const info = debugLocalStorage()
    setDebugInfo(info)

    const consistencyCheck = checkCartConsistency()
    setConsistency(consistencyCheck)
  }

  // Clear all data
  const handleClearAll = async () => {
    await clearEntireCart()
    clearAllLocalStorage()
    loadDebugInfo()
  }

  // Initialize component
  if (expanded && !debugInfo) {
    loadDebugInfo()
  }

  if (!expanded) {
    return (
      <Button variant="outline" size="sm" className="mb-4 flex items-center gap-1" onClick={() => setExpanded(true)}>
        <Bug className="h-4 w-4" />
        Show Cart Debug
        <ChevronDown className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between py-2">
        <CardTitle className="text-sm font-medium">Cart Debug</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
          <ChevronUp className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadDebugInfo} className="text-xs">
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="text-xs text-red-500 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear All Data
            </Button>
          </div>

          {consistency && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium">Consistency Check</h3>
              <div
                className={`p-2 rounded-md text-xs ${consistency.isConsistent ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
              >
                {consistency.isConsistent ? "Cart data is consistent" : "Cart data has inconsistencies"}
                {consistency.issues.length > 0 && (
                  <ul className="mt-1 list-disc list-inside">
                    {consistency.issues.map((issue: string, i: number) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {debugInfo && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium">LocalStorage Data</h3>
              <Textarea readOnly value={JSON.stringify(debugInfo, null, 2)} className="h-40 text-xs font-mono" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
