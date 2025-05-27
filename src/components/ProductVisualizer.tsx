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
    id: "modern-bedroom",
    name: "Modern Bedroom",
    src: "/assets/mockups/modern-bedroom.png",
  },
  {
    id: "living-room",
    name: "Living Room",
    src: "/assets/mockups/living-room.jpeg",
  },
  {
    id: "bedroom-green",
    name: "Bedroom",
    src: "/assets/mockups/bedroom-green.png",
  },
  {
    id: "luxury-living",
    name: "Luxury Living",
    src: "/assets/mockups/luxury-living.png",
  },
  {
    id: "minimalist",
    name: "Minimalist",
    src: "/assets/mockups/minimalist.png",
  },
]

export default function ProductVisualizer({ productImage, productName }: ProductVisualizerProps) {
  const [activeTab, setActiveTab] = useState<string>(MOCKUPS[0].id)
  const [loading, setLoading] = useState(true)
  const [textureReady, setTextureReady] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bookmatchedTextureRef = useRef<string | null>(null)
  const [backgroundSize, setBackgroundSize] = useState("400px 400px") // Default size
  const [backgroundPosition, setBackgroundPosition] = useState("center") // Default position
  const [mockupsLoaded, setMockupsLoaded] = useState<Record<string, boolean>>({})
  const [allMockupsLoaded, setAllMockupsLoaded] = useState(false)

  // Preload all mockup images immediately
  useEffect(() => {
    const preloadedMockups: Record<string, boolean> = {}
    let loadedCount = 0

    const preloadImage = (src: string, id: string) => {
      return new Promise<void>((resolve) => {
        const img = new Image()
        img.crossOrigin = "anonymous"

        img.onload = () => {
          preloadedMockups[id] = true
          loadedCount++
          resolve()
        }

        img.onerror = () => {
          preloadedMockups[id] = false
          loadedCount++
          resolve()
        }

        img.src = src
      })
    }

    // Start preloading all mockups in parallel
    Promise.all(MOCKUPS.map((mockup) => preloadImage(mockup.src, mockup.id))).then(() => {
      console.log("All mockups preloaded successfully")
      setAllMockupsLoaded(true)
      setMockupsLoaded(preloadedMockups)
    })

    // Also preload the product image to start bookmatching process early
    if (productImage) {
      const productImg = new Image()
      productImg.crossOrigin = "anonymous"
      productImg.src = productImage.startsWith("http")
        ? `/api/proxy-image?url=${encodeURIComponent(productImage)}`
        : productImage
    }
  }, [productImage])

  // Create bookmatched texture as soon as component mounts
  useEffect(() => {
    createBookmatchedTexture(productImage)
  }, [productImage])

  // Set a timeout to simulate loading and ensure the DOM is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  // Replace the createBookmatchedTexture function with this optimized version
  // that handles 488x488 px images specifically

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

      // Log the exact dimensions for debugging
      console.log(`Image dimensions: ${originalWidth}x${originalHeight}`)

      // Check for specific square image sizes that need special handling
      const isExactSquare488 = originalWidth === 488 && originalHeight === 488
      const isExactSquare646 = originalWidth === 646 && originalHeight === 646
      const isNearlySquare = Math.abs(originalWidth - originalHeight) < 20

      // Special handling for 488x488 and 646x646 images
      if (isExactSquare488 || isExactSquare646) {
        console.log(`Applying special bookmatching for ${originalWidth}x${originalHeight} image`)

        // For these specific sizes, use a precise 2x2 grid with perfect mirroring
        // This creates a clean bookmatched pattern with sharp details

        // Make the canvas exactly 2x the size in each dimension
        canvas.width = originalWidth * 2
        canvas.height = originalHeight * 2

        // Clear any previous transformations
        ctx.setTransform(1, 0, 0, 1, 0, 0)

        // Top-left: Original image
        ctx.drawImage(img, 0, 0, originalWidth, originalHeight)

        // Top-right: Horizontally flipped
        ctx.save()
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(img, 0, 0, originalWidth, originalHeight)
        ctx.restore()

        // Bottom-left: Vertically flipped
        ctx.save()
        ctx.translate(0, canvas.height)
        ctx.scale(1, -1)
        ctx.drawImage(img, 0, 0, originalWidth, originalHeight)
        ctx.restore()

        // Bottom-right: Both horizontally and vertically flipped
        ctx.save()
        ctx.translate(canvas.width, canvas.height)
        ctx.scale(-1, -1)
        ctx.drawImage(img, 0, 0, originalWidth, originalHeight)
        ctx.restore()

        // Set background size to exactly match the 2x2 grid
        setBackgroundSize(`${originalWidth * 2}px ${originalHeight * 2}px`)
        setBackgroundPosition("center")
      } else if (isNearlySquare) {
        // For other square images, use a 4x4 grid with precise mirroring
        // This creates a more detailed bookmatched pattern

        // Make the canvas 4x the size in each dimension for more detail
        const multiplier = 4
        canvas.width = originalWidth * multiplier
        canvas.height = originalHeight * multiplier

        // Create a pattern of 4x4 tiles with alternating flips
        for (let y = 0; y < multiplier; y++) {
          for (let x = 0; x < multiplier; x++) {
            // Create a more complex pattern with alternating flips
            const flipX = x % 2 === 1
            const flipY = y % 2 === 1

            ctx.save()

            // Position for this tile
            const posX = x * originalWidth
            const posY = y * originalHeight

            // Apply transformations based on position
            ctx.translate(posX + (flipX ? originalWidth : 0), posY + (flipY ? originalHeight : 0))
            ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1)

            // Draw the image
            ctx.drawImage(img, 0, 0, originalWidth, originalHeight)

            ctx.restore()
          }
        }

        // Set background size to create a more detailed pattern
        setBackgroundSize(`${originalWidth * 2}px ${originalHeight * 2}px`)
        setBackgroundPosition("center")
      } else {
        // For non-square images, use a 4x4 grid approach
        const gridSize = 4

        // Set canvas size to accommodate the grid
        canvas.width = originalWidth * gridSize
        canvas.height = originalHeight * gridSize

        // Fill the entire grid with copies of the image
        for (let y = 0; y < gridSize; y++) {
          for (let x = 0; x < gridSize; x++) {
            // For every other position, flip the image horizontally, vertically, or both
            const flipHorizontal = x % 2 === 1
            const flipVertical = y % 2 === 1

            ctx.save()

            // Position at the correct grid cell
            const posX = x * originalWidth
            const posY = y * originalHeight

            if (flipHorizontal && flipVertical) {
              // Flip both horizontally and vertically
              ctx.translate(posX + originalWidth, posY + originalHeight)
              ctx.scale(-1, -1)
              ctx.drawImage(img, 0, 0, originalWidth, originalHeight)
            } else if (flipHorizontal) {
              // Flip horizontally only
              ctx.translate(posX + originalWidth, posY)
              ctx.scale(-1, 1)
              ctx.drawImage(img, 0, 0, originalWidth, originalHeight)
            } else if (flipVertical) {
              // Flip vertically only
              ctx.translate(posX, posY + originalHeight)
              ctx.scale(1, -1)
              ctx.drawImage(img, 0, 0, originalWidth, originalHeight)
            } else {
              // No flip
              ctx.drawImage(img, posX, posY, originalWidth, originalHeight)
            }

            ctx.restore()
          }
        }

        // Set background size to ensure full coverage
        setBackgroundSize(`${originalWidth * 2}px ${originalHeight * 2}px`)
        setBackgroundPosition("center")
      }

      // Store the bookmatched texture with maximum quality
      bookmatchedTextureRef.current = canvas.toDataURL("image/png") // Use PNG for maximum quality
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

  // Determine if we should show loading state
  const showLoading = loading || !textureReady || !allMockupsLoaded

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
              <div className="relative rounded-lg overflow-hidden bg-white border min-h-[400px] flex items-center justify-center">
                {showLoading ? (
                  <div className="flex flex-col items-center justify-center h-[400px] w-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#194a95] mb-4"></div>
                    <p className="text-sm text-gray-500">Loading visualization...</p>
                  </div>
                ) : (
                  <div className="flex justify-center w-full">
                    <div
                      className="relative inline-block max-w-full"
                      style={{
                        backgroundImage: `url(${bookmatchedTextureRef.current || productImage})`,
                        backgroundRepeat: "repeat",
                        backgroundSize: backgroundSize,
                        backgroundPosition: backgroundPosition,
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
