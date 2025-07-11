import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string
    const recordingUrl = formData.get("RecordingUrl") as string
    const recordingSid = formData.get("RecordingSid") as string

    const { db } = await connectToDatabase()

    // Update call record with recording URL
    await db.collection("call_history").updateOne(
      { callSid },
      {
        $set: {
          recordingUrl: recordingUrl + ".mp3",
          recordingSid,
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Recording webhook error:", error)
    return NextResponse.json({ error: "Recording webhook failed" }, { status: 500 })
  }
}
