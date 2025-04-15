import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://evershinebackend-2.onrender.com"

// Define interfaces for the client data
interface ClientData {
  name: string
  mobile: string
  email?: string
  city?: string
  profession?: string
  address?: string
  businessName?: string
  // Replace 'any' with a more specific type for additional fields
  [key: string]: string | number | boolean | undefined
}

export const clientAPI = {
  // Send OTP to phone number
  sendOTP: async (phoneNumber: string) => {
    try {
      // Format phone number to E.164 format if it doesn't already start with +
      const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}` // Assuming India country code, adjust as needed

      const response = await axios.post(`${API_BASE_URL}/api/otp/send`, {
        phoneNumber: formattedPhone,
      })

      return {
        success: response.data.success,
        message: response.data.message,
        formattedPhone,
      }
    } catch (error: Error | unknown) {
      console.error("Error sending OTP:", error)
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : error instanceof Error
            ? error.message
            : "Failed to send OTP"

      return {
        success: false,
        message: errorMessage,
      }
    }
  },

  // Verify OTP
  verifyOTP: async (phoneNumber: string, otp: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/otp/verify`, {
        phoneNumber,
        otp,
      })

      return {
        success: response.data.success,
        message: response.data.message,
        data: response.data.data,
      }
    } catch (error: Error | unknown) {
      console.error("Error verifying OTP:", error)
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : error instanceof Error
            ? error.message
            : "Failed to verify OTP"

      return {
        success: false,
        message: errorMessage,
      }
    }
  },

  // Register new client (for agent flow)
  registerClient: async (clientData: ClientData, agentToken: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/create-client`, clientData, {
        headers: {
          Authorization: `Bearer ${agentToken}`,
          "Content-Type": "application/json",
        },
      })

      return {
        success: true,
        message: response.data.message || "Client registered successfully",
        data: response.data.data,
      }
    } catch (error: Error | unknown) {
      console.error("Error registering client:", error)
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : error instanceof Error
            ? error.message
            : "Failed to register client"

      return {
        success: false,
        message: errorMessage,
      }
    }
  },

  // Update client details
  updateClientDetails: async (clientData: Partial<ClientData>, clientToken: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/update-client`, clientData, {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          "Content-Type": "application/json",
        },
      })

      return {
        success: true,
        message: response.data.message || "Client details updated successfully",
        data: response.data.data,
      }
    } catch (error: Error | unknown) {
      console.error("Error updating client details:", error)
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : error instanceof Error
            ? error.message
            : "Failed to update client details"

      return {
        success: false,
        message: errorMessage,
      }
    }
  },
}
