import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const skip = (page - 1) * limit

    // Get call history for user
    const calls = await db
      .collection("calls")
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    // Get total count for pagination
    const totalCalls = await db.collection("calls").countDocuments({ userId })

    // Format the response
    const formattedCalls = calls.map((call) => ({
      id: call._id,
      callSid: call.callSid,
      to: call.to,
      from: call.from,
      status: call.status,
      duration: call.duration || 0,
      cost: call.cost || 0,
      recordingUrl: call.recordingUrl || null,
      recordingAvailable: call.recordingAvailable || false,
      createdAt: call.createdAt,
      endTime: call.endTime || null,
    }))

    return NextResponse.json({
      success: true,
      calls: formattedCalls,
      pagination: {
        page,
        limit,
        total: totalCalls,
        pages: Math.ceil(totalCalls / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching call history:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch call history",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
