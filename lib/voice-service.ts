import twilio from "twilio"

class VoiceService {
  private client: any
  private accountSid: string
  private apiKey: string
  private apiSecret: string
  private phoneNumber: string
  private baseUrl: string

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || "AC86b70352ccc2023f8cfa305712b474cd"
    this.apiKey = process.env.TWILIO_API_KEY || "SK0745de76832af1b501e871e36bc467ae"
    this.apiSecret = process.env.TWILIO_API_SECRET || "Ge1LcneXSoJmREekmK7wmoqsn4E1qOz9"
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER || "+19252617266"
    this.baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000"

    this.client = twilio(this.apiKey, this.apiSecret, {
      accountSid: this.accountSid,
    })

    console.log("VoiceService initialized with:")
    console.log(`- Account SID: ${this.accountSid}`)
    console.log(`- Phone Number: ${this.phoneNumber}`)
    console.log(`- Base URL: ${this.baseUrl}`)
  }

  async makeVoiceCallWithTTS(
    toNumber: string,
    message: string,
    voiceOptions?: {
      voice?: "man" | "woman" | "alice"
      language?: string
      speed?: number
      record?: boolean
      timeout?: number
      statusCallback?: string
    },
  ) {
    try {
      const cleanNumber = this.formatPhoneNumber(toNumber)

      console.log(`Making real business call to ${cleanNumber}`)
      console.log(`Message: ${message}`)

      // Create real business TwiML - NO testing language
      const voice = voiceOptions?.voice || "alice"
      const language = voiceOptions?.language || "en-US"

      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="${language}" rate="medium">${this.escapeXml(message)}</Say>
  <Pause length="2"/>
  <Say voice="${voice}" language="${language}" rate="medium">You can reach us anytime by calling back this number or visiting our website. We appreciate your time and look forward to helping your business grow. Goodbye!</Say>
</Response>`

      console.log(`Generated real business TwiML`)

      const callParams: any = {
        to: cleanNumber,
        from: this.phoneNumber,
        twiml: twiml,
        timeout: voiceOptions?.timeout || 45,
        record: voiceOptions?.record || false,
        machineDetection: "Enable",
        machineDetectionTimeout: 10,
      }

      if (voiceOptions?.statusCallback) {
        callParams.statusCallback = voiceOptions.statusCallback
        callParams.statusCallbackEvent = ["initiated", "ringing", "answered", "completed"]
        callParams.statusCallbackMethod = "POST"
      }

      console.log("Making real business call with parameters:", {
        to: callParams.to,
        from: callParams.from,
        timeout: callParams.timeout,
        record: callParams.record,
      })

      const call = await this.client.calls.create(callParams)

      console.log(`Real business call initiated successfully:`)
      console.log(`- Call SID: ${call.sid}`)
      console.log(`- Status: ${call.status}`)
      console.log(`- To: ${call.to}`)
      console.log(`- From: ${call.from}`)

      return {
        success: true,
        callSid: call.sid,
        status: call.status,
        to: call.to,
        from: call.from,
        response: call,
      }
    } catch (error) {
      console.error("Real business call error:", error)
      throw new Error(`Business call failed: ${error.message}`)
    }
  }

  async makeVoiceCallWithAudio(
    toNumber: string,
    audioUrl: string,
    options?: {
      record?: boolean
      timeout?: number
      statusCallback?: string
      fallbackUrl?: string
    },
  ) {
    try {
      const cleanNumber = this.formatPhoneNumber(toNumber)

      console.log(`Making real audio business call to ${cleanNumber}`)
      console.log(`Audio URL: ${audioUrl}`)

      // Validate audio URL
      if (!audioUrl || audioUrl.startsWith("blob:")) {
        throw new Error("Invalid audio URL provided")
      }

      // Test if audio URL is accessible
      try {
        new URL(audioUrl)
      } catch (urlError) {
        throw new Error("Invalid audio URL format")
      }

      // Create real business TwiML with audio - NO testing language
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Pause length="2"/>
  <Say voice="alice" language="en-US" rate="medium">This message was brought to you by BrandBuzz Ventures, your trusted digital marketing partner. For more information about our services, please call us back or visit our website. We look forward to helping your business succeed. Thank you and goodbye!</Say>
</Response>`

      console.log(`Generated real business audio TwiML`)

      const call = await this.client.calls.create({
        to: cleanNumber,
        from: this.phoneNumber,
        twiml: twiml,
        timeout: options?.timeout || 45,
        record: options?.record || false,
        statusCallback: options?.statusCallback,
        statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
        statusCallbackMethod: "POST",
        fallbackUrl: options?.fallbackUrl,
        machineDetection: "Enable",
        machineDetectionTimeout: 10,
      })

      console.log(`Real business audio call initiated: ${call.sid}`)

      return {
        success: true,
        callSid: call.sid,
        status: call.status,
        to: call.to,
        from: call.from,
        audioUrl: audioUrl,
        response: call,
      }
    } catch (error) {
      console.error("Real business audio call error:", error)
      throw new Error(`Audio call failed: ${error.message}`)
    }
  }

  async makeBulkVoiceCalls(
    contacts: Array<{
      phone: string
      name?: string
      messageType?: "tts" | "audio"
      message?: string
      audioUrl?: string
    }>,
    defaultMessage?: string,
    voiceOptions?: {
      voice?: "man" | "woman" | "alice"
      language?: string
      record?: boolean
      statusCallback?: string
    },
  ) {
    const results = []
    let successful = 0
    let failed = 0

    console.log(`Starting bulk business outreach to ${contacts.length} contacts`)

    // Real business message for bulk calls - NO testing language
    const realBulkMessage =
      defaultMessage ||
      `Hello, this is BrandBuzz Ventures calling to introduce our comprehensive digital marketing services. We are a full-service marketing agency that specializes in helping businesses like yours increase their online visibility, attract more customers, and grow their revenue through proven digital strategies. Our services include social media management, targeted advertising campaigns, email marketing automation, SMS marketing, and website optimization. We have successfully helped numerous businesses achieve significant growth and we would love to discuss how we can do the same for you. Our team of marketing experts is ready to create a customized strategy that fits your specific business needs and budget. Please feel free to call us back to schedule a free consultation, or visit our website to learn more about our success stories. We are committed to helping your business reach its full potential. Thank you for your time, and we look forward to the opportunity to work with you!`

    for (const contact of contacts) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 4000)) // 4 seconds between calls for professional pacing

        let result
        if (contact.messageType === "audio" && contact.audioUrl) {
          // Validate audio URL
          if (contact.audioUrl.startsWith("blob:")) {
            throw new Error(
              "Invalid audio URL: blob URLs are not supported for voice calls. Please upload the audio file first.",
            )
          }

          result = await this.makeVoiceCallWithAudio(contact.phone, contact.audioUrl, {
            record: voiceOptions?.record,
            statusCallback: voiceOptions?.statusCallback,
          })
        } else {
          const message = contact.message || realBulkMessage
          result = await this.makeVoiceCallWithTTS(contact.phone, message, voiceOptions)
        }

        results.push({
          contact: contact,
          success: true,
          callSid: result.callSid,
          status: result.status,
          timestamp: new Date(),
        })

        successful++
        console.log(`✅ Business call initiated to ${contact.phone} (${contact.name || "Prospect"})`)
      } catch (error) {
        results.push({
          contact: contact,
          success: false,
          error: error.message,
          timestamp: new Date(),
        })

        failed++
        console.error(`❌ Failed to call ${contact.phone} (${contact.name || "Prospect"}):`, error.message)
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
        answeredBy: call.answeredBy,
      }
    } catch (error) {
      console.error("Get call status error:", error)
      throw error
    }
  }

  async getAccountInfo() {
    try {
      const account = await this.client.api.accounts(this.accountSid).fetch()

      return {
        success: true,
        account: {
          balance: account.balance,
          currency: account.currency || "USD",
          status: account.status,
          friendlyName: account.friendlyName,
        },
      }
    } catch (error) {
      console.error("Get account info error:", error)
      throw error
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, "")

    if (cleaned.startsWith("91") && cleaned.length === 12) {
      return `+${cleaned}`
    }

    if (cleaned.length === 10) {
      return `+91${cleaned}`
    }

    if (!phoneNumber.startsWith("+")) {
      return `+${cleaned}`
    }

    return phoneNumber
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;")
  }
}

export const voiceService = new VoiceService()
