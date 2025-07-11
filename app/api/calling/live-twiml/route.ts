import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const from = formData.get("From") as string
    const to = formData.get("To") as string

    console.log("Live call TwiML requested for:", { from, to })

    // Create TwiML that connects the caller directly to your phone
    // Replace YOUR_PHONE_NUMBER with your actual phone number
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Connecting your call, please wait.</Say>
    <Dial 
        timeout="30" 
        record="true"
        recordingStatusCallback="${process.env.NEXT_PUBLIC_BASE_URL}/api/calling/recording-webhook"
        callerId="${from}"
    >
        <Number>+919876543210</Number>
    </Dial>
    <Say voice="alice">The call could not be completed. Please try again later.</Say>
</Response>`

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("Error generating live call TwiML:", error)

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Sorry, we are experiencing technical difficulties. Please try again later.</Say>
    <Hangup/>
</Response>`

    return new NextResponse(errorTwiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  }
}
