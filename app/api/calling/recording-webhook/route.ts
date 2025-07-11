import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const callSid = formData.get("CallSid") as string
    const recordingUrl = formData.get("RecordingUrl") as string
    const recordingSid = formData.get("RecordingSid") as string
    const recordingDuration = formData.get("RecordingDuration") as string

    console.log("Recording webhook received:", { callSid, recordingUrl, recordingSid })

    if (!callSid || !recordingUrl) {
      return NextResponse.json({ error: "Missing required recording data" }, { status: 400 })
    }

    // Update call record with recording information
    try {
      const { db } = await connectToDatabase()

      await db.collection("calls").updateOne(
        { callSid },
        {
          $set: {
            recordingUrl,
            recordingSid,
            recordingDuration: Number.parseInt(recordingDuration) || 0,
            recordingAvailable: true,
            updatedAt: new Date(),
          },
        },
      )

      console.log("Recording info saved for call:", callSid)
    } catch (dbError) {
      console.error("Database error in recording webhook:", dbError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Recording webhook error:", error)
    return NextResponse.json({ error: "Recording webhook processing failed" }, { status: 500 })
  }
}
