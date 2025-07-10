import type { NextRequest } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const callSid = formData.get("CallSid") as string
    const from = formData.get("From") as string
    const to = formData.get("To") as string
    const callStatus = formData.get("CallStatus") as string
    const direction = formData.get("Direction") as string

    console.log("Incoming call received:", { callSid, from, to, callStatus, direction })

    const db = await getDatabase()

    // Log the incoming call
    await db.collection("incoming_calls").insertOne({
      callSid,
      from,
      to,
      callStatus,
      direction,
      receivedAt: new Date(),
      status: "received",
    })

    // Generate TwiML response for two-way conversation
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! You've reached BrandBuzz Ventures. Please hold while we connect you to an available representative.</Say>
    <Pause length="2"/>
    <Record action="/api/voice/recording-complete" method="POST" maxLength="300" timeout="10" transcribe="true" transcribeCallback="/api/voice/transcription-complete"/>
    <Say voice="alice">Thank you for your call. We'll get back to you soon. Goodbye!</Say>
</Response>`

    return new Response(twiml, {
      headers: {
        "Content-Type": "application/xml",
      },
    })
  } catch (error) {
    console.error("Incoming call error:", error)

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">We're sorry, there was an error processing your call. Please try again later. Goodbye!</Say>
</Response>`

    return new Response(errorTwiml, {
      headers: {
        "Content-Type": "application/xml",
      },
    })
  }
}
