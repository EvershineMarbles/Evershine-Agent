"use client"

import { useState, useEffect } from "react"
import { ArrowUp } from "lucide-react"

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Function to handle scroll event
    const handleScroll = () => {
      // Show button when page is scrolled down 300px or more
      const scrolled = window.scrollY > 300
      setIsVisible(scrolled)
      console.log("Scroll position:", window.scrollY, "Button visible:", scrolled) // Debug log
    }

    // Add event listener
    window.addEventListener("scroll", handleScroll)

    // Initial check in case page is already scrolled
    handleScroll()

    // Clean up
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Scroll to top function
  const scrollToTop = () => {
    console.log("Scroll to top clicked") // Debug log
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  // Always render the button, but control visibility with CSS
  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 p-3 bg-[#194a95] text-white rounded-full shadow-lg hover:bg-[#194a95]/90 transition-all z-[9999] ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-label="Back to top"
      style={{
        transform: isVisible ? "scale(1)" : "scale(0.8)",
        transition: "opacity 0.3s, transform 0.3s",
      }}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  )
}
