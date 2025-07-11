import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)

    const to = params.get("To")
    const from = params.get("From")

    console.log(`TwiML App: Outgoing call from ${from} to ${to}`)

    // Create TwiML response for outgoing calls
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial callerId="+919876543210" record="record-from-answer" recordingStatusCallback="/api/calling/recording-webhook">
        <Number>${to}</Number>
    </Dial>
</Response>`

    return new Response(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("Error in TwiML app:", error)

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Sorry, there was an error connecting your call. Please try again.</Say>
</Response>`

    return new Response(errorTwiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  }
}

export async function GET(request: NextRequest) {
  // Handle GET requests for TwiML app
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Welcome to the calling service.</Say>
</Response>`

  return new Response(twiml, {
    headers: {
      "Content-Type": "text/xml",
    },
  })
}
