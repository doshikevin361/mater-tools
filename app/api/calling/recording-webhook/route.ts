import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { CallSid, RecordingUrl, RecordingDuration, RecordingSid } = body

    const { db } = await connectToDatabase()

    // Update call record with recording information
    const updateData = {
      recordingUrl: RecordingUrl,
      recordingDuration: Number.parseInt(RecordingDuration || "0"),
      recordingSid: RecordingSid,
      recordingSize: `${(Number.parseInt(RecordingDuration || "0") * 0.01).toFixed(1)} MB`,
      updatedAt: new Date(),
    }

    await db.collection("calls").updateOne({ callSid: CallSid }, { $set: updateData })

    // Here you could trigger transcription service
    // For example, send to Google Speech-to-Text or AWS Transcribe

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Recording webhook error:", error)
    return NextResponse.json({ success: false, message: "Recording webhook processing failed" }, { status: 500 })
  }
}
