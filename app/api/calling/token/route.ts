import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    const { identity } = await request.json()

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const apiKey = process.env.TWILIO_API_KEY
    const apiSecret = process.env.TWILIO_API_SECRET
    const twimlAppSid = process.env.TWILIO_TWIML_APP_SID

    if (!accountSid || !apiKey || !apiSecret || !twimlAppSid) {
      return NextResponse.json({ success: false, message: "Missing Twilio configuration" }, { status: 500 })
    }

    const now = Math.floor(Date.now() / 1000)
    const exp = now + 3600

    const payload = {
      iss: apiKey,
      sub: accountSid,
      nbf: now,
      exp: exp,
      grants: {
        identity: identity || `user_${Date.now()}`,
        voice: {
          outgoing: {
            application_sid: twimlAppSid,
          },
          incoming: {
            allow: true,
          },
        },
      },
    }

    const token = jwt.sign(payload, apiSecret, { algorithm: "HS256" })

    return NextResponse.json({
      success: true,
      token,
      identity: payload.grants.identity,
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to generate token" }, { status: 500 })
  }
}
