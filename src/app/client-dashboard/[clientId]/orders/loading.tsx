import { Loader2 } from "lucide-react"

export default function OrdersLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-[80vh]">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Loading orders...</p>
    </div>
  )
}
