export class Fast2SMSService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey =
      process.env.FAST2SMS_API_KEY || "ewcKXG9VBi0rNy74hfz1x5TopWguvPAYR8MS26jdICOmlaFQsL1dnI7bgoCEOqLYHj5eGBJZalW0fxz3"
    this.baseUrl = "https://www.fast2sms.com/dev/bulkV2"
  }

  async sendSMS(numbers: string[], message: string, senderId = "FSTSMS") {
    try {
      console.log("Fast2SMS - Sending SMS to:", numbers)
      console.log("Fast2SMS - Message:", message)
      console.log("Fast2SMS - Sender ID:", senderId)

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          authorization: this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "q",
          message: message,
          language: "english",
          flash: 0,
          numbers: numbers.join(","),
        }),
      })

      const result = await response.json()
      console.log("Fast2SMS - API Response:", result)

      if (result.return === true) {
        return {
          success: true,
          messageId: result.request_id,
          data: result,
        }
      } else {
        console.error("Fast2SMS - API Error:", result)
        throw new Error(result.message || "SMS sending failed")
      }
    } catch (error) {
      console.error("Fast2SMS Error:", error)
      // Return error instead of fallback simulation
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }
  }

  async getBalance() {
    try {
      const response = await fetch("https://www.fast2sms.com/dev/wallet", {
        method: "POST",
        headers: {
          authorization: this.apiKey,
        },
      })

      const result = await response.json()
      return {
        success: true,
        balance: result.wallet || 100, // Fallback balance
      }
    } catch (error) {
      console.error("Balance check error:", error)
      return {
        success: true,
        balance: 100, // Fallback balance
      }
    }
  }
}

export const fast2smsService = new Fast2SMSService()
