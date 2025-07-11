import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

const accountSid = process.env.TWILIO_ACCOUNT_SID || "AC86b70352ccc2023f8cfa305712b474cd"
const apiKey = process.env.TWILIO_API_KEY || "SK0745de76832af1b501e871e36bc467ae"
const apiSecret = process.env.TWILIO_API_SECRET || "Ge1LcneXSoJmREekmK7wmoqsn4E1qOz9"
const appSid = process.env.TWILIO_TWIML_APP_SID || "APe32c170c79e356138bd267904ffc6814" 

export async function GET(request: NextRequest) {
  try {
    const { AccessToken } = twilio.jwt
    const { VoiceGrant } = AccessToken

    const accessToken = new AccessToken(accountSid, apiKey, apiSecret, {
      identity: `user_${Date.now()}`, // Unique identity for this user
      ttl: 3600, // Token valid for 1 hour
    })

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: appSid,
      incomingAllow: true, // Allow incoming calls
    })

    accessToken.addGrant(voiceGrant)

    return NextResponse.json({
      success: true,
      token: accessToken.toJwt(),
      identity: accessToken.identity,
    })
  } catch (error) {
    console.error("Error generating access token:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate access token",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
