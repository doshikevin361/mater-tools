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

    const updateData = {
      recordingUrl,
      recordingSid,
      recordingDuration: Number.parseInt(recordingDuration) || 0,
      recordingUpdatedAt: new Date(),
    }

    // Update call record with recording information
    await db.collection("call_history").updateOne({ callSid }, { $set: updateData })

    console.log("Call record updated with recording:", updateData)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Recording webhook processing error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
