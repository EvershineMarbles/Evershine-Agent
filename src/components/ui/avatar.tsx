"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import Image from "next/image"

import { cn } from "@/lib/utils"

const avatarVariants = cva("inline-flex items-center justify-center rounded-full", {
  variants: {
    size: {
      sm: "h-8 w-8",
      md: "h-10 w-10",
      lg: "h-12 w-12",
      xl: "h-16 w-16",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof avatarVariants> {
  src?: string
  alt?: string
  fallback?: React.ReactNode
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, src, alt = "", fallback, ...props }, ref) => {
    const [hasError, setHasError] = React.useState(false)

    return (
      <div ref={ref} className={cn(avatarVariants({ size }), className)} {...props}>
        {src && !hasError ? (
          <Image
            src={src || "/placeholder.svg"}
            alt={alt}
            width={size === "xl" ? 64 : size === "lg" ? 48 : size === "md" ? 40 : 32}
            height={size === "xl" ? 64 : size === "lg" ? 48 : size === "md" ? 40 : 32}
            className="h-full w-full rounded-full object-cover"
            onError={() => setHasError(true)}
          />
        ) : (
          fallback || (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">
              <span className="text-sm font-medium uppercase text-muted-foreground">{alt.slice(0, 2)}</span>
            </div>
          )
        )}
      </div>
    )
  },
)
Avatar.displayName = "Avatar"

export { Avatar, avatarVariants }

