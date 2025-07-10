import type { NextRequest } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const callSid = formData.get("CallSid") as string
    const recordingSid = formData.get("RecordingSid") as string
    const recordingUrl = formData.get("RecordingUrl") as string
    const recordingDuration = Number.parseInt(formData.get("RecordingDuration") as string) || 0

    console.log("Recording completed:", { callSid, recordingSid, recordingUrl, recordingDuration })

    const db = await getDatabase()

    // Store the recording information
    await db.collection("call_recordings").insertOne({
      callSid,
      recordingSid,
      recordingUrl,
      recordingDuration,
      status: "completed",
      createdAt: new Date(),
      transcriptionStatus: "pending",
    })

    // Update the incoming call record
    await db.collection("incoming_calls").updateOne(
      { callSid },
      {
        $set: {
          recordingSid,
          recordingUrl,
          recordingDuration,
          status: "recorded",
          updatedAt: new Date(),
        },
      },
    )

    return new Response("OK", { status: 200 })
  } catch (error) {
    console.error("Recording completion error:", error)
    return new Response("Error", { status: 500 })
  }
}
