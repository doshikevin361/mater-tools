import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()

    // Fetch call history from database
    const calls = await db.collection("call_history").find({}).sort({ timestamp: -1 }).limit(50).toArray()

    console.log(`Fetched ${calls.length} call records`)

    return NextResponse.json({
      success: true,
      calls: calls.map((call) => ({
        _id: call._id.toString(),
        phoneNumber: call.phoneNumber,
        callSid: call.callSid,
        status: call.status,
        duration: call.duration || 0,
        cost: call.cost || 0,
        message: call.message,
        recordingUrl: call.recordingUrl,
        timestamp: call.timestamp,
        answeredBy: call.webhookData?.answeredBy,
      })),
    })
  } catch (error) {
    console.error("Error fetching call history:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch call history",
      },
      { status: 500 },
    )
  }
}
