"use client"

import { useEffect } from "react"

export function BackToTop() {
  useEffect(() => {
    // Create the button element
    const button = document.createElement("button")
    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-5 w-5"><path d="m18 15-6-6-6 6"/></svg>`

    // Style the button
    button.style.position = "fixed"
    button.style.bottom = "24px"
    button.style.right = "24px"
    button.style.backgroundColor = "#194a95"
    button.style.color = "white"
    button.style.borderRadius = "9999px"
    button.style.width = "48px"
    button.style.height = "48px"
    button.style.border = "none"
    button.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)"
    button.style.cursor = "pointer"
    button.style.display = "flex"
    button.style.alignItems = "center"
    button.style.justifyContent = "center"
    button.style.zIndex = "9999"
    button.style.opacity = "0"
    button.style.transition = "opacity 0.3s ease"
    button.style.pointerEvents = "none"

    // Add click event
    button.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      })
    })

    // Add the button to the body
    document.body.appendChild(button)

    // Function to toggle visibility
    const toggleVisibility = () => {
      if (window.scrollY > 100) {
        button.style.opacity = "1"
        button.style.pointerEvents = "auto"
      } else {
        button.style.opacity = "0"
        button.style.pointerEvents = "none"
      }
    }

    // Add scroll event listener
    window.addEventListener("scroll", toggleVisibility)

    // Initial check
    toggleVisibility()

    // Clean up
    return () => {
      window.removeEventListener("scroll", toggleVisibility)
      if (document.body.contains(button)) {
        document.body.removeChild(button)
      }
    }
  }, [])

  // Return null since we're creating the button directly in the DOM
  return null
}
