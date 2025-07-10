import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()

    const recordings = await db.collection("call_logs").find({}).sort({ startTime: -1 }).limit(50).toArray()

    return NextResponse.json({
      success: true,
      recordings: recordings.map((record) => ({
        _id: record._id.toString(),
        phoneNumber: record.phoneNumber,
        status: record.status,
        duration: record.duration || 0,
        startTime: record.startTime,
        endTime: record.endTime,
        recordingUrl: record.recordingUrl,
        transcription: record.transcription,
        direction: record.direction,
      })),
    })
  } catch (error) {
    console.error("Error fetching recordings:", error)
    return NextResponse.json({ error: "Failed to fetch recordings" }, { status: 500 })
  }
}
