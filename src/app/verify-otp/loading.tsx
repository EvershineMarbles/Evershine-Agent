import { Loader2 } from "lucide-react"

export default function VerifyOTPLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <Loader2 className="h-8 w-8 animate-spin text-blue" />
      <p className="mt-4 text-muted-foreground">Loading verification page...</p>
    </div>
  )
}
