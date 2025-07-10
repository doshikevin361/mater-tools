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

    // Connect to database and update call record with recording info
    const { db } = await connectToDatabase()

    await db.collection("call_history").updateOne(
      { callSid },
      {
        $set: {
          recordingUrl: recordingUrl + ".mp3",
          recordingSid,
          recordingDuration: Number.parseInt(recordingDuration) || 0,
          recordingAvailable: true,
        },
      },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing recording webhook:", error)
    return NextResponse.json({ error: "Failed to process recording webhook" }, { status: 500 })
  }
}
