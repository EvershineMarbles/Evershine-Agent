interface PlaceholderImageProps {
    productName: string
    className?: string
  }
  
  export function PlaceholderImage({ productName, className = "" }: PlaceholderImageProps) {
    // Generate a consistent color based on the product name
    const getColorFromString = (str: string) => {
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
      }
      const hue = hash % 360
      return `hsl(${hue}, 70%, 80%)`
    }
  
    // Get initials from product name
    const getInitials = (name: string) => {
      return name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    }
  
    const bgColor = getColorFromString(productName)
    const initials = getInitials(productName)
  
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`} style={{ backgroundColor: bgColor }}>
        <span className="text-4xl font-bold text-gray-700">{initials}</span>
      </div>
    )
  }
  