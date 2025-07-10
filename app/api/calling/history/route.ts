import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()

    // Get current user ID from session (replace with actual session handling)
    const userId = "current-user-id"

    const calls = await db.collection("calls").find({ userId: userId }).sort({ timestamp: -1 }).limit(50).toArray()

    // Transform the data for frontend consumption
    const formattedCalls = calls.map((call) => ({
      id: call._id.toString(),
      phoneNumber: call.phoneNumber,
      duration: call.duration || 0,
      status: call.status || "unknown",
      cost: call.cost || 0,
      recordingUrl: call.recordingUrl,
      transcript: call.transcript,
      timestamp: call.timestamp,
    }))

    return NextResponse.json({
      success: true,
      calls: formattedCalls,
    })
  } catch (error) {
    console.error("Error fetching call history:", error)
    return NextResponse.json({ error: "Failed to fetch call history" }, { status: 500 })
  }
}
