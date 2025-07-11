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

    // Connect to database
    const { db } = await connectToDatabase()

    // Update call record with recording information
    await db.collection("call_history").updateOne(
      { callSid },
      {
        $set: {
          recordingUrl,
          recordingSid,
          recordingDuration: Number.parseInt(recordingDuration) || 0,
          recordingUpdatedAt: new Date(),
        },
      },
    )

    console.log("Recording information updated for call:", callSid)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Recording webhook error:", error)
    return NextResponse.json({ error: "Recording webhook processing failed" }, { status: 500 })
  }
}
