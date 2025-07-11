import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    const calls = await db.collection("call_history").find({ userId }).sort({ createdAt: -1 }).limit(50).toArray()

    const formattedCalls = calls.map((call) => ({
      id: call.callSid,
      phoneNumber: call.to,
      duration: call.duration || 0,
      status: call.status === "completed" ? "completed" : call.status === "failed" ? "failed" : "completed",
      cost: call.cost || 0,
      recordingUrl: call.recordingUrl || null,
      transcript: call.transcript || null,
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
