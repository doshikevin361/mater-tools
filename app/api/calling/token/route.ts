import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const accountSid = 'AC86b70352ccc2023f8cfa305712b474cd'
    const apiKey = 'SK0745de76832af1b501e871e36bc467ae'
    const apiSecret = 'Ge1LcneXSoJmREekmK7wmoqsn4E1qOz9'
    const twimlAppSid = 'APe32c170c79e356138bd267904ffc6814'

    if (!accountSid || !apiKey || !apiSecret || !twimlAppSid) {
      console.error("Missing Twilio environment variables")
      return NextResponse.json({ success: false, error: "Twilio configuration missing" }, { status: 500 })
    }

    // Generate a unique identity for this user session
    const identity = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create access token
    const AccessToken = require("twilio").jwt.AccessToken
    const VoiceGrant = AccessToken.VoiceGrant

    const accessToken = new AccessToken(accountSid, apiKey, apiSecret, {
      identity: identity,
      ttl: 3600, // 1 hour
    })

    // Create Voice grant
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true, // Allow incoming calls
    })

    accessToken.addGrant(voiceGrant)

    const token = accessToken.toJwt()

    console.log(`Generated access token for identity: ${identity}`)

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
