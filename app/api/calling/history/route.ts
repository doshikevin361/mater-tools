import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Get call history for the user
    const calls = await db
      .collection("calls")
      .find({ userId: userId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray()

    // Transform the data for frontend consumption
    const formattedCalls = calls.map((call) => ({
      id: call._id.toString(),
      callSid: call.callSid,
      phoneNumber: call.phoneNumber,
      duration: call.duration || 0,
      status: call.status || "unknown",
      cost: call.cost || 0,
      recordingUrl: call.recordingUrl,
      recordingDuration: call.recordingDuration,
      recordingSize: call.recordingSize,
      transcript: call.transcript,
      timestamp: call.createdAt,
      hasRecording: !!call.recordingUrl,
    }))

    // Get total count for pagination
    const totalCount = await db.collection("calls").countDocuments({ userId: userId })

    return NextResponse.json({
      success: true,
      calls: formattedCalls,
      pagination: {
        total: totalCount,
        limit: limit,
        offset: offset,
        hasMore: offset + limit < totalCount,
      },
    })
  } catch (error) {
    console.error("Error fetching call history:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch call history",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
