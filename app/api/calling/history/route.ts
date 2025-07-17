import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()

    // Get recent calls (last 50)
    const calls = await db.collection("calls").find({}).sort({ timestamp: -1 }).limit(50).toArray()

    // Format calls for frontend
    const formattedCalls = calls.map((call) => ({
      _id: call._id.toString(),
      phoneNumber: call.phoneNumber,
      status: call.status || "unknown",
      timestamp: call.timestamp,
      duration: call.duration || 0,
      cost: call.cost || 0,
      type: call.type || "voice_call",
      callSid: call.callSid,
      message: call.message,
    }))

    return NextResponse.json({
      success: true,
      calls: formattedCalls,
      total: calls.length,
    })
  } catch (error) {
    console.error("Fetch call history error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch call history: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
