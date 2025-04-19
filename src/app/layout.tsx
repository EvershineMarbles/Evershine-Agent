import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Evershine",
  description: "Evershine - Marble & Granite",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>

        {/* Back to Top Button Script */}
        <Script id="back-to-top-script" strategy="afterInteractive">
          {`
            // Simple Back to Top button script
            ;(() => {
              // Wait for the DOM to be fully loaded
              document.addEventListener("DOMContentLoaded", () => {
                // Create the button element
                var button = document.createElement("button")
                button.id = "back-to-top-button"
                button.setAttribute("aria-label", "Back to top")
                button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style="margin-right: 5px;"><polyline points="18 15 12 9 6 15"></polyline></svg> Top'

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
          `}
        </Script>
      </body>
    </html>
  )
}
