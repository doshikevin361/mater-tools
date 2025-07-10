import twilio from "twilio"

// Configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

// Initialize Twilio client only if credentials are available
let client: twilio.Twilio | null = null

if (accountSid && authToken) {
  client = twilio(accountSid, authToken)
} else {
  console.warn("Twilio credentials not found. Voice services will not work.")
}

export const voiceService = {
  // Send voice message (existing functionality)
  async sendVoiceMessage(to: string, message: string, voice = "alice") {
    if (!client || !twilioPhoneNumber) {
      throw new Error("Twilio not configured properly")
    }

    try {
      const call = await client.calls.create({
        twiml: `<Response><Say voice="${voice}">${message}</Say></Response>`,
        to,
        from: twilioPhoneNumber,
      })

      return {
        success: true,
        callSid: call.sid,
        status: call.status,
      }
    } catch (error) {
      console.error("Error sending voice message:", error)
      throw error
    }
  },

  // Send audio file (existing functionality)
  async sendAudioFile(to: string, audioUrl: string) {
    if (!client || !twilioPhoneNumber) {
      throw new Error("Twilio not configured properly")
    }

    try {
      const call = await client.calls.create({
        twiml: `<Response><Play>${audioUrl}</Play></Response>`,
        to,
        from: twilioPhoneNumber,
      })

      return {
        success: true,
        callSid: call.sid,
        status: call.status,
      }
    } catch (error) {
      console.error("Error sending audio file:", error)
      throw error
    }
  },

  // Create two-way call (new functionality)
  async createTwoWayCall(to: string, record = true) {
    if (!client || !twilioPhoneNumber) {
      throw new Error("Twilio not configured properly")
    }

    try {
      const call = await client.calls.create({
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/voice/incoming`,
        to,
        from: twilioPhoneNumber,
        record: record,
        recordingStatusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/voice/recording-complete`,
      })

      return {
        sid: call.sid,
        status: call.status,
        to: call.to,
        from: call.from,
      }
    } catch (error) {
      console.error("Error creating two-way call:", error)
      throw error
    }
  },

  // Get call status
  async getCallStatus(callSid: string) {
    if (!client) {
      throw new Error("Twilio not configured properly")
    }

    try {
      const call = await client.calls(callSid).fetch()

      return {
        status: call.status,
        duration: call.duration,
        startTime: call.startTime,
        endTime: call.endTime,
      }
    } catch (error) {
      console.error("Error fetching call status:", error)
      throw error
    }
  },

  // End call
  async endCall(callSid: string) {
    if (!client) {
      throw new Error("Twilio not configured properly")
    }

    try {
      const call = await client.calls(callSid).update({
        status: "completed",
      })

      return {
        success: true,
        status: call.status,
      }
    } catch (error) {
      console.error("Error ending call:", error)
      throw error
    }
  },

  // Get call recordings
  async getCallRecordings(callSid?: string) {
    if (!client) {
      throw new Error("Twilio not configured properly")
    }

    try {
      const recordings = await client.recordings.list({
        callSid: callSid,
        limit: 50,
      })

      return recordings.map((recording) => ({
        sid: recording.sid,
        callSid: recording.callSid,
        duration: recording.duration,
        dateCreated: recording.dateCreated,
        uri: recording.uri,
      }))
    } catch (error) {
      console.error("Error fetching recordings:", error)
      throw error
    }
  },
}
