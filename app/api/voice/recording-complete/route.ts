import type { NextRequest } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const callSid = formData.get("CallSid") as string
    const recordingSid = formData.get("RecordingSid") as string
    const recordingUrl = formData.get("RecordingUrl") as string
    const recordingDuration = formData.get("RecordingDuration") as string
    const from = formData.get("From") as string
    const to = formData.get("To") as string

    console.log("Recording completed:", { callSid, recordingSid, recordingUrl, recordingDuration })

    const db = await getDatabase()

    // Store recording information
    await db.collection("call_recordings").insertOne({
      callSid,
      recordingSid,
      recordingUrl: recordingUrl + ".mp3", // Twilio MP3 format
      recordingDuration: Number.parseInt(recordingDuration) || 0,
      from,
      to,
      createdAt: new Date(),
      status: "completed",
      transcriptionStatus: "pending",
    })

    // Update the incoming call record
    await db.collection("incoming_calls").updateOne(
      { callSid },
      {
        $set: {
          recordingSid,
          recordingUrl: recordingUrl + ".mp3",
          recordingDuration: Number.parseInt(recordingDuration) || 0,
          status: "recorded",
          updatedAt: new Date(),
        },
      },
    )

    // Generate TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Your message has been recorded. Thank you for calling!</Say>
</Response>`

    return new Response(twiml, {
      headers: {
        "Content-Type": "application/xml",
      },
    })
  } catch (error) {
    console.error("Recording completion error:", error)

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Thank you for your call. Goodbye!</Say>
</Response>`

    return new Response(errorTwiml, {
      headers: {
        "Content-Type": "application/xml",
      },
    })
  }
}
