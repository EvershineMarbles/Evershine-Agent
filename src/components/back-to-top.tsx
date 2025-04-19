// Simple Back to Top button script
;(() => {
    // Wait for the DOM to be fully loaded
    document.addEventListener("DOMContentLoaded", () => {
      // Create the button element
      var button = document.createElement("button")
      button.id = "back-to-top-button"
      button.setAttribute("aria-label", "Back to top")
      button.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>'
      button.innerText = "Top"
  
      // Style the button
      button.style.position = "fixed"
      button.style.bottom = "20px"
      button.style.right = "20px"
      button.style.padding = "10px 15px"
      button.style.backgroundColor = "#0f172a" // Tailwind slate-900
      button.style.color = "white"
      button.style.border = "none"
      button.style.borderRadius = "4px"
      button.style.cursor = "pointer"
      button.style.fontWeight = "bold"
      button.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
      button.style.zIndex = "9999"
      button.style.display = "flex"
      button.style.alignItems = "center"
      button.style.justifyContent = "center"
      button.style.gap = "5px"
  
      // Add the button to the body
      document.body.appendChild(button)
      console.log("Back to Top button added to page")
  
      // Add click event listener
      button.addEventListener("click", () => {
        console.log("Back to Top button clicked")
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        })
      })
    })
  })()
  