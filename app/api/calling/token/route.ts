import { NextResponse } from "next/server"

export async function GET() {
  try {

    const accountSid = process.env.TWILIO_ACCOUNT_SID || "AC86b70352ccc2023f8cfa305712b474cd"
const apiKey = process.env.TWILIO_API_KEY || "SK0745de76832af1b501e871e36bc467ae"
const apiSecret = process.env.TWILIO_API_SECRET || "Ge1LcneXSoJmREekmK7wmoqsn4E1qOz9"
const twimlAppSid = process.env.TWILIO_TWIML_APP_SID || "APe32c170c79e356138bd267904ffc6814"


    if (!accountSid || !apiKey || !apiSecret || !twimlAppSid) {
      console.error("Missing Twilio credentials:", {
        accountSid: !!accountSid,
        apiKey: !!apiKey,
        apiSecret: !!apiSecret,
        twimlAppSid: !!twimlAppSid,
      })
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing Twilio credentials. Please set TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET, and TWILIO_TWIML_APP_SID environment variables.",
        },
        { status: 500 },
      )
    }

    try {
      // Import Twilio JWT
      const twilio = require("twilio")
      const AccessToken = twilio.jwt.AccessToken
      const VoiceGrant = AccessToken.VoiceGrant

      // Generate unique identity
      const identity = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Create access token
      const accessToken = new AccessToken(accountSid, apiKey, apiSecret, {
        identity: identity,
        ttl: 3600, // 1 hour
      })

      // Create Voice grant
      const voiceGrant = new VoiceGrant({
        outgoingApplicationSid: twimlAppSid,
        incomingAllow: true,
      })

      accessToken.addGrant(voiceGrant)

      const token = accessToken.toJwt()
      console.log("Generated access token for identity:", identity)

      return NextResponse.json({
        success: true,
        token: token,
        identity: identity,
      })
    } catch (twilioError) {
      console.error("Twilio JWT generation error:", twilioError)
      return NextResponse.json(
        {
          success: false,
          error: `Twilio JWT error: ${twilioError.message}. Please check your Twilio credentials.`,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Token generation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Failed to generate access token: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
