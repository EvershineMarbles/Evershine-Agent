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
  // NEW: Check if client exists by mobile number
  checkExistingClient: async (mobile: string) => {
    try {
      // Format phone number if needed
      const phoneNumber = mobile.startsWith("+") ? mobile : `+91${mobile}`

      const response = await axios.post(`${API_BASE_URL}/check-existing-client`, {
        mobile: phoneNumber,
      })

      return {
        success: true,
        exists: response.data.exists,
        message: response.data.message,
        clientName: response.data.clientName,
        clientId: response.data.clientId,
      }
    } catch (error: any) {
      console.error("Error checking client:", error)

      // If the endpoint doesn't exist (404), we'll handle this gracefully
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log("Check-existing-client endpoint not found, will determine during registration")
        return {
          success: true,
          exists: false, // Assume new client, let registration handle duplicates
          message: "Client check endpoint not available",
        }
      }

      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : error instanceof Error
            ? error.message
            : "Failed to check client"

      return {
        success: false,
        exists: false,
        message: errorMessage,
      }
    }
  },

  // NEW: Agent impersonate client
  agentImpersonateClient: async (clientId: string, agentToken: string) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/agent/impersonate/${clientId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${agentToken}`,
          },
        },
      )

      return {
        success: true,
        impersonationToken: response.data.data.impersonationToken,
        clientDetails: response.data.data.clientDetails,
        message: "Successfully generated impersonation token",
      }
    } catch (error: any) {
      console.error("Error impersonating client:", error)
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : error instanceof Error
            ? error.message
            : "Failed to impersonate client"

      return {
        success: false,
        message: errorMessage,
      }
    }
  },

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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
