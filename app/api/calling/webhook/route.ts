import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Extract Twilio webhook data
    const callSid = formData.get("CallSid") as string
    const callStatus = formData.get("CallStatus") as string
    const callDuration = formData.get("CallDuration") as string
    const from = formData.get("From") as string
    const to = formData.get("To") as string
    const answeredBy = formData.get("AnsweredBy") as string
    const recordingUrl = formData.get("RecordingUrl") as string

    console.log("Twilio webhook received:", {
      callSid,
      callStatus,
      callDuration,
      from,
      to,
      answeredBy,
      recordingUrl,
    })

    // Connect to database
    const { db } = await connectToDatabase()

    // Update call record in database
    const updateData: any = {
      status: callStatus,
      lastUpdated: new Date(),
      webhookData: {
        callSid,
        callStatus,
        callDuration: callDuration ? Number.parseInt(callDuration) : 0,
        from,
        to,
        answeredBy,
        recordingUrl,
      },
    }

    if (callDuration) {
      updateData.duration = Number.parseInt(callDuration)
      updateData.cost = (Number.parseInt(callDuration) / 60) * 0.05 // $0.05 per minute
    }

    if (recordingUrl) {
      updateData.recordingUrl = recordingUrl
    }

    const result = await db.collection("call_history").updateOne({ callSid: callSid }, { $set: updateData })

    console.log("Call record updated:", result.modifiedCount)

    // Return TwiML response (empty response is fine for status callbacks)
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
</Response>`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/xml",
        },
      },
    )
  } catch (error) {
    console.error("Webhook error:", error)

    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
</Response>`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/xml",
        },
      },
    )
  }
}
