import { type NextRequest, NextResponse } from "next/server"
import { voiceService } from "@/lib/voice-service"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { callSid } = await request.json()

    if (!callSid) {
      return NextResponse.json({ error: "Call SID is required" }, { status: 400 })
    }

    // End the call using voice service
    await voiceService.endCall(callSid)

    // Update call record in database
    const { db } = await connectToDatabase()
    await db.collection("call_logs").updateOne(
      { callSid },
      {
        $set: {
          status: "completed",
          endTime: new Date(),
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({
      success: true,
      message: "Call ended successfully",
    })
  } catch (error) {
    console.error("Error ending call:", error)
    return NextResponse.json({ error: "Failed to end call" }, { status: 500 })
  }
}
