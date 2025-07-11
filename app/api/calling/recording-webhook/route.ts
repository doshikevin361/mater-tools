import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string
    const recordingUrl = formData.get("RecordingUrl") as string
    const recordingSid = formData.get("RecordingSid") as string
    const recordingDuration = formData.get("RecordingDuration") as string

    if (callSid && recordingUrl) {
      const { db } = await connectToDatabase()

      // Update call record with recording information
      await db.collection("call_history").updateOne(
        { callSid },
        {
          $set: {
            recordingUrl: recordingUrl + ".mp3", // Add .mp3 extension for direct playback
            recordingSid,
            recordingDuration: Number.parseInt(recordingDuration) || 0,
            updatedAt: new Date(),
          },
        },
      )

      console.log(`Recording saved for call ${callSid}: ${recordingUrl}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Recording webhook error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
