import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { callSid, duration, cost, userId } = await request.json()

    if (!callSid || !userId) {
      return NextResponse.json({ error: "Call SID and user ID are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Update call record
    const updateResult = await db.collection("calls").updateOne(
      { callSid: callSid, userId: userId },
      {
        $set: {
          status: "completed",
          duration: duration,
          cost: cost,
          endTime: new Date(),
          updatedAt: new Date(),
        },
      },
    )

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Call record not found" }, { status: 404 })
    }

    // Update user balance
    await db.collection("users").updateOne(
      { _id: userId },
      {
        $inc: { balance: -cost },
        $set: { updatedAt: new Date() },
      },
    )

    // In a real implementation, you would end the actual Twilio call here:
    /*
    if (callSid.startsWith('CA')) { // Real Twilio call SID format
      await voiceService.client.calls(callSid).update({ status: 'completed' })
    }
    */

    return NextResponse.json({
      success: true,
      message: "Call ended successfully",
      duration: duration,
      cost: cost,
    })
  } catch (error) {
    console.error("Error ending call:", error)
    return NextResponse.json(
      {
        error: "Failed to end call",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
