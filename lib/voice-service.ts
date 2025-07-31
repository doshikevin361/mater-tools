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
      if (!audioUrl || audioUrl.startsWith("blob:")) {
        throw new Error("Invalid audio URL provided")
      }

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

      const voice = voiceOptions?.voice || "alice"
      const language = voiceOptions?.language || "en-US"

      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="${language}">${this.escapeXml(message)}</Say>
  <Pause length="1"/>
  <Say voice="${voice}" language="${language}">Thank you for listening. Have a great day!</Say>
</Response>`


      const call = await this.client.calls.create({
        to: cleanNumber,
        from: this.phoneNumber,
        twiml: twiml,
        timeout: voiceOptions?.timeout || 30,
        record: voiceOptions?.record || false,
        statusCallback: voiceOptions?.statusCallback,
        statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
        statusCallbackMethod: "POST",
        machineDetection: "Enable",
        machineDetectionTimeout: 5,
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
      console.error("TTS voice call error:", error)
      throw new Error(`Voice call failed: ${error.message}`)
    }
  }

  async createConference(
    participants: string[],
    options?: {
      record?: boolean
      statusCallback?: string
      friendlyName?: string
    },
  ) {
    try {
      const conferenceName = options?.friendlyName || `Conference-${Date.now()}`

      const conference = await this.client.conferences.create({
        friendlyName: conferenceName,
        record: options?.record || false,
        statusCallback: options?.statusCallback,
        statusCallbackEvent: ["start", "end", "join", "leave"],
      })

      const calls = []
      for (const participant of participants) {
        const call = await this.client.calls.create({
          to: this.formatPhoneNumber(participant),
          from: this.phoneNumber,
          twiml: `<Response><Dial><Conference>${conferenceName}</Conference></Dial></Response>`,
        })
        calls.push(call)
      }

      return {
        success: true,
        conferenceSid: conference.sid,
        conferenceName,
        calls,
      }
    } catch (error) {
      console.error("Conference creation error:", error)
      throw error
    }
  }

  async forwardCall(fromNumber: string, toNumber: string, options?: { record?: boolean }) {
    try {
      const call = await this.client.calls.create({
        to: this.formatPhoneNumber(toNumber),
        from: this.phoneNumber,
        twiml: `<Response><Dial record="${options?.record ? "record-from-answer" : "do-not-record"}">${this.formatPhoneNumber(fromNumber)}</Dial></Response>`,
      })

      return {
        success: true,
        callSid: call.sid,
        status: call.status,
      }
    } catch (error) {
      console.error("Call forwarding error:", error)
      throw error
    }
  }

  async createInteractiveVoiceResponse(
    toNumber: string,
    menuOptions: Array<{ key: string; action: string; message: string }>,
    welcomeMessage: string,
  ) {
    try {
      let twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${this.escapeXml(welcomeMessage)}</Say>
  <Gather numDigits="1" action="${this.baseUrl}/api/voice/ivr-response" method="POST">
      <Say voice="alice">Press a number to continue.</Say>`

      menuOptions.forEach((option) => {
        twiml += `<Say voice="alice">Press ${option.key} for ${this.escapeXml(option.message)}</Say>`
      })

      twiml += `</Gather>
  <Say voice="alice">Sorry, I didn't get that. Please try again.</Say>
  <Redirect>${this.baseUrl}/api/voice/ivr-response</Redirect>
</Response>`

      const call = await this.client.calls.create({
        to: this.formatPhoneNumber(toNumber),
        from: this.phoneNumber,
        twiml: twiml,
      })

      return {
        success: true,
        callSid: call.sid,
        status: call.status,
      }
    } catch (error) {
      console.error("IVR creation error:", error)
      throw error
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


    for (const contact of contacts) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000)) // Rate limiting - 2 seconds between calls

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
          const message =
            contact.message ||
            defaultMessage ||
            "Hello, this is an automated message from BrandBuzz Ventures. Thank you for your time."
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

  async getCallRecordings(callSid: string) {
    try {
      const recordings = await this.client.recordings.list({ callSid: callSid })
      return {
        success: true,
        recordings: recordings.map((recording) => ({
          sid: recording.sid,
          duration: recording.duration,
          dateCreated: recording.dateCreated,
          uri: recording.uri,
          mediaUrl: `https://api.twilio.com${recording.uri.replace(".json", ".mp3")}`,
        })),
      }
    } catch (error) {
      console.error("Get recordings error:", error)
      throw error
    }
  }

  async getCallAnalytics(callSid: string) {
    try {
      const call = await this.client.calls(callSid).fetch()
      return {
        success: true,
        analytics: {
          sid: call.sid,
          status: call.status,
          duration: call.duration,
          startTime: call.startTime,
          endTime: call.endTime,
          price: call.price,
          priceUnit: call.priceUnit,
          direction: call.direction,
          answeredBy: call.answeredBy,
        },
      }
    } catch (error) {
      console.error("Get call analytics error:", error)
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

  async getAccountInfo() {
    try {
      const account = await this.client.api.accounts(this.accountSid).fetch()
      const usage = await this.client.usage.records.list({ category: "calls" })

      return {
        success: true,
        account: {
          balance: account.balance,
          currency: account.currency || "USD",
          status: account.status,
        },
        usage: usage.map((record) => ({
          category: record.category,
          count: record.count,
          usage: record.usage,
          price: record.price,
          priceUnit: record.priceUnit,
        })),
      }
    } catch (error) {
      console.error("Get account info error:", error)
      throw error
    }
  }
}

export const voiceService = new VoiceService()
