"use client"

import { useEffect, useState } from "react"

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Create the button element
    const button = document.createElement("button")
    button.id = "back-to-top-button"
    button.setAttribute("aria-label", "Back to top")
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-arrow-up">
        <path d="m5 12 7-7 7 7"></path>
        <path d="M12 19V5"></path>
      </svg>
    `

    // Style the button
    button.style.position = "fixed"
    button.style.bottom = "20px"
    button.style.right = "20px"
    button.style.width = "40px"
    button.style.height = "40px"
    button.style.borderRadius = "50%"
    button.style.backgroundColor = "#0f172a" // Tailwind slate-900
    button.style.color = "white"
    button.style.border = "none"
    button.style.display = "flex"
    button.style.alignItems = "center"
    button.style.justifyContent = "center"
    button.style.cursor = "pointer"
    button.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
    button.style.zIndex = "9999"
    button.style.opacity = "0"
    button.style.visibility = "hidden"
    button.style.transition = "opacity 0.3s, visibility 0.3s"

    // Add the button to the body
    document.body.appendChild(button)
    console.log("Button appended to body")

    // Add click event listener
    button.addEventListener("click", () => {
      console.log("Back to top button clicked")
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      })
    })

    // Add scroll event listener
    const handleScroll = () => {
      console.log("Scroll event detected, current scrollY:", window.scrollY)
      if (window.scrollY > 300) {
        console.log("Should show button (scrollY > 300)")
        button.style.opacity = "1"
        button.style.visibility = "visible"
        setIsVisible(true)
      } else {
        console.log("Should hide button (scrollY <= 300)")
        button.style.opacity = "0"
        button.style.visibility = "hidden"
        setIsVisible(false)
      }
    }

    console.log("Adding scroll event listener")
    window.addEventListener("scroll", handleScroll)

    // Perform initial check
    console.log("Performing initial visibility check")
    handleScroll()

    // Clean up
    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (document.body.contains(button)) {
        document.body.removeChild(button)
      }
    }
  }, [])

  // This component doesn't render anything visible
  return null
}
