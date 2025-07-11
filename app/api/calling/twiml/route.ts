import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! This is a call from BrandBuzz Ventures. Please hold while we connect you.</Say>
    <Pause length="2"/>
    <Say voice="alice">Thank you for your time. This call is now being recorded for quality purposes.</Say>
</Response>`

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("Error generating TwiML:", error)
    return NextResponse.json({ error: "Failed to generate TwiML" }, { status: 500 })
  }
}
