import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string
    const recordingUrl = formData.get("RecordingUrl") as string
    const recordingSid = formData.get("RecordingSid") as string

    if (recordingUrl && callSid) {
      const db = await getDatabase()

      await db.collection("call_history").updateOne(
        { callSid },
        {
          $set: {
            recordingUrl,
            recordingSid,
            hasRecording: true,
            updatedAt: new Date(),
          },
        },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
