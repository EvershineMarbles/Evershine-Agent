"use server"

// Generate a random 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendOtp(phoneNumber: string) {
  try {
    // Validate phone number format (basic E.164 validation)
    if (!phoneNumber.startsWith("+")) {
      return {
        success: false,
        error: "Phone number must be in E.164 format (starting with +)",
      }
    }

    // Generate OTP
    const otp = generateOTP()

    // Get Twilio credentials from environment variables
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      return {
        success: false,
        error: "Twilio credentials are not properly configured",
      }
    }

    // Create the authorization header for Twilio API
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64")

    // Use fetch to call Twilio API directly instead of using the SDK
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

    const formData = new URLSearchParams()
    formData.append("To", phoneNumber)
    formData.append("From", twilioPhoneNumber)
    formData.append("Body", `Your verification code is: ${otp}`)

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("Twilio API error:", result)
      return {
        success: false,
        error: result.message || "Failed to send OTP",
      }
    }

    console.log("Message SID:", result.sid)
    return { success: true, message: "OTP sent successfully" }
  } catch (error) {
    console.error("Error sending OTP:", error)
    // Fix the type error by properly handling the unknown type
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return {
      success: false,
      error: `An unexpected error occurred: ${errorMessage}`,
    }
  }
}

