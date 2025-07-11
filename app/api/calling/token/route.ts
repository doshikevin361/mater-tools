import { type NextRequest, NextResponse } from "next/server"

const accountSid = process.env.TWILIO_ACCOUNT_SID || "AC86b70352ccc2023f8cfa305712b474cd"
const apiKey = process.env.TWILIO_API_KEY || "SK0745de76832af1b501e871e36bc467ae"
const apiSecret = process.env.TWILIO_API_SECRET || "Ge1LcneXSoJmREekmK7wmoqsn4E1qOz9"
const appSid = process.env.TWILIO_TWIML_APP_SID || "APe32c170c79e356138bd267904ffc6814" 


export async function GET(request: NextRequest) {
  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_API_KEY || !TWILIO_API_SECRET || !TWILIO_TWIML_APP_SID) {
      return NextResponse.json({ success: false, error: "Twilio credentials not configured" }, { status: 500 })
    }

    const identity = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const AccessToken = require("twilio").jwt.AccessToken
    const VoiceGrant = AccessToken.VoiceGrant

    const accessToken = new AccessToken(TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET, {
      identity: identity,
    })

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: TWILIO_TWIML_APP_SID,
      incomingAllow: true, // Allow incoming calls
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
