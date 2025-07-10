import twilio from "twilio"

// Check for required environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

// Only warn during build, don't throw
if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.warn(
    "Warning: Twilio configuration missing. Voice features will not work until TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER are set.",
  )
}

// Initialize client only if we have credentials
let client: twilio.Twilio | null = null
if (accountSid && authToken) {
  client = twilio(accountSid, authToken)
}

export interface VoiceMessage {
  to: string
  message: string
  voice?: "alice" | "man" | "woman"
  language?: string
}

export interface VoiceCallOptions {
  to: string
  audioUrl?: string
  message?: string
  voice?: "alice" | "man" | "woman"
  language?: string
  record?: boolean
}

export interface TwoWayCallOptions {
  to: string
  record?: boolean
  transcribe?: boolean
}

export class VoiceService {
  private validateConfig() {
    if (!client || !twilioPhoneNumber) {
      throw new Error(
        "Twilio configuration is missing. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.",
      )
    }
  }

  async sendVoiceMessage(options: VoiceMessage): Promise<any> {
    this.validateConfig()

    try {
      const call = await client!.calls.create({
        to: options.to,
        from: twilioPhoneNumber!,
        twiml: `
          <Response>
            <Say voice="${options.voice || "alice"}" language="${options.language || "en-US"}">
              ${options.message}
            </Say>
          </Response>
        `,
      })

      return {
        success: true,
        callSid: call.sid,
        status: call.status,
      }
    } catch (error: any) {
      console.error("Voice message error:", error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  async sendVoiceCall(options: VoiceCallOptions): Promise<any> {
    this.validateConfig()

    try {
      let twiml = "<Response>"

      if (options.audioUrl) {
        twiml += `<Play>${options.audioUrl}</Play>`
      }

      if (options.message) {
        twiml += `<Say voice="${options.voice || "alice"}" language="${options.language || "en-US"}">${options.message}</Say>`
      }

      twiml += "</Response>"

      const call = await client!.calls.create({
        to: options.to,
        from: twilioPhoneNumber!,
        twiml: twiml,
        record: options.record || false,
      })

      return {
        success: true,
        callSid: call.sid,
        status: call.status,
      }
    } catch (error: any) {
      console.error("Voice call error:", error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  async createTwoWayCall(options: TwoWayCallOptions): Promise<any> {
    this.validateConfig()

    try {
      const call = await client!.calls.create({
        to: options.to,
        from: twilioPhoneNumber!,
        url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/voice/twiml`,
        record: options.record || true,
        recordingStatusCallback: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/voice/recording-complete`,
        transcribe: options.transcribe || true,
        transcribeCallback: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/voice/transcription-complete`,
      })

      return {
        success: true,
        callSid: call.sid,
        status: call.status,
      }
    } catch (error: any) {
      console.error("Two-way call error:", error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  async endCall(callSid: string): Promise<any> {
    this.validateConfig()

    try {
      const call = await client!.calls(callSid).update({
        status: "completed",
      })

      return {
        success: true,
        status: call.status,
      }
    } catch (error: any) {
      console.error("End call error:", error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  async getCallDetails(callSid: string): Promise<any> {
    this.validateConfig()

    try {
      const call = await client!.calls(callSid).fetch()

      return {
        success: true,
        call: {
          sid: call.sid,
          to: call.to,
          from: call.from,
          status: call.status,
          duration: call.duration,
          startTime: call.startTime,
          endTime: call.endTime,
        },
      }
    } catch (error: any) {
      console.error("Get call details error:", error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  async getRecordings(callSid?: string): Promise<any> {
    this.validateConfig()

    try {
      let recordings
      if (callSid) {
        recordings = await client!.recordings.list({ callSid: callSid })
      } else {
        recordings = await client!.recordings.list({ limit: 50 })
      }

      return {
        success: true,
        recordings: recordings.map((recording) => ({
          sid: recording.sid,
          callSid: recording.callSid,
          duration: recording.duration,
          dateCreated: recording.dateCreated,
          uri: recording.uri,
        })),
      }
    } catch (error: any) {
      console.error("Get recordings error:", error)
      return {
        success: false,
        error: error.message,
      }
    }
  }
}

export const voiceService = new VoiceService()
