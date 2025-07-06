import twilio from "twilio"

class TwilioService {
  private client: any
  private accountSid: string
  private apiKey: string
  private apiSecret: string
  private phoneNumber: string

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || "AC86b70352ccc2023f8cfa305712b474cd"
    this.apiKey = process.env.TWILIO_API_KEY || "SK0745de76832af1b501e871e36bc467ae"
    this.apiSecret = process.env.TWILIO_API_SECRET || "Ge1LcneXSoJmREekmK7wmoqsn4E1qOz9"
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER || "+19252617266"

    // Initialize Twilio client with API Key and Secret
    this.client = twilio(this.apiKey, this.apiSecret, {
      accountSid: this.accountSid,
    })
  }

  // Make a voice call with text-to-speech
  async makeVoiceCall(
    toNumber: string,
    message: string,
    voiceOptions?: {
      voice?: "man" | "woman" | "alice"
      language?: string
      speed?: number
    },
  ) {
    try {
      // Clean and format phone number
      const cleanNumber = this.formatPhoneNumber(toNumber)

      // Create TwiML for text-to-speech
      const twiml = this.createTwiML(message, voiceOptions)

      console.log(`Making voice call to ${cleanNumber} with message: ${message.substring(0, 50)}...`)

      const call = await this.client.calls.create({
        to: cleanNumber,
        from: this.phoneNumber,
        twiml: twiml,
        timeout: 30, // Ring for 30 seconds
        record: false, // Don't record the call
      })

      return {
        success: true,
        callSid: call.sid,
        status: call.status,
        to: call.to,
        from: call.from,
        response: call,
      }
    } catch (error) {
      console.error("Twilio voice call error:", error)
      throw new Error(`Voice call failed: ${error.message}`)
    }
  }

  // Make bulk voice calls
  async makeBulkVoiceCalls(
    contacts: Array<{ phone: string; name?: string }>,
    message: string,
    voiceOptions?: {
      voice?: "man" | "woman" | "alice"
      language?: string
      speed?: number
    },
  ) {
    const results = []
    let successful = 0
    let failed = 0

    console.log(`Starting bulk voice calls to ${contacts.length} contacts`)

    for (const contact of contacts) {
      try {
        // Add a small delay between calls to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const result = await this.makeVoiceCall(contact.phone, message, voiceOptions)

        results.push({
          contact: contact,
          success: true,
          callSid: result.callSid,
          status: result.status,
          timestamp: new Date(),
        })

        successful++
        console.log(`✅ Call initiated to ${contact.phone} (${contact.name || "Unknown"})`)
      } catch (error) {
        results.push({
          contact: contact,
          success: false,
          error: error.message,
          timestamp: new Date(),
        })

        failed++
        console.error(`❌ Failed to call ${contact.phone} (${contact.name || "Unknown"}):`, error.message)
      }
    }

    return {
      totalContacts: contacts.length,
      successful,
      failed,
      results,
      successRate: ((successful / contacts.length) * 100).toFixed(1),
    }
  }

  // Create TwiML for text-to-speech
  private createTwiML(
    message: string,
    voiceOptions?: {
      voice?: "man" | "woman" | "alice"
      language?: string
      speed?: number
    },
  ) {
    const voice = voiceOptions?.voice || "alice"
    const language = voiceOptions?.language || "en-US"

    // Create TwiML XML
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="${voice}" language="${language}">${this.escapeXml(message)}</Say>
    <Pause length="1"/>
    <Say voice="${voice}" language="${language}">Thank you for listening. Goodbye!</Say>
</Response>`

    return twiml
  }

  // Format phone number for Twilio (E.164 format)
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, "")

    // If it starts with 91 (India), add + prefix
    if (cleaned.startsWith("91") && cleaned.length === 12) {
      return `+${cleaned}`
    }

    // If it's 10 digits, assume it's Indian number and add +91
    if (cleaned.length === 10) {
      return `+91${cleaned}`
    }

    // If it doesn't start with +, add it
    if (!phoneNumber.startsWith("+")) {
      return `+${cleaned}`
    }

    return phoneNumber
  }

  // Escape XML characters for TwiML
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;")
  }

  // Get call status
  async getCallStatus(callSid: string) {
    try {
      const call = await this.client.calls(callSid).fetch()
      return {
        success: true,
        status: call.status,
        duration: call.duration,
        startTime: call.startTime,
        endTime: call.endTime,
        price: call.price,
        priceUnit: call.priceUnit,
      }
    } catch (error) {
      console.error("Get call status error:", error)
      throw error
    }
  }

  // Get account balance
  async getAccountBalance() {
    try {
      const account = await this.client.api.accounts(this.accountSid).fetch()
      return {
        success: true,
        balance: account.balance,
        currency: account.currency || "USD",
      }
    } catch (error) {
      console.error("Get account balance error:", error)
      throw error
    }
  }
}

export const twilioService = new TwilioService()
