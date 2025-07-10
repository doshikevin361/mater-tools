import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

const client = twilio(accountSid, authToken)

export async function POST(request: NextRequest) {
  try {
    const { to, record = false } = await request.json()

    if (!to) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    // Format phone number
    const formattedTo = to.startsWith("+") ? to : `+1${to.replace(/\D/g, "")}`

    const call = await client.calls.create({
      to: formattedTo,
      from: twilioPhoneNumber,
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/voice/twiml`,
      statusCallback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/calling/webhook`,
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      record: record,
      recordingStatusCallback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/calling/recording-webhook`,
    })

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      status: call.status,
      message: "Call initiated successfully",
    })
  } catch (error) {
    console.error("Error making call:", error)
    return NextResponse.json(
      { error: "Failed to make call", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
