import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string
    const recordingUrl = formData.get("RecordingUrl") as string
    const recordingDuration = formData.get("RecordingDuration") as string

    const { db } = await connectToDatabase()

    // Update call record with recording information
    await db.collection("calls").updateOne(
      { callSid: callSid },
      {
        $set: {
          recordingUrl: recordingUrl,
          recordingDuration: Number.parseInt(recordingDuration || "0"),
          hasRecording: true,
          updatedAt: new Date(),
        },
      },
    )

    // Here you could also trigger transcription services
    // await transcribeRecording(recordingUrl, callSid)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Recording webhook error:", error)
    return NextResponse.json({ error: "Recording webhook processing failed" }, { status: 500 })
  }
}
