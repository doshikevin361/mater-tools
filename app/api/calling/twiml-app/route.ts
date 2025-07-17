import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const to = formData.get("To") as string
    const from = formData.get("From") as string

    console.log(`TwiML App: Call from ${from} to ${to}`)

    // Generate TwiML response for outbound calls
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial callerId="${process.env.TWILIO_PHONE_NUMBER || "+19252617266"}" timeout="30" record="do-not-record">
        <Number>${to}</Number>
    </Dial>
    <Say voice="alice">The call could not be completed. Please try again later.</Say>
</Response>`

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("TwiML App error:", error)

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
