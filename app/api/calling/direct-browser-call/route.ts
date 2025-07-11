import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

const accountSid = process.env.TWILIO_ACCOUNT_SID || "AC86b70352ccc2023f8cfa305712b474cd"
const authToken = process.env.TWILIO_AUTH_TOKEN || "your_auth_token"
const apiKey = process.env.TWILIO_API_KEY || "SK0745de76832af1b501e871e36bc467ae"
const apiSecret = process.env.TWILIO_API_SECRET || "Ge1LcneXSoJmREekmK7wmoqsn4E1qOz9"
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || "+19252617266"

const client = twilio(apiKey, apiSecret, { accountSid })

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, action } = await request.json()

    if (action === "start") {
      // Create a direct call that connects browser to phone
      const call = await client.calls.create({
        to: phoneNumber,
        from: twilioPhoneNumber,
        url: "https://master-tool.vercel.app/api/calling/browser-twiml",
        statusCallback: "https://master-tool.vercel.app/api/calling/webhook",
        statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
        record: true,
        recordingStatusCallback: "https://master-tool.vercel.app/api/calling/recording-webhook",
      })

      return NextResponse.json({
        success: true,
        callSid: call.sid,
        message: "Direct browser call started",
      })
    }

    if (action === "generate-token") {
      // Generate Twilio access token for WebRTC
      const AccessToken = twilio.jwt.AccessToken
      const VoiceGrant = AccessToken.VoiceGrant

      const accessToken = new AccessToken(accountSid, apiKey, apiSecret, {
        identity: "browser-user",
      })

      const voiceGrant = new VoiceGrant({
        outgoingApplicationSid: "AP_YOUR_APP_SID", // You need to create this in Twilio Console
        incomingAllow: false,
      })

      accessToken.addGrant(voiceGrant)

      return NextResponse.json({
        success: true,
        token: accessToken.toJwt(),
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Direct browser call error:", error)
    return NextResponse.json({ error: "Failed to start direct browser call" }, { status: 500 })
  }
}
