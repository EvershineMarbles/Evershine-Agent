"use client"

import { useEffect } from "react"

export function BackToTop() {
  useEffect(() => {
    console.log("BackToTop component mounted")

    // Create the button element
    const button = document.createElement("button")
    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-5 w-5"><path d="m18 15-6-6-6 6"/></svg>`
    console.log("Button element created")

    // Style the button
    button.style.position = "fixed"
    button.style.bottom = "24px"
    button.style.right = "24px"
    button.style.backgroundColor = "#ff0000" // Changed to bright red for visibility
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
    console.log("Button styled")

    // Add click event
    button.addEventListener("click", () => {
      console.log("Button clicked, scrolling to top")
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      })
    })

    // Add the button to the body
    document.body.appendChild(button)
    console.log("Button appended to body")

    // Function to toggle visibility
    const toggleVisibility = () => {
      const scrollY = window.scrollY
      console.log("Scroll event detected, current scrollY:", scrollY)

      if (scrollY > 100) {
        console.log("Should show button (scrollY > 100)")
        button.style.opacity = "1"
        button.style.pointerEvents = "auto"
      } else {
        console.log("Should hide button (scrollY <= 100)")
        button.style.opacity = "0"
        button.style.pointerEvents = "none"
      }
    }

    // Add scroll event listener
    console.log("Adding scroll event listener")
    window.addEventListener("scroll", toggleVisibility)

    // Initial check
    console.log("Performing initial visibility check")
    toggleVisibility()

    // Clean up
    return () => {
      console.log("BackToTop component unmounting, cleaning up")
      window.removeEventListener("scroll", toggleVisibility)
      if (document.body.contains(button)) {
        document.body.removeChild(button)
        console.log("Button removed from body")
      }
    }
  }, [])

  // Return null since we're creating the button directly in the DOM
  return null
}
