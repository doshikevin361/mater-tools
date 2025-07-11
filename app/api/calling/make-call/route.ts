import { type NextRequest, NextResponse } from "next/server"
import { twilioService } from "@/lib/twilio-service"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message, voiceOptions, userId } = await request.json()

    if (!phoneNumber || !message) {
      return NextResponse.json({ error: "Phone number and message are required" }, { status: 400 })
    }

    // Make the call using Twilio service
    const callResult = await twilioService.makeVoiceCall(phoneNumber, message, voiceOptions)

    // Store call record in database
    const { db } = await connectToDatabase()

    const callRecord = {
      callSid: callResult.callSid,
      userId: userId || "demo-user",
      phoneNumber: phoneNumber,
      message: message,
      status: callResult.status,
      direction: "outbound",
      duration: 0,
      cost: 0,
      recordingUrl: null,
      recordingSid: null,
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.collection("call_history").insertOne(callRecord)

    return NextResponse.json({
      success: true,
      callSid: callResult.callSid,
      status: callResult.status,
      message: "Call initiated successfully",
    })
  } catch (error) {
    console.error("Error making call:", error)
    return NextResponse.json({ error: "Failed to make call", details: error.message }, { status: 500 })
  }
}

// Get call status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const callSid = searchParams.get("callSid")

    if (!callSid) {
      return NextResponse.json({ error: "Call SID is required" }, { status: 400 })
    }

    const status = await twilioService.getCallStatus(callSid)

    return NextResponse.json({
      success: true,
      ...status,
    })
  } catch (error) {
    console.error("Error getting call status:", error)
    return NextResponse.json({ error: "Failed to get call status" }, { status: 500 })
  }
}
