"use client"

import { useState, useEffect } from "react"
import { ArrowUp } from "lucide-react"

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)

  console.log("BackToTop component rendered")

  useEffect(() => {
    console.log("BackToTop useEffect running")

    // Function to handle scroll event
    const handleScroll = () => {
      const currentScrollPos = window.scrollY
      setScrollPosition(currentScrollPos)

      // Show button when page is scrolled down 300px or more
      const shouldBeVisible = currentScrollPos > 300
      console.log(`Scroll detected - Position: ${currentScrollPos}, Should be visible: ${shouldBeVisible}`)

      setIsVisible(shouldBeVisible)
    }

    // Log initial state
    console.log("Adding scroll event listener")

    // Add event listener
    window.addEventListener("scroll", handleScroll)

    // Initial check in case page is already scrolled
    handleScroll()

    // Clean up
    return () => {
      console.log("Removing scroll event listener")
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Scroll to top function
  const scrollToTop = () => {
    console.log("Scroll to top clicked")
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  console.log(`Button state - isVisible: ${isVisible}, scrollPosition: ${scrollPosition}`)

  // ALWAYS render the button - one visible for debugging, one that follows the visibility state
  return (
    <>
      {/* Debug version - always visible */}
      <button
        onClick={scrollToTop}
        className="fixed top-20 right-6 p-3 bg-red-500 text-white rounded-full shadow-lg z-[9999]"
        aria-label="Debug Back to top"
      >
        <ArrowUp className="h-5 w-5" />
        <span className="sr-only">Debug</span>
      </button>

      {/* Regular version with visibility state */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 p-4 bg-[#194a95] text-white rounded-full shadow-lg hover:bg-[#194a95]/90 transition-all z-[9999] border-2 border-white
          ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        style={{
          transform: isVisible ? "scale(1)" : "scale(0.8)",
          transition: "opacity 0.3s, transform 0.3s",
        }}
        aria-label="Back to top"
      >
        <ArrowUp className="h-6 w-6" />
      </button>
    </>
  )
}
