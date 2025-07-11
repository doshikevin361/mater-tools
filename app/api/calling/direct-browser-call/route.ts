import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || "+19252617266"

if (!accountSid || !authToken) {
  console.error("Missing Twilio credentials")
}

const client = twilio(accountSid, authToken)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, phoneNumber, userId } = body

    if (action === "generate-token") {
      // Generate Twilio access token for browser calling
      const AccessToken = twilio.jwt.AccessToken
      const VoiceGrant = AccessToken.VoiceGrant

      const accessToken = new AccessToken(
        accountSid!,
        process.env.TWILIO_API_KEY || accountSid!,
        process.env.TWILIO_API_SECRET || authToken!,
        { identity: userId || "browser-user" },
      )

      const voiceGrant = new VoiceGrant({
        outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
        incomingAllow: true,
      })

      accessToken.addGrant(voiceGrant)

      return NextResponse.json({
        success: true,
        token: accessToken.toJwt(),
      })
    }

    if (action === "start" && phoneNumber) {
      // Make direct call using Twilio REST API
      const call = await client.calls.create({
        to: phoneNumber,
        from: twilioPhoneNumber,
        url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://your-domain.vercel.app"}/api/calling/browser-twiml`,
        record: true,
        recordingStatusCallback: `${process.env.NEXT_PUBLIC_BASE_URL || "https://your-domain.vercel.app"}/api/calling/recording-webhook`,
        statusCallback: `${process.env.NEXT_PUBLIC_BASE_URL || "https://your-domain.vercel.app"}/api/calling/webhook`,
        statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
        statusCallbackMethod: "POST",
      })

      return NextResponse.json({
        success: true,
        callSid: call.sid,
        status: call.status,
      })
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Direct browser call error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
