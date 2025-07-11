import type { NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string
    const from = formData.get("From") as string
    const to = formData.get("To") as string
    const callStatus = formData.get("CallStatus") as string

    console.log("Incoming call webhook:", { callSid, from, to, callStatus })

    // Store incoming call record
    const { db } = await connectToDatabase()

    const callRecord = {
      callSid,
      userId: "demo-user", // In real app, determine from 'to' number
      phoneNumber: from,
      status: callStatus,
      direction: "inbound",
      duration: 0,
      cost: 0,
      recordingUrl: null,
      recordingSid: null,
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.collection("call_history").insertOne(callRecord)

    // Generate TwiML response to handle incoming call
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! Thank you for calling. This call may be recorded for quality purposes.</Say>
    <Record timeout="30" maxLength="300" action="/api/calling/recording-webhook" />
    <Say voice="alice">Thank you for your call. Goodbye!</Say>
</Response>`

    return new Response(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("Error handling incoming call:", error)

    // Return basic TwiML even on error
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Sorry, we're experiencing technical difficulties. Please try again later.</Say>
</Response>`

    return new Response(errorTwiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  }
}
