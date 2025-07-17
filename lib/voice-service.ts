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

      console.log(`Making TTS voice call to ${cleanNumber}`)
      console.log(`Message: ${message}`)

      // Create TwiML directly with the message
      const voice = voiceOptions?.voice || "alice"
      const language = voiceOptions?.language || "en-US"

      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="${language}">${this.escapeXml(message)}</Say>
  <Pause length="1"/>
  <Say voice="${voice}" language="${language}">Thank you for listening. Have a great day!</Say>
</Response>`

      console.log(`Generated TwiML for TTS call:`, twiml)

      const callParams: any = {
        to: cleanNumber,
        from: this.phoneNumber,
        twiml: twiml,
        timeout: voiceOptions?.timeout || 30,
        record: voiceOptions?.record || false,
        machineDetection: "Enable",
        machineDetectionTimeout: 5,
      }

      if (voiceOptions?.statusCallback) {
        callParams.statusCallback = voiceOptions.statusCallback
        callParams.statusCallbackEvent = ["initiated", "ringing", "answered", "completed"]
        callParams.statusCallbackMethod = "POST"
      }

      console.log("Twilio call parameters:", callParams)

      const call = await this.client.calls.create(callParams)

      console.log(`TTS call initiated successfully:`)
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
      console.error("TTS voice call error:", error)
      throw new Error(`Voice call failed: ${error.message}`)
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

      console.log(`Making voice call with audio to ${cleanNumber}`)
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

      // Create TwiML directly with the audio URL
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Pause length="1"/>
  <Say voice="alice" language="en-US">Thank you for listening. Have a great day!</Say>
</Response>`

      console.log(`Generated TwiML for audio call:`, twiml)

      const call = await this.client.calls.create({
        to: cleanNumber,
        from: this.phoneNumber,
        twiml: twiml,
        timeout: options?.timeout || 30,
        record: options?.record || false,
        statusCallback: options?.statusCallback,
        statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
        statusCallbackMethod: "POST",
        fallbackUrl: options?.fallbackUrl,
        machineDetection: "Enable",
        machineDetectionTimeout: 5,
      })

      console.log(`Call initiated: ${call.sid} with audio: ${audioUrl}`)

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
      console.error("Voice call with audio error:", error)
      throw new Error(`Voice call failed: ${error.message}`)
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
