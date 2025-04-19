"use client"

import { useEffect, useState } from "react"

export default function DebugScroll() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
      console.log("Current scroll position:", window.scrollY)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return <div className="fixed top-0 left-0 bg-black/70 text-white p-2 z-[10000]">Scroll: {scrollY}px</div>
}
