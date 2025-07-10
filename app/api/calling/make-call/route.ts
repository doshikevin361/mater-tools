import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { to, record = false, voice = "alice", timeout = 30, userId } = await request.json()

    if (!to || !userId) {
      return NextResponse.json({ error: "Phone number and user ID are required" }, { status: 400 })
    }

    // Validate Indian phone number format
    if (!to.startsWith("+91") || to.length !== 13) {
      return NextResponse.json({ error: "Invalid Indian phone number format" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check user balance
    const user = await db.collection("users").findOne({ _id: userId })
    if (!user || user.balance < 2) {
      return NextResponse.json(
        {
          error: `Insufficient balance. Required: ₹2, Available: ₹${user?.balance?.toFixed(2) || 0}`,
        },
        { status: 400 },
      )
    }

    // Generate unique call SID
    const callSid = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create TwiML for the call
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">Hello, you have an incoming call from BrandBuzz. Please hold while we connect you.</Say>
  <Dial timeout="${timeout}" record="${record ? "record-from-answer" : "do-not-record"}" 
        recordingStatusCallback="${process.env.NEXT_PUBLIC_BASE_URL}/api/calling/recording-webhook">
    <Number statusCallback="${process.env.NEXT_PUBLIC_BASE_URL}/api/calling/webhook">
      ${to}
    </Number>
  </Dial>
  <Say voice="${voice}">The call could not be completed. Please try again later. Thank you.</Say>
</Response>`

    // Create call record in database
    const callRecord = {
      callSid: callSid,
      userId: userId,
      phoneNumber: to,
      status: "initiated",
      record: record,
      voice: voice,
      timeout: timeout,
      startTime: new Date(),
      cost: 0,
      duration: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.collection("calls").insertOne(callRecord)

    // In a real implementation, you would make the actual Twilio call here:
    /*
    const call = await voiceService.client.calls.create({
      to: to,
      from: voiceService.phoneNumber,
      twiml: twiml,
      statusCallback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/calling/webhook`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
      record: record,
      recordingStatusCallback: record ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/calling/recording-webhook` : undefined
    })
    */

    return NextResponse.json({
      success: true,
      callSid: callSid,
      message: "Call initiated successfully",
      status: "initiated",
    })
  } catch (error) {
    console.error("Error making call:", error)
    return NextResponse.json(
      {
        error: "Failed to make call",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
