import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const to = formData.get("To") as string
    const from = process.env.TWILIO_PHONE_NUMBER

    if (!from) {
      console.error("TWILIO_PHONE_NUMBER not configured")
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say>Sorry, calling service is not configured properly.</Say>
        </Response>`,
        {
          headers: { "Content-Type": "text/xml" },
          status: 500,
        },
      )
    }

    console.log(`TwiML App: Making call from ${from} to ${to}`)

    // Generate TwiML for outgoing call
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Dial callerId="${from}" record="record-from-answer" recordingStatusCallback="/api/calling/recording-webhook">
        <Number>${to}</Number>
      </Dial>
    </Response>`

    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml" },
    })
  } catch (error) {
    console.error("Error in TwiML app:", error)
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say>Sorry, there was an error processing your call.</Say>
      </Response>`,
      {
        headers: { "Content-Type": "text/xml" },
        status: 500,
      },
    )
  }
}
