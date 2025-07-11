import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Create TwiML response for the call
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="en-IN">
        Hello! This is a call from Brand Buzz Ventures. 
        Thank you for connecting with us. 
        This call is being recorded for quality purposes.
    </Say>
    <Pause length="2"/>
    <Say voice="alice" language="en-IN">
        Please stay on the line while we connect you to our representative.
    </Say>
    <Pause length="30"/>
    <Say voice="alice" language="en-IN">
        Thank you for your time. Have a great day!
    </Say>
</Response>`

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("TwiML generation error:", error)

    // Fallback TwiML
    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! Thank you for calling.</Say>
</Response>`

    return new NextResponse(fallbackTwiml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    })
  }
}
