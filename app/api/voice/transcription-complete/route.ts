import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const callSid = formData.get("CallSid") as string
    const transcriptionSid = formData.get("TranscriptionSid") as string
    const transcriptionText = formData.get("TranscriptionText") as string
    const transcriptionStatus = formData.get("TranscriptionStatus") as string
    const transcriptionUrl = formData.get("TranscriptionUrl") as string

    console.log("Transcription completed:", { callSid, transcriptionSid, transcriptionStatus })

    const db = await getDatabase()

    // Store transcription information
    await db.collection("call_transcriptions").insertOne({
      callSid,
      transcriptionSid,
      transcriptionText: transcriptionText || "",
      transcriptionStatus,
      transcriptionUrl,
      createdAt: new Date(),
      confidence: "medium", // Twilio doesn't provide confidence score by default
    })

    // Update the recording record with transcription
    await db.collection("call_recordings").updateOne(
      { callSid },
      {
        $set: {
          transcriptionSid,
          transcriptionText: transcriptionText || "",
          transcriptionStatus,
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
          transcriptionText: transcriptionText || "",
          transcriptionStatus,
          status: "transcribed",
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({ success: true, message: "Transcription processed successfully" })
  } catch (error) {
    console.error("Transcription completion error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to process transcription", error: error.message },
      { status: 500 },
    )
  }
}
