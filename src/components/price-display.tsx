import { formatPrice } from "@/lib/price-utils"

interface PriceDisplayProps {
  price: number | null | undefined
  basePrice?: number | null
  size?: "sm" | "md" | "lg"
  className?: string
}

export function PriceDisplay({ price, basePrice, size = "md", className = "" }: PriceDisplayProps) {
  // If price is missing, show placeholder
  if (price === null || price === undefined) {
    return <span className={`text-muted-foreground ${className}`}>Price unavailable</span>
  }

  // Determine text size based on the size prop
  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }

  // If there's a base price and it's different from the price, show both
  if (basePrice && basePrice !== price) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className={`font-bold ${textSizeClasses[size]}`}>{formatPrice(price)}</span>
        <span className={`text-muted-foreground line-through ${size === "lg" ? "text-sm" : "text-xs"}`}>
          {formatPrice(basePrice)}
        </span>
      </div>
    )
  }

  // Otherwise just show the price
  return <span className={`font-bold ${textSizeClasses[size]} ${className}`}>{formatPrice(price)}</span>
}
