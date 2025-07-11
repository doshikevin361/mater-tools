import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const recordingUrl = formData.get("RecordingUrl") as string
    const recordingSid = formData.get("RecordingSid") as string
    const from = formData.get("From") as string
    const to = formData.get("To") as string
    const duration = formData.get("RecordingDuration") as string

    const { db } = await connectToDatabase()

    const voicemail = {
      recordingUrl,
      recordingSid,
      from,
      to,
      duration: Number.parseInt(duration) || 0,
      timestamp: new Date(),
      status: "new",
      type: "voicemail",
      createdAt: new Date(),
    }

    await db.collection("voicemails").insertOne(voicemail)

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Thank you for your message. We will get back to you soon. Goodbye.</Say>
    <Hangup/>
</Response>`

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Thank you for calling. Goodbye.</Say>
    <Hangup/>
</Response>`

    return new NextResponse(errorTwiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
