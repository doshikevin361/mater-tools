import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string
    const recordingUrl = formData.get("RecordingUrl") as string
    const recordingSid = formData.get("RecordingSid") as string
    const recordingDuration = formData.get("RecordingDuration") as string

    console.log("Recording webhook received:", {
      callSid,
      recordingUrl,
      recordingSid,
      recordingDuration,
    })

    // Connect to database and update call record with recording info
    const { db } = await connectToDatabase()

    const updateData = {
      recordingUrl: recordingUrl + ".mp3",
      recordingSid,
      recordingDuration: Number.parseInt(recordingDuration) || 0,
      recordingAvailable: true,
      updatedAt: new Date(),
    }

    await db.collection("call_history").updateOne({ callSid }, { $set: updateData })

    // Generate TwiML response to continue call flow
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Your message has been recorded. Thank you!</Say>
</Response>`

    return new Response(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("Error processing recording webhook:", error)

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Recording failed. Thank you for calling.</Say>
</Response>`

    return new Response(errorTwiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  }
}

// Get recording URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const callSid = searchParams.get("callSid")

    if (!callSid) {
      return NextResponse.json({ error: "Call SID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const call = await db.collection("call_history").findOne({ callSid })

    if (!call) {
      return NextResponse.json({ error: "Call record not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      recordingUrl: call.recordingUrl,
      recordingSid: call.recordingSid,
      recordingDuration: call.recordingDuration,
      recordingAvailable: call.recordingAvailable || false,
    })
  } catch (error) {
    console.error("Error fetching recording:", error)
    return NextResponse.json({ error: "Failed to fetch recording" }, { status: 500 })
  }
}
