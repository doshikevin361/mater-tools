import twilio from "twilio"

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

if (!accountSid || !authToken || !twilioPhoneNumber) {
  throw new Error("Missing Twilio configuration")
}

const client = twilio(accountSid, authToken)

export interface VoiceOptions {
  voice?: "alice" | "man" | "woman"
  language?: string
  record?: boolean
  timeout?: number
}

export interface TwoWayCallOptions {
  record?: boolean
  transcribe?: boolean
  statusCallback?: string
  userId?: string
}

export const voiceService = {
  async sendVoiceMessage(to: string, message: string, options: VoiceOptions = {}) {
    try {
      const call = await client.calls.create({
        to,
        from: twilioPhoneNumber,
        twiml: `<Response><Say voice="${options.voice || "alice"}" language="${options.language || "en-US"}">${message}</Say></Response>`,
        record: options.record || false,
        timeout: options.timeout || 30,
      })

      return {
        success: true,
        callSid: call.sid,
        status: call.status,
      }
    } catch (error) {
      console.error("Voice message error:", error)
      return {
        success: false,
        error: error.message,
      }
    }
  },

  async sendAudioMessage(to: string, audioUrl: string, options: VoiceOptions = {}) {
    try {
      const call = await client.calls.create({
        to,
        from: twilioPhoneNumber,
        twiml: `<Response><Play>${audioUrl}</Play></Response>`,
        record: options.record || false,
        timeout: options.timeout || 30,
      })

      return {
        success: true,
        callSid: call.sid,
        status: call.status,
      }
    } catch (error) {
      console.error("Audio message error:", error)
      return {
        success: false,
        error: error.message,
      }
    }
  },

  async createTwoWayCall(to: string, options: TwoWayCallOptions = {}) {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

      const call = await client.calls.create({
        to,
        from: twilioPhoneNumber,
        url: `${baseUrl}/api/voice/twiml`,
        record: options.record ? "record-from-answer" : "do-not-record",
        timeout: options.timeout || 30,
        statusCallback: options.statusCallback,
        statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
        statusCallbackMethod: "POST",
        machineDetection: "Enable",
        machineDetectionTimeout: 5,
      })

      console.log(`Two-way call initiated: ${call.sid}`)

      return {
        success: true,
        callSid: call.sid,
        status: call.status,
        to: call.to,
        from: call.from,
        response: call,
      }
    } catch (error) {
      console.error("Two-way call error:", error)
      return {
        success: false,
        error: error.message,
      }
    }
  },

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
      const cleanNumber = formatPhoneNumber(toNumber)

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

      const call = await client.calls.create({
        to: cleanNumber,
        from: twilioPhoneNumber,
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
  },

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
      const cleanNumber = formatPhoneNumber(toNumber)

      console.log(`Making TTS voice call to ${cleanNumber}`)
      console.log(`Message: ${message}`)

      // Create TwiML directly with the message
      const voice = voiceOptions?.voice || "alice"
      const language = voiceOptions?.language || "en-US"

      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="${language}">${escapeXml(message)}</Say>
  <Pause length="1"/>
  <Say voice="${voice}" language="${language}">Thank you for listening. Have a great day!</Say>
</Response>`

      console.log(`Generated TwiML for TTS call:`, twiml)

      const call = await client.calls.create({
        to: cleanNumber,
        from: twilioPhoneNumber,
        twiml: twiml,
        timeout: voiceOptions?.timeout || 30,
        record: voiceOptions?.record || false,
        statusCallback: voiceOptions?.statusCallback,
        statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
        statusCallbackMethod: "POST",
        machineDetection: "Enable",
        machineDetectionTimeout: 5,
      })

      console.log(`TTS call initiated: ${call.sid}`)

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
  },

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

      const conference = await client.conferences.create({
        friendlyName: conferenceName,
        record: options?.record || false,
        statusCallback: options?.statusCallback,
        statusCallbackEvent: ["start", "end", "join", "leave"],
      })

      const calls = []
      for (const participant of participants) {
        const call = await client.calls.create({
          to: formatPhoneNumber(participant),
          from: twilioPhoneNumber,
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
      return {
        success: false,
        error: error.message,
      }
    }
  },

  async forwardCall(fromNumber: string, toNumber: string, options?: { record?: boolean }) {
    try {
      const call = await client.calls.create({
        to: formatPhoneNumber(toNumber),
        from: twilioPhoneNumber,
        twiml: `<Response><Dial record="${options?.record ? "record-from-answer" : "do-not-record"}">${formatPhoneNumber(fromNumber)}</Dial></Response>`,
      })

      return {
        success: true,
        callSid: call.sid,
        status: call.status,
      }
    } catch (error) {
      console.error("Call forwarding error:", error)
      return {
        success: false,
        error: error.message,
      }
    }
  },

  async createInteractiveVoiceResponse(
    toNumber: string,
    menuOptions: Array<{ key: string; action: string; message: string }>,
    welcomeMessage: string,
  ) {
    try {
      let twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${escapeXml(welcomeMessage)}</Say>
  <Gather numDigits="1" action="${process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")}/api/voice/ivr-response" method="POST">
      <Say voice="alice">Press a number to continue.</Say>`

      menuOptions.forEach((option) => {
        twiml += `<Say voice="alice">Press ${option.key} for ${escapeXml(option.message)}</Say>`
      })

      twiml += `</Gather>
  <Say voice="alice">Sorry, I didn't get that. Please try again.</Say>
  <Redirect>${process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")}/api/voice/ivr-response</Redirect>
</Response>`

      const call = await client.calls.create({
        to: formatPhoneNumber(toNumber),
        from: twilioPhoneNumber,
        twiml: twiml,
      })

      return {
        success: true,
        callSid: call.sid,
        status: call.status,
      }
    } catch (error) {
      console.error("IVR creation error:", error)
      return {
        success: false,
        error: error.message,
      }
    }
  },

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

    console.log(`Starting bulk voice calls to ${contacts.length} contacts`)

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

          result = await voiceService.sendAudioMessage(contact.phone, contact.audioUrl, {
            record: voiceOptions?.record,
            statusCallback: voiceOptions?.statusCallback,
          })
        } else {
          const message =
            contact.message ||
            defaultMessage ||
            "Hello, this is an automated message from BrandBuzz Ventures. Thank you for your time."
          result = await voiceService.sendVoiceMessage(contact.phone, message, voiceOptions)
        }

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
  },

  async getCallRecordings(callSid: string) {
    try {
      const recordings = await client.recordings.list({ callSid: callSid })
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
  },

  async getCallAnalytics(callSid: string) {
    try {
      const call = await client.calls(callSid).fetch()
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
  },

  async enableCallRecording(callSid: string) {
    try {
      const recording = await client.calls(callSid).recordings.create({
        recordingStatusCallback: `${process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")}/api/voice/recording-complete`,
        recordingStatusCallbackMethod: "POST",
      })

      return {
        success: true,
        recordingSid: recording.sid,
        status: recording.status,
      }
    } catch (error) {
      console.error("Enable recording error:", error)
      throw error
    }
  },

  async getCallTranscriptions(callSid: string) {
    try {
      const recordings = await client.calls(callSid).recordings.list()
      const transcriptions = []

      for (const recording of recordings) {
        try {
          const recordingTranscriptions = await client.transcriptions.list({
            recordingSid: recording.sid,
          })
          transcriptions.push(...recordingTranscriptions)
        } catch (error) {
          console.error(`Failed to get transcriptions for recording ${recording.sid}:`, error)
        }
      }

      return {
        success: true,
        transcriptions: transcriptions.map((transcription) => ({
          sid: transcription.sid,
          transcriptionText: transcription.transcriptionText,
          status: transcription.status,
          dateCreated: transcription.dateCreated,
          dateUpdated: transcription.dateUpdated,
          price: transcription.price,
          priceUnit: transcription.priceUnit,
        })),
      }
    } catch (error) {
      console.error("Get transcriptions error:", error)
      throw error
    }
  },

  async createConferenceCall(
    participants: string[],
    options?: {
      record?: boolean
      transcribe?: boolean
      statusCallback?: string
      friendlyName?: string
      moderatorNumber?: string
    },
  ) {
    try {
      const conferenceName = options?.friendlyName || `Conference-${Date.now()}`

      console.log(`Creating conference call: ${conferenceName}`)

      // Create the conference
      const conference = await client.conferences.create({
        friendlyName: conferenceName,
        record: options?.record || false,
        statusCallback: options?.statusCallback,
        statusCallbackEvent: ["start", "end", "join", "leave", "participant-join", "participant-leave"],
        statusCallbackMethod: "POST",
      })

      const calls = []

      // If there's a moderator, call them first
      if (options?.moderatorNumber) {
        const moderatorCall = await client.calls.create({
          to: formatPhoneNumber(options.moderatorNumber),
          from: twilioPhoneNumber,
          twiml: `<Response>
          <Say voice="alice">You are joining as the moderator of conference ${conferenceName}.</Say>
          <Dial>
            <Conference startConferenceOnEnter="true" endConferenceOnExit="true">${conferenceName}</Conference>
          </Dial>
        </Response>`,
          statusCallback: options?.statusCallback,
          statusCallbackMethod: "POST",
        })
        calls.push({ type: "moderator", call: moderatorCall })
      }

      // Add all participants
      for (const participant of participants) {
        const call = await client.calls.create({
          to: formatPhoneNumber(participant),
          from: twilioPhoneNumber,
          twiml: `<Response>
          <Say voice="alice">You are joining a conference call. Please wait while we connect you.</Say>
          <Dial>
            <Conference startConferenceOnEnter="${!options?.moderatorNumber}" waitUrl="http://twimlets.com/holdmusic?Bucket=com.twilio.music.ambient">${conferenceName}</Conference>
          </Dial>
        </Response>`,
          statusCallback: options?.statusCallback,
          statusCallbackMethod: "POST",
        })
        calls.push({ type: "participant", call })

        // Add delay between calls to prevent rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      return {
        success: true,
        conferenceSid: conference.sid,
        conferenceName,
        calls,
        totalParticipants: participants.length + (options?.moderatorNumber ? 1 : 0),
      }
    } catch (error) {
      console.error("Conference call creation error:", error)
      return {
        success: false,
        error: error.message,
      }
    }
  },

  async getAccountInfo() {
    try {
      const account = await client.api.accounts(accountSid).fetch()
      const usage = await client.usage.records.list({ category: "calls" })

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
  },
}

function formatPhoneNumber(phoneNumber: string): string {
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

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}
