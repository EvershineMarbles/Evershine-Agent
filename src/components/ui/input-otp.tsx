"use client"

import * as React from "react"
import OtpInput from "react-otp-input"

import { cn } from "@/lib/utils"

const InputOTP = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string
    onChange: (value: string) => void
    numInputs?: number
    renderSeparator?: React.ReactNode
    renderInput?: (props: any) => React.ReactNode
    containerStyle?: React.CSSProperties
    inputStyle?: React.CSSProperties
  }
>(
  (
    { className, value, onChange, numInputs = 6, renderSeparator, renderInput, containerStyle, inputStyle, ...props },
    ref,
  ) => (
    <div ref={ref} className={cn("flex w-full", className)} {...props}>
      <OtpInput
        value={value}
        onChange={onChange}
        numInputs={numInputs}
        renderSeparator={renderSeparator}
        renderInput={renderInput}
        containerStyle={containerStyle || { width: "100%", justifyContent: "space-between" }}
        inputStyle={
          inputStyle || {
            width: "40px",
            height: "40px",
            margin: "0 4px",
            fontSize: "16px",
            borderRadius: "4px",
            border: "1px solid #d1d5db",
          }
        }
      />
    </div>
  ),
)
InputOTP.displayName = "InputOTP"

export { InputOTP }
