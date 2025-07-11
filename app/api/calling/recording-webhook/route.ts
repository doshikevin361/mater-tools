import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)

    const callSid = params.get("CallSid")
    const recordingUrl = params.get("RecordingUrl")
    const recordingSid = params.get("RecordingSid")
    const recordingStatus = params.get("RecordingStatus")

    console.log(`Recording webhook: ${callSid} - Recording: ${recordingSid} - Status: ${recordingStatus}`)

    if (recordingStatus === "completed" && recordingUrl) {
      try {
        const { db } = await connectToDatabase()

        await db.collection("call_history").updateOne(
          { callSid },
          {
            $set: {
              recordingUrl,
              recordingSid,
              recordingStatus,
              recordingUpdatedAt: new Date(),
            },
          },
        )

        console.log(`Recording URL updated for call ${callSid}`)
      } catch (dbError) {
        console.error("Failed to update recording URL:", dbError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in recording webhook:", error)
    return NextResponse.json({ success: false, error: "Recording webhook processing failed" }, { status: 500 })
  }
}
