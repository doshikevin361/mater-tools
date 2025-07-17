import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const to = formData.get("To") as string
    const from = formData.get("From") as string
    const callSid = formData.get("CallSid") as string

    console.log("TwiML App webhook called:", { to, from, callSid })

    // Format the phone number for Indian numbers
    let formattedTo = to
    if (to && !to.startsWith("+")) {
      if (to.startsWith("91")) {
        formattedTo = `+${to}`
      } else if (to.length === 10) {
        formattedTo = `+91${to}`
      }
    }

    // Generate TwiML response to dial the number
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial 
        callerId="${process.env.TWILIO_PHONE_NUMBER}"
        record="record-from-ringing-dual"
        recordingStatusCallback="${process.env.NEXT_PUBLIC_BASE_URL}/api/calling/recording-webhook"
        timeout="30"
        timeLimit="3600"
    >
        <Number>${formattedTo}</Number>
    </Dial>
    <Say voice="alice">The call could not be completed. Please try again later.</Say>
</Response>`

    console.log("Generated TwiML response for call:", callSid)

    return new NextResponse(twimlResponse, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error: any) {
    console.error("Error in TwiML app webhook:", error)

    // Return error TwiML response
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Sorry, there was an error processing your call. Please try again later.</Say>
    <Hangup/>
</Response>`

    return new NextResponse(errorTwiml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const to = searchParams.get("To")

    console.log("TwiML App GET request:", { to })

    // Simple TwiML response for GET requests
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello from your TwiML application. This endpoint is working correctly.</Say>
    <Hangup/>
</Response>`

    return new NextResponse(twimlResponse, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error: any) {
    console.error("Error in TwiML app GET:", error)

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Error in TwiML application.</Say>
    <Hangup/>
</Response>`

    return new NextResponse(errorTwiml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    })
  }
}
