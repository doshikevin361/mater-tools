import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const callSid = searchParams.get("callSid")

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    const db = await getDatabase()

    const query: any = {}
    if (callSid) {
      query.callSid = callSid
    }

    // Get all recordings
    const recordings = await db.collection("call_recordings").find(query).sort({ createdAt: -1 }).limit(100).toArray()

    // Get all incoming calls with their recordings and transcriptions
    const incomingCalls = await db
      .collection("incoming_calls")
      .find(query)
      .sort({ receivedAt: -1 })
      .limit(100)
      .toArray()

    return NextResponse.json({
      success: true,
      recordings: recordings.map((recording) => ({
        ...recording,
        _id: recording._id.toString(),
      })),
      incomingCalls: incomingCalls.map((call) => ({
        ...call,
        _id: call._id.toString(),
      })),
    })
  } catch (error) {
    console.error("Failed to fetch recordings:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch recordings", error: error.message },
      { status: 500 },
    )
  }
}
