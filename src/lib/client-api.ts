import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

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
    } catch (error: any) {
      console.error("Error sending OTP:", error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || "Failed to send OTP",
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
    } catch (error: any) {
      console.error("Error verifying OTP:", error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || "Failed to verify OTP",
      }
    }
  },

  // Register new client (for agent flow)
  registerClient: async (clientData: any, agentToken: string) => {
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
    } catch (error: any) {
      console.error("Error registering client:", error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || "Failed to register client",
      }
    }
  },

  // Update client details
  updateClientDetails: async (clientData: any, clientToken: string) => {
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
    } catch (error: any) {
      console.error("Error updating client details:", error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || "Failed to update client details",
      }
    }
  },
}
