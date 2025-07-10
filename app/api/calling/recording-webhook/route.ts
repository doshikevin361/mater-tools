import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const callSid = formData.get("CallSid") as string
    const recordingSid = formData.get("RecordingSid") as string
    const recordingUrl = formData.get("RecordingUrl") as string
    const recordingDuration = formData.get("RecordingDuration") as string

    console.log("Recording webhook received:", {
      callSid,
      recordingSid,
      recordingUrl,
      recordingDuration,
    })

    const db = await getDatabase()

    // Update call record with recording information
    await db.collection("calls").updateOne(
      { callSid },
      {
        $set: {
          recordingSid,
          recordingUrl,
          recordingDuration: recordingDuration ? Number.parseInt(recordingDuration) : 0,
          recordingAvailable: true,
          updatedAt: new Date(),
        },
      },
    )

    // TODO: Implement transcription service here if enabled
    const callRecord = await db.collection("calls").findOne({ callSid })
    if (callRecord?.settings?.transcription && recordingUrl) {
      // You can integrate with services like Google Speech-to-Text, AWS Transcribe, etc.
      console.log("Transcription requested for call:", callSid)

      // For now, we'll just mark it as pending
      await db.collection("calls").updateOne(
        { callSid },
        {
          $set: {
            transcriptionStatus: "pending",
            transcriptionRequested: new Date(),
          },
        },
      )
    }

    return NextResponse.json({ success: true, message: "Recording webhook processed successfully" })
  } catch (error) {
    console.error("Recording webhook error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to process recording webhook", error: error.message },
      { status: 500 },
    )
  }
}
