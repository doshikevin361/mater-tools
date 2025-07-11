import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || "demo-user"

    const { db } = await connectToDatabase()

    const calls = await db.collection("call_history").find({ userId }).sort({ timestamp: -1 }).limit(50).toArray()

    const formattedCalls = calls.map((call) => ({
      id: call._id.toString(),
      callSid: call.callSid,
      phoneNumber: call.phoneNumber,
      direction: call.direction || "outbound",
      duration: call.duration || 0,
      status: call.status || "unknown",
      cost: call.cost || 0,
      recordingUrl: call.recordingUrl,
      recordingSid: call.recordingSid,
      transcript: call.transcript,
      timestamp: call.timestamp,
      message: call.message,
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const callSid = searchParams.get("callSid")
    const userId = searchParams.get("userId") || "demo-user"

    if (!callSid) {
      return NextResponse.json({ error: "Call SID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const result = await db.collection("call_history").deleteOne({
      callSid,
      userId,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Call record not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Call record deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting call record:", error)
    return NextResponse.json({ error: "Failed to delete call record" }, { status: 500 })
  }
}
