import twilio, { jwt } from "twilio"

// `jwt.AccessToken` contains the class *and* the built-in grants
const { AccessToken } = jwt
const { VoiceGrant } = AccessToken

const accountSid = process.env.TWILIO_ACCOUNT_SID!
const apiKey = process.env.TWILIO_API_KEY!
const apiSecret = process.env.TWILIO_API_SECRET!
const twimlAppSid = process.env.TWILIO_TWIML_APP_SID!
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER!

const client = twilio(accountSid, process.env.TWILIO_AUTH_TOKEN)

export interface CallOptions {
  to: string
  from?: string
  url?: string
  method?: string
  record?: boolean
  recordingChannels?: string
  recordingStatusCallback?: string
}

export interface CallResult {
  success: boolean
  callSid?: string
  error?: string
  message?: string
}

// Generate access token for browser calling
export function generateAccessToken(identity: string): string {
  try {
    const accessToken = new AccessToken(accountSid, apiKey, apiSecret, {
      identity: identity,
      ttl: 3600, // 1 hour
    })

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true,
    })

    accessToken.addGrant(voiceGrant)

    console.log("Generated access token for identity:", identity)
    return accessToken.toJwt()
  } catch (error) {
    console.error("Error generating access token:", error)
    throw new Error("Failed to generate access token")
  }
}

// Make a browser call using TwiML App
export async function makeBrowserCall(options: CallOptions): Promise<CallResult> {
  try {
    console.log("Making browser call with options:", options)

    // Format phone number for Indian numbers
    let formattedTo = options.to
    if (options.to.startsWith("91") && !options.to.startsWith("+91")) {
      formattedTo = `+${options.to}`
    } else if (options.to.length === 10 && !options.to.startsWith("+")) {
      formattedTo = `+91${options.to}`
    }

    const call = await client.calls.create({
      to: formattedTo,
      from: twilioPhoneNumber,
      url: options.url || `${process.env.NEXT_PUBLIC_BASE_URL}/api/calling/twiml-app`,
      method: options.method || "POST",
      record: options.record || true,
      recordingChannels: options.recordingChannels || "dual",
      recordingStatusCallback:
        options.recordingStatusCallback || `${process.env.NEXT_PUBLIC_BASE_URL}/api/calling/recording-webhook`,
      statusCallback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/calling/webhook`,
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      statusCallbackMethod: "POST",
    })

    console.log("Call created successfully:", call.sid)

    return {
      success: true,
      callSid: call.sid,
      message: "Call initiated successfully",
    }
  } catch (error: any) {
    console.error("Error making browser call:", error)
    return {
      success: false,
      error: error.message || "Failed to make call",
      message: "Call failed to initiate",
    }
  }
}

// Make a direct call (not browser-based)
export async function makeDirectCall(options: CallOptions): Promise<CallResult> {
  try {
    console.log("Making direct call with options:", options)

    let formattedTo = options.to
    if (options.to.startsWith("91") && !options.to.startsWith("+91")) {
      formattedTo = `+${options.to}`
    } else if (options.to.length === 10 && !options.to.startsWith("+")) {
      formattedTo = `+91${options.to}`
    }

    const call = await client.calls.create({
      to: formattedTo,
      from: options.from || twilioPhoneNumber,
      url: options.url,
      method: options.method || "POST",
      record: options.record || true,
      recordingChannels: options.recordingChannels || "dual",
      recordingStatusCallback: options.recordingStatusCallback,
      statusCallback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/calling/webhook`,
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      statusCallbackMethod: "POST",
    })

    return {
      success: true,
      callSid: call.sid,
      message: "Call initiated successfully",
    }
  } catch (error: any) {
    console.error("Error making direct call:", error)
    return {
      success: false,
      error: error.message || "Failed to make call",
      message: "Call failed to initiate",
    }
  }
}

// Get call details
export async function getCallDetails(callSid: string) {
  try {
    const call = await client.calls(callSid).fetch()
    return {
      success: true,
      call: {
        sid: call.sid,
        status: call.status,
        duration: call.duration,
        startTime: call.startTime,
        endTime: call.endTime,
        from: call.from,
        to: call.to,
        price: call.price,
        priceUnit: call.priceUnit,
      },
    }
  } catch (error: any) {
    console.error("Error fetching call details:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

// Get call recordings
export async function getCallRecordings(callSid: string) {
  try {
    const recordings = await client.recordings.list({ callSid: callSid })
    return {
      success: true,
      recordings: recordings.map((recording) => ({
        sid: recording.sid,
        duration: recording.duration,
        status: recording.status,
        dateCreated: recording.dateCreated,
        uri: recording.uri,
        mediaUrl: `https://api.twilio.com${recording.uri.replace(".json", ".mp3")}`,
      })),
    }
  } catch (error: any) {
    console.error("Error fetching recordings:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

export { client as twilioClient }
