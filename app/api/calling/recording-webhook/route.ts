import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string
    const recordingUrl = formData.get("RecordingUrl") as string
    const recordingSid = formData.get("RecordingSid") as string

    if (!callSid || !recordingUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Update call record with recording information
    await db.collection("calls").updateOne(
      { callSid },
      {
        $set: {
          recordingUrl,
          recordingSid,
          recordingAvailable: true,
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing recording webhook:", error)
    return NextResponse.json({ error: "Recording webhook processing failed" }, { status: 500 })
  }
}
