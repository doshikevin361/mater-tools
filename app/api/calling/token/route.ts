import { type NextRequest, NextResponse } from "next/server"

const accountSid = process.env.TWILIO_ACCOUNT_SID || "AC86b70352ccc2023f8cfa305712b474cd"
const apiKey = process.env.TWILIO_API_KEY || "SK0745de76832af1b501e871e36bc467ae"
const apiSecret = process.env.TWILIO_API_SECRET || "Ge1LcneXSoJmREekmK7wmoqsn4E1qOz9"
const appSid = process.env.TWILIO_TWIML_APP_SID || "APe32c170c79e356138bd267904ffc6814"

export async function GET(request: NextRequest) {
  try {
    // Fix: Use correct variable names
    if (!accountSid || !apiKey || !apiSecret || !appSid) {
      return NextResponse.json({ success: false, error: "Twilio credentials not configured" }, { status: 500 })
    }

    const identity = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const AccessToken = require("twilio").jwt.AccessToken
    const VoiceGrant = AccessToken.VoiceGrant

    // Fix: Use correct variable names
    const accessToken = new AccessToken(accountSid, apiKey, apiSecret, {
      identity: identity,
    })

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: appSid, // Fix: Use correct variable name
      incomingAllow: true,
    })

    accessToken.addGrant(voiceGrant)

    const token = accessToken.toJwt()

    return NextResponse.json({
      success: true,
      token: token,
      identity: identity,
    })
  } catch (error) {
    console.error("Error generating access token:", error)
    return NextResponse.json({ success: false, error: "Failed to generate access token" }, { status: 500 })
  }
}
