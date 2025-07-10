import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { voiceService } from "@/lib/voice-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, userId, settings } = body

    console.log("Making outbound call:", { phoneNumber, userId, settings })

    if (!phoneNumber || !userId) {
      return NextResponse.json({ success: false, message: "Phone number and user ID are required" }, { status: 400 })
    }

    const db = await getDatabase()
    const user = await db.collection("users").findOne({ _id: userId })

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const callCost = 1.5 // Base cost per call
    if (user.balance < callCost) {
      return NextResponse.json(
        {
          success: false,
          message: `Insufficient balance. Required: ₹${callCost}, Available: ₹${user.balance.toFixed(2)}`,
        },
        { status: 400 },
      )
    }

    // Create TwiML for two-way conversation
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${settings?.voice || "alice"}">Hello, you have an incoming call. Please hold while we connect you.</Say>
  <Dial timeout="${settings?.timeout || 30}" record="${settings?.autoRecord ? "record-from-answer" : "do-not-record"}">
    <Number statusCallback="${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/calling/webhook">
      ${phoneNumber}
    </Number>
  </Dial>
  <Say voice="${settings?.voice || "alice"}">The call could not be completed. Please try again later.</Say>
</Response>`

    // Make the call using Twilio
    const callResult = await voiceService.client.calls.create({
      to: phoneNumber,
      from: voiceService.phoneNumber,
      twiml: twiml,
      statusCallback: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/calling/webhook`,
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      statusCallbackMethod: "POST",
      record: settings?.autoRecord || false,
      recordingStatusCallback: settings?.autoRecord
        ? `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/calling/recording-webhook`
        : undefined,
    })

    // Create call record
    const callRecord = {
      callSid: callResult.sid,
      userId,
      phoneNumber,
      status: "initiated",
      startTime: new Date(),
      settings: settings || {},
      cost: callCost,
      createdAt: new Date(),
    }

    await db.collection("calls").insertOne(callRecord)

    return NextResponse.json({
      success: true,
      message: "Call initiated successfully",
      callSid: callResult.sid,
      status: callResult.status,
    })
  } catch (error) {
    console.error("Make call error:", error)
    return NextResponse.json({ success: false, message: "Failed to make call", error: error.message }, { status: 500 })
  }
}
