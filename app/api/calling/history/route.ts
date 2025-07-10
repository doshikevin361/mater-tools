import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    const db = await getDatabase()

    const calls = await db.collection("calls").find({ userId }).sort({ createdAt: -1 }).limit(50).toArray()

    const formattedCalls = calls.map((call) => ({
      id: call.callSid,
      phoneNumber: call.phoneNumber,
      duration: call.duration
        ? `${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, "0")}`
        : "00:00",
      timestamp: call.createdAt.toISOString(),
      status: call.status || "unknown",
      recordingUrl: call.recordingUrl,
      transcription: call.transcription,
      cost: call.cost || 0,
    }))

    return NextResponse.json({
      success: true,
      calls: formattedCalls,
    })
  } catch (error) {
    console.error("Get call history error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to get call history", error: error.message },
      { status: 500 },
    )
  }
}
