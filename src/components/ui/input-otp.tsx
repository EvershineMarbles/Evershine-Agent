"use client"

import * as React from "react"

// Simple stub components that can be imported but don't do anything
// This prevents import errors in files that might be using the OTP component

const InputOTP = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => {
  return <div ref={ref} {...props} />
})
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => {
  return <div ref={ref} {...props} />
})
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => {
  return <div ref={ref} {...props} />
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => {
  return <div ref={ref} {...props} />
})
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
