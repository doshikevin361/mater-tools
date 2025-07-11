import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    const calls = await db.collection("calls").find({ userId }).sort({ createdAt: -1 }).limit(50).toArray()

    // Format calls for frontend
    const formattedCalls = calls.map((call) => ({
      id: call._id.toString(),
      phoneNumber: call.to,
      duration: call.duration || 0,
      status: call.status,
      cost: call.cost || 0,
      recordingUrl: call.recordingUrl,
      timestamp: call.createdAt,
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
