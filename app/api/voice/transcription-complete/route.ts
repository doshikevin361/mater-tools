import type { NextRequest } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const callSid = formData.get("CallSid") as string
    const transcriptionSid = formData.get("TranscriptionSid") as string
    const transcriptionText = formData.get("TranscriptionText") as string
    const transcriptionStatus = formData.get("TranscriptionStatus") as string
    const transcriptionUrl = formData.get("TranscriptionUrl") as string

    console.log("Transcription completed:", { callSid, transcriptionSid, transcriptionText, transcriptionStatus })

    const db = await getDatabase()

    // Store the transcription information
    await db.collection("call_transcriptions").insertOne({
      callSid,
      transcriptionSid,
      transcriptionText,
      transcriptionStatus,
      transcriptionUrl,
      confidence: transcriptionText.length > 100 ? "high" : transcriptionText.length > 50 ? "medium" : "low",
      createdAt: new Date(),
    })

    // Update the call recording with transcription
    await db.collection("call_recordings").updateOne(
      { callSid },
      {
        $set: {
          transcriptionSid,
          transcriptionText,
          transcriptionStatus: "completed",
          transcriptionUrl,
          transcriptionCompletedAt: new Date(),
        },
      },
    )

    // Update the incoming call record
    await db.collection("incoming_calls").updateOne(
      { callSid },
      {
        $set: {
          transcriptionText,
          transcriptionStatus: "completed",
          status: "transcribed",
          updatedAt: new Date(),
        },
      },
    )

    return new Response("OK", { status: 200 })
  } catch (error) {
    console.error("Transcription completion error:", error)
    return new Response("Error", { status: 500 })
  }
}
