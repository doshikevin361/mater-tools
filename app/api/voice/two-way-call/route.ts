import { type NextRequest, NextResponse } from "next/server"
import { voiceService } from "@/lib/voice-service"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { to, record = true } = await request.json()

    if (!to) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    // Create two-way call using voice service
    const call = await voiceService.createTwoWayCall(to, record)

    // Store call record in database
    const { db } = await connectToDatabase()
    await db.collection("call_logs").insertOne({
      callSid: call.sid,
      phoneNumber: to,
      direction: "outbound",
      status: call.status,
      startTime: new Date(),
      record,
      createdAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      status: call.status,
    })
  } catch (error) {
    console.error("Error creating two-way call:", error)
    return NextResponse.json({ error: "Failed to create call" }, { status: 500 })
  }
}
