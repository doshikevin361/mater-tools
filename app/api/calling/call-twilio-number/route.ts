import { type NextRequest, NextResponse } from "next/server"
import { twilioService } from "@/lib/twilio-service"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { targetNumber, userId, callType = "direct" } = await request.json()

    if (!targetNumber) {
      return NextResponse.json({ error: "Target number is required" }, { status: 400 })
    }

    const callResult = await twilioService.makeDirectCall(targetNumber)

    const { db } = await connectToDatabase()

    const callRecord = {
      callSid: callResult.callSid,
      userId: userId || "system",
      phoneNumber: targetNumber,
      direction: "outbound",
      callType: callType,
      status: callResult.status,
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
      message: "Call initiated from Twilio number",
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to make call", details: error.message }, { status: 500 })
  }
}
