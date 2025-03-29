"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Force the initial state to match what will be used on the client
  const [mounted, setMounted] = React.useState(false)

  // After hydration, we can safely show the UI
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent theme flashing by not rendering until client-side
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

