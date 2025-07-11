import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()

    const calls = await db.collection("call_history").find({}).sort({ timestamp: -1 }).limit(50).toArray()

    const formattedCalls = calls.map((call) => ({
      id: call.callSid,
      to: call.to,
      from: call.from,
      status: call.status,
      duration: call.duration || 0,
      timestamp: call.timestamp,
      recordingUrl: call.recordingUrl,
      cost: call.cost || 0,
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
