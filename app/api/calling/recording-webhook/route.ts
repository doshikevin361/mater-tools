import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string
    const recordingUrl = formData.get("RecordingUrl") as string
    const recordingSid = formData.get("RecordingSid") as string
    const recordingDuration = formData.get("RecordingDuration") as string

    console.log(`Recording webhook: ${callSid} - Recording: ${recordingSid}`)

    const { db } = await connectToDatabase()

    await db.collection("calls").updateOne(
      { callSid: callSid },
      {
        $set: {
          recordingUrl: recordingUrl,
          recordingSid: recordingSid,
          recordingDuration: recordingDuration ? Number.parseInt(recordingDuration) : 0,
          hasRecording: true,
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing recording webhook:", error)
    return NextResponse.json({ success: false, error: "Failed to process recording webhook" }, { status: 500 })
  }
}
