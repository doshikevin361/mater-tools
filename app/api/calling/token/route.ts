import { NextResponse } from "next/server"
import twilio from "twilio"

const AccessToken = twilio.jwt.AccessToken
const VoiceGrant = AccessToken.VoiceGrant

export async function GET() {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID || "AC86b70352ccc2023f8cfa305712b474cd"
    const apiKey = process.env.TWILIO_API_KEY || "SK0745de76832af1b501e871e36bc467ae"
    const apiSecret = process.env.TWILIO_API_SECRET || "Ge1LcneXSoJmREekmK7wmoqsn4E1qOz9"
    const twimlAppSid = process.env.TWILIO_TWIML_APP_SID || "AP123456789"

    // Create an access token
    const accessToken = new AccessToken(accountSid, apiKey, apiSecret, {
      identity: `user_${Date.now()}`,
      ttl: 3600, // 1 hour
    })

    // Create a Voice grant and add to token
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true,
    })

    accessToken.addGrant(voiceGrant)

    return NextResponse.json({
      success: true,
      token: accessToken.toJwt(),
      identity: accessToken.identity,
    })
  } catch (error) {
    console.error("Token generation error:", error)
    return NextResponse.json({ success: false, error: "Failed to generate access token" }, { status: 500 })
  }
}
