import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    const { db } = await connectToDatabase()

    const calls = await db.collection("call_history").find({ userId }).sort({ timestamp: -1 }).limit(50).toArray()

    return NextResponse.json({
      success: true,
      calls: calls.map((call) => ({
        id: call._id.toString(),
        callSid: call.callSid,
        phoneNumber: call.phoneNumber,
        direction: call.direction || "outbound",
        duration: call.duration || 0,
        status: call.status || "completed",
        cost: call.cost || 0,
        recordingUrl: call.recordingUrl,
        timestamp: call.timestamp,
        callType: call.callType || "browser",
      })),
    })
  } catch (error) {
    console.error("History fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch call history" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const callSid = searchParams.get("callSid")
    const userId = searchParams.get("userId")

    const { db } = await connectToDatabase()

    await db.collection("call_history").deleteOne({ callSid, userId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete call error:", error)
    return NextResponse.json({ error: "Failed to delete call" }, { status: 500 })
  }
}
