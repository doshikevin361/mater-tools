import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()

    const calls = await db.collection("call_history").find({}).sort({ timestamp: -1 }).limit(50).toArray()

    const formattedCalls = calls.map((call) => ({
      id: call._id.toString(),
      phoneNumber: call.phoneNumber,
      duration: call.duration || 0,
      status:
        call.status === "completed"
          ? "completed"
          : call.status === "failed"
            ? "failed"
            : call.status === "busy"
              ? "busy"
              : call.status === "no-answer"
                ? "no-answer"
                : "completed",
      cost: call.cost || 0,
      recordingUrl: call.recordingUrl,
      transcript: call.transcript,
      timestamp: call.timestamp,
      type: call.type || "browser_call",
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

export async function POST(request: NextRequest) {
  try {
    const callData = await request.json()
    const { db } = await connectToDatabase()

    const result = await db.collection("call_history").insertOne({
      ...callData,
      timestamp: new Date(),
    })

    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("Error saving call history:", error)
    return NextResponse.json({ success: false, error: "Failed to save call history" }, { status: 500 })
  }
}
