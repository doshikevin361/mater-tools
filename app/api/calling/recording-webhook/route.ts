import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string
    const recordingUrl = formData.get("RecordingUrl") as string
    const recordingDuration = formData.get("RecordingDuration") as string
    const recordingSid = formData.get("RecordingSid") as string

    if (!callSid || !recordingUrl) {
      return NextResponse.json({ error: "Call SID and recording URL are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Calculate recording file size (estimate based on duration)
    const durationSeconds = Number.parseInt(recordingDuration) || 0
    const estimatedSizeKB = Math.ceil(durationSeconds * 8) // Rough estimate: 8KB per second for MP3
    const recordingSize = estimatedSizeKB > 1024 ? `${(estimatedSizeKB / 1024).toFixed(1)} MB` : `${estimatedSizeKB} KB`

    // Update call record with recording information
    const updateResult = await db.collection("calls").updateOne(
      { callSid: callSid },
      {
        $set: {
          recordingUrl: recordingUrl,
          recordingSid: recordingSid,
          recordingDuration: durationSeconds,
          recordingSize: recordingSize,
          hasRecording: true,
          updatedAt: new Date(),
        },
      },
    )

    if (updateResult.matchedCount === 0) {
      console.warn(`Call record not found for SID: ${callSid}`)
    }

    // Optionally, trigger transcription service here
    const callRecord = await db.collection("calls").findOne({ callSid: callSid })
    if (callRecord && callRecord.transcription) {
      // Trigger transcription service
      // await triggerTranscription(recordingUrl, callSid)
    }

    console.log(`Recording saved for call ${callSid}: ${recordingUrl}`)

    return NextResponse.json({
      success: true,
      message: "Recording processed successfully",
    })
  } catch (error) {
    console.error("Recording webhook error:", error)
    return NextResponse.json(
      {
        error: "Recording webhook processing failed",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
