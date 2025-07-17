import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const to = formData.get("To") as string
    const from = formData.get("From") as string

    console.log(`Live call from browser ${from} to ${to}`)

    // TwiML for live calling - connects browser to phone number
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial callerId="${process.env.TWILIO_PHONE_NUMBER || from}" record="record-from-ringing-dual" recordingStatusCallback="/api/calling/recording-webhook">
        <Number>${to}</Number>
    </Dial>
</Response>`

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("Error generating TwiML for live call:", error)

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Sorry, there was an error connecting your call. Please try again.</Say>
</Response>`

    return new NextResponse(errorTwiml, {
      headers: {
        "Content-Type": "text/xml",
      },
      status: 500,
    })
  }
}
