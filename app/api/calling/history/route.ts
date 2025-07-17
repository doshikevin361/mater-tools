import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    // Connect to database
    const { db } = await connectToDatabase()

    // Fetch call history (last 50 calls)
    const calls = await db.collection("call_history").find({}).sort({ timestamp: -1 }).limit(50).toArray()

    // Format calls for frontend
    const formattedCalls = calls.map((call) => ({
      _id: call._id.toString(),
      phoneNumber: call.phoneNumber,
      status: call.status || "completed",
      timestamp: call.timestamp,
      duration: call.duration || 0,
      cost: call.cost || 0,
      type: call.type || "outbound",
      callSid: call.callSid,
    }))

    return NextResponse.json({
      success: true,
      calls: formattedCalls,
    })
  } catch (error) {
    console.error("Error fetching call history:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch call history" }, { status: 500 })
  }
}
