import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN

if (!accountSid || !authToken) {
  throw new Error("Missing Twilio credentials")
}

const client = twilio(accountSid, authToken)

export async function POST(request: NextRequest) {
  try {
    const { callSid } = await request.json()

    if (!callSid) {
      return NextResponse.json({ error: "Call SID required" }, { status: 400 })
    }

    // End the call
    await client.calls(callSid).update({ status: "completed" })

    return NextResponse.json({
      success: true,
      message: "Call ended successfully",
    })
  } catch (error) {
    console.error("Error ending call:", error)
    return NextResponse.json({ error: "Failed to end call" }, { status: 500 })
  }
}
