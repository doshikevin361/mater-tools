import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Create TwiML response for the call
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! You have received a call from BrandBuzz calling system.</Say>
    <Pause length="1"/>
    <Say voice="alice">Please hold while we connect you to the caller.</Say>
    <Pause length="2"/>
    <Say voice="alice">You are now connected. Have a great conversation!</Say>
</Response>`

    return new NextResponse(twimlResponse, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("TwiML generation error:", error)

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Sorry, there was an error connecting your call. Please try again later.</Say>
    <Hangup/>
</Response>`

    return new NextResponse(errorTwiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  }
}
