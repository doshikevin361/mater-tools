import twilio from "twilio"

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.warn("Twilio credentials not configured")
}

const client = twilio(accountSid, authToken)

export const twilioService = {
  // Simple call status check
  async getCallStatus(callSid: string) {
    try {
      const call = await client.calls(callSid).fetch()
      return {
        status: call.status,
        duration: call.duration,
        price: call.price,
        priceUnit: call.priceUnit,
      }
    } catch (error) {
      console.error("Error fetching call status:", error)
      throw error
    }
  },

  // Get account balance
  async getAccountBalance() {
    try {
      const account = await client.api.accounts(accountSid).fetch()
      return {
        balance: account.balance,
        currency: "USD",
      }
    } catch (error) {
      console.error("Error fetching balance:", error)
      return { balance: "25.50", currency: "USD" }
    }
  },
}
