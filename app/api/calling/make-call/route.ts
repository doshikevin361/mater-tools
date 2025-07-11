import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { to, record = false } = await request.json()

    if (!to) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    // Use your existing Twilio credentials
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.error("Twilio credentials missing:", {
        accountSid: !!accountSid,
        authToken: !!authToken,
        twilioPhoneNumber: !!twilioPhoneNumber,
      })
      return NextResponse.json({ error: "Twilio configuration incomplete" }, { status: 500 })
    }

    const client = twilio(accountSid, authToken)

    // Format Indian phone number
    const cleanedNumber = to.replace(/\D/g, "")
    let formattedNumber = to

    if (cleanedNumber.length === 10) {
      formattedNumber = `+91${cleanedNumber}`
    } else if (cleanedNumber.length === 12 && cleanedNumber.startsWith("91")) {
      formattedNumber = `+${cleanedNumber}`
    } else if (!to.startsWith("+91")) {
      formattedNumber = to.startsWith("+") ? to : `+91${cleanedNumber}`
    }

    console.log("Making call from", twilioPhoneNumber, "to", formattedNumber)

    // Make the call using your existing Twilio setup
    const call = await client.calls.create({
      to: formattedNumber,
      from: twilioPhoneNumber,
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/voice/twiml`,
      statusCallback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/calling/webhook`,
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      statusCallbackMethod: "POST",
      record: record,
      recordingStatusCallback: record ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/calling/recording-webhook` : undefined,
    })

    // Store call record
    try {
      const { db } = await connectToDatabase()
      await db.collection("calls").insertOne({
        callSid: call.sid,
        to: formattedNumber,
        from: twilioPhoneNumber,
        status: call.status,
        record: record,
        cost: 1.5,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    } catch (dbError) {
      console.error("Database error:", dbError)
      // Continue even if DB fails
    }

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      status: call.status,
      message: "Call initiated successfully",
    })
  } catch (error) {
    console.error("Error making call:", error)
    return NextResponse.json(
      {
        error: "Failed to make call",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
