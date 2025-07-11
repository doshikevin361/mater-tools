import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string
    const recordingUrl = formData.get("RecordingUrl") as string
    const recordingSid = formData.get("RecordingSid") as string
    const recordingDuration = formData.get("RecordingDuration") as string

    console.log("Recording webhook received:", {
      callSid,
      recordingUrl,
      recordingSid,
      recordingDuration,
    })

    const { db } = await connectToDatabase()

    // Update call record with recording information
    await db.collection("call_history").updateOne(
      { callSid },
      {
        $set: {
          recordingUrl: recordingUrl + ".mp3", // Add .mp3 extension for download
          recordingSid,
          recordingDuration: Number.parseInt(recordingDuration) || 0,
          recordingAvailable: true,
          updatedAt: new Date(),
        },
      },
    )

    console.log(`Recording saved for call ${callSid}: ${recordingUrl}`)

    return NextResponse.json({ success: true, message: "Recording webhook processed successfully" })
  } catch (error) {
    console.error("Recording webhook error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to process recording webhook", error: error.message },
      { status: 500 },
    )
  }
}
