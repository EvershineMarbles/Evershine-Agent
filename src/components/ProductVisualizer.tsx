"use client"

import { useState, useEffect, useRef } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface ProductVisualizerProps {
  productImage: string
  productName: string
}

// Define mockup rooms
const MOCKUPS = [
  {
    id: "bathroom",
    name: "Bathroom",
    src: "/assets/mockups/bathroom.png",
  },
  {
    id: "bedroom-green",
    name: "Bedroom",
    src: "/assets/mockups/bedroom-green.png",
  },
  {
    id: "living-room",
    name: "Living Room",
    src: "/assets/mockups/living-room.jpeg",
  },
  {
    id: "luxury-living",
    name: "Luxury Living",
    src: "/assets/mockups/luxury-living.png",
  },
  {
    id: "modern-bedroom",
    name: "Modern Bedroom",
    src: "/assets/mockups/modern-bedroom.png",
  },
  {
    id: "minimalist",
    name: "Minimalist",
    src: "/assets/mockups/minimalist.png",
  },
]

// Minimum dimensions we want to ensure for good coverage
const MIN_IMAGE_SIZE = 650 // Images smaller than this will use the enhanced method

export default function ProductVisualizer({ productImage, productName }: ProductVisualizerProps) {
  const [activeTab, setActiveTab] = useState<string>(MOCKUPS[0].id)
  const [loading, setLoading] = useState(true)
  const [textureReady, setTextureReady] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bookmatchedTextureRef = useRef<string | null>(null)
  const [backgroundSize, setBackgroundSize] = useState("400px 400px") // Default size
  const [backgroundPosition, setBackgroundPosition] = useState("center") // Default position

  // Create bookmatched texture as soon as component mounts
  useEffect(() => {
    createBookmatchedTexture(productImage)
  }, [productImage])

  // Set a timeout to simulate loading and ensure the DOM is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Create a bookmatched texture from the product image
  const createBookmatchedTexture = (imageUrl: string) => {
    // If we already created the texture, don't recreate it
    if (bookmatchedTextureRef.current) {
      setTextureReady(true)
      return
    }

    // Create an image element to load the texture
    const img = document.createElement("img")
    img.crossOrigin = "anonymous"

    img.onload = () => {
      // Create a canvas to manipulate the image
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        console.error("Could not get canvas context")
        return
      }

      const originalWidth = img.width
      const originalHeight = img.height

      // Determine if we need to use the enhanced method for small images
      const isSmallImage = originalWidth < MIN_IMAGE_SIZE || originalHeight < MIN_IMAGE_SIZE

      if (isSmallImage) {
        // ENHANCED METHOD FOR SMALL IMAGES
        // Instead of scaling up too much, we'll create a more detailed pattern
        // with more repetitions but at a smaller scale to maintain quality

        // For small images, we'll create a 4x4 grid of bookmatched patterns
        // This gives us more coverage without excessive scaling
        const gridSize = 4 // 4x4 grid

        // Set canvas size to accommodate the grid
        canvas.width = originalWidth * gridSize
        canvas.height = originalHeight * gridSize

        // Function to draw a single bookmatched pattern (2x2) at a specific position
        const drawBookmatchedPattern = (startX: number, startY: number) => {
          // Original image in top-left
          ctx.drawImage(img, startX, startY, originalWidth, originalHeight)

          // Horizontally flipped in top-right
          ctx.save()
          ctx.translate(startX + originalWidth * 2, startY)
          ctx.scale(-1, 1)
          ctx.drawImage(img, 0, 0, originalWidth, originalHeight)
          ctx.restore()

          // Vertically flipped in bottom-left
          ctx.save()
          ctx.translate(startX, startY + originalHeight * 2)
          ctx.scale(1, -1)
          ctx.drawImage(img, 0, 0, originalWidth, originalHeight)
          ctx.restore()

          // Both horizontally and vertically flipped in bottom-right
          ctx.save()
          ctx.translate(startX + originalWidth * 2, startY + originalHeight * 2)
          ctx.scale(-1, -1)
          ctx.drawImage(img, 0, 0, originalWidth, originalHeight)
          ctx.restore()
        }

        // Draw multiple bookmatched patterns in a grid
        for (let y = 0; y < gridSize; y += 2) {
          for (let x = 0; x < gridSize; x += 2) {
            drawBookmatchedPattern(x * originalWidth, y * originalHeight)
          }
        }

        // Set a smaller background size to maintain quality
        // We'll use a tiling approach rather than scaling
        const patternSize = Math.min(originalWidth, originalHeight) * 2
        setBackgroundSize(`${patternSize}px ${patternSize}px`)
        setBackgroundPosition("center")
      } else {
        // ORIGINAL METHOD FOR ADEQUATELY SIZED IMAGES
        // Set canvas size to 2x the image size to fit the bookmatched pattern
        const patternSize = Math.max(img.width, img.height) * 2
        canvas.width = patternSize
        canvas.height = patternSize

        // Draw the original image in the top-left quadrant
        ctx.drawImage(img, 0, 0, img.width, img.height)

        // Draw horizontally flipped image in top-right quadrant
        ctx.save()
        ctx.translate(patternSize, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(img, 0, 0, img.width, img.height)
        ctx.restore()

        // Draw vertically flipped image in bottom-left quadrant
        ctx.save()
        ctx.translate(0, patternSize)
        ctx.scale(1, -1)
        ctx.drawImage(img, 0, 0, img.width, img.height)
        ctx.restore()

        // Draw both horizontally and vertically flipped image in bottom-right quadrant
        ctx.save()
        ctx.translate(patternSize, patternSize)
        ctx.scale(-1, -1)
        ctx.drawImage(img, 0, 0, img.width, img.height)
        ctx.restore()

        // Use the original background size for larger images
        setBackgroundSize("400px 400px")
        setBackgroundPosition("center")
      }

      // Store the bookmatched texture
      bookmatchedTextureRef.current = canvas.toDataURL("image/jpeg", 0.95) // Higher quality JPEG
      setTextureReady(true)
    }

    img.onerror = () => {
      console.error("Error loading product image for bookmatching")
      // Fallback to original image if there's an error
      bookmatchedTextureRef.current = imageUrl
      setTextureReady(true)
    }

    // Handle CORS issues by using a proxy if needed
    if (imageUrl.startsWith("http")) {
      // Use proxy for external images
      img.src = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`
    } else {
      // Use direct path for local images
      img.src = imageUrl
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Product Visualizer</h2>

      <Tabs defaultValue={MOCKUPS[0].id} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-4">
          {MOCKUPS.map((mockup) => (
            <TabsTrigger key={mockup.id} value={mockup.id} className="text-xs">
              {mockup.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {MOCKUPS.map((mockup) => (
          <TabsContent key={mockup.id} value={mockup.id} className="mt-0">
            <div className="border rounded-lg p-2 bg-gray-50">
              <div className="relative rounded-lg overflow-hidden bg-white border">
                {loading || !textureReady ? (
                  <div className="flex items-center justify-center h-[200px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#194a95]"></div>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <div
                      className="relative inline-block max-w-full"
                      style={{
                        backgroundImage: `url(${bookmatchedTextureRef.current || productImage})`,
                        backgroundRepeat: "repeat",
                        backgroundSize: backgroundSize,
                        backgroundPosition: backgroundPosition,
                        imageRendering: "auto", // Changed from "high-quality" to "auto"
                      }}
                    >
                      <img
                        src={mockup.src || "/placeholder.svg"}
                        alt={`${mockup.name} mockup with ${productName}`}
                        className="block"
                        style={{ maxWidth: "100%", height: "auto", maxHeight: "500px" }}
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg"
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-2 text-center">
                This is a visualization of how {productName} might look in this space.
              </p>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
