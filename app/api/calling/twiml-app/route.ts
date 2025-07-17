import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const to = formData.get("To") as string
    const from = formData.get("From") as string
    const callerId = process.env.TWILIO_PHONE_NUMBER || "+19252617266"

    console.log(`TwiML App: Outbound call from ${from} to ${to}`)

    // Validate phone number format
    if (!to || !to.startsWith("+")) {
      console.error("Invalid phone number format:", to)
      const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Invalid phone number format. Please try again.</Say>
</Response>`
      return new NextResponse(errorTwiml, {
        headers: { "Content-Type": "text/xml" },
      })
    }

    // Generate TwiML for outbound call
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial callerId="${callerId}" timeout="30" record="record-from-ringing-dual" recordingStatusCallback="/api/calling/recording-webhook">
        <Number>${to}</Number>
    </Dial>
    <Say voice="alice">The call could not be completed. Please check the number and try again.</Say>
</Response>`

    console.log("Generated TwiML:", twiml)

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("TwiML generation error:", error)

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Sorry, there was an error processing your call. Please try again later.</Say>
</Response>`

    return new NextResponse(errorTwiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  }
}
