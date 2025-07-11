import { type NextRequest, NextResponse } from "next/server"

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_API_KEY = process.env.TWILIO_API_KEY
const TWILIO_API_SECRET = process.env.TWILIO_API_SECRET
const TWILIO_TWIML_APP_SID = process.env.TWILIO_TWIML_APP_SID

export async function GET(request: NextRequest) {
  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_API_KEY || !TWILIO_API_SECRET || !TWILIO_TWIML_APP_SID) {
      return NextResponse.json({ success: false, error: "Twilio credentials not configured" }, { status: 500 })
    }

    // Generate a unique identity for this user session
    const identity = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create access token
    const AccessToken = require("twilio").jwt.AccessToken
    const VoiceGrant = AccessToken.VoiceGrant

    const accessToken = new AccessToken(TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET, {
      identity: identity,
    })

    // Create a Voice grant and add it to the token
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: TWILIO_TWIML_APP_SID,
      incomingAllow: true, // Allow incoming calls
    })

    accessToken.addGrant(voiceGrant)

    // Generate the token
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
