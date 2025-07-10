import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string
    const callStatus = formData.get("CallStatus") as string
    const callDuration = formData.get("CallDuration") as string
    const recordingUrl = formData.get("RecordingUrl") as string

    const { db } = await connectToDatabase()

    // Update call record with status
    const updateData: any = {
      status: callStatus,
      updatedAt: new Date(),
    }

    if (callDuration) {
      updateData.duration = Number.parseInt(callDuration)
      updateData.cost = (Number.parseInt(callDuration) * 0.05) / 60 // $0.05 per minute
    }

    if (recordingUrl) {
      updateData.recordingUrl = recordingUrl
    }

    await db.collection("calls").updateOne({ callSid: callSid }, { $set: updateData })

    // Return TwiML response for call handling
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Say voice="alice">Hello! You are connected to BrandBuzz calling system.</Say>
      <Pause length="1"/>
      <Say voice="alice">Please hold while we connect you.</Say>
    </Response>`

    return new NextResponse(twimlResponse, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
