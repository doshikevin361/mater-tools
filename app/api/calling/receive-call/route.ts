import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const from = formData.get("From") as string
    const to = formData.get("To") as string
    const callSid = formData.get("CallSid") as string

    console.log("Incoming call received:", { from, to, callSid })

    // Store incoming call record
    const { db } = await connectToDatabase()

    const callRecord = {
      callSid,
      userId: "demo-user", // In real app, map phone number to user
      phoneNumber: from,
      direction: "inbound",
      status: "ringing",
      duration: 0,
      cost: 0,
      recordingUrl: null,
      recordingSid: null,
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.collection("call_history").insertOne(callRecord)

    // Return TwiML to handle the incoming call
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! You have reached our calling system. Please hold while we connect you.</Say>
    <Dial timeout="30" record="true" recordingStatusCallback="${process.env.NEXT_PUBLIC_BASE_URL}/api/calling/recording-webhook">
        <Number>${process.env.TWILIO_PHONE_NUMBER}</Number>
    </Dial>
    <Say voice="alice">Sorry, no one is available to take your call. Please try again later. Goodbye!</Say>
</Response>`

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("Error handling incoming call:", error)

    // Return error TwiML
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Sorry, we are experiencing technical difficulties. Please try again later.</Say>
    <Hangup/>
</Response>`

    return new NextResponse(errorTwiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  }
}
