import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const digits = formData.get("Digits") as string
    const from = formData.get("From") as string

    console.log("Connect number request:", { digits, from })

    if (!digits || digits.length !== 10) {
      const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Invalid phone number. Please call back and try again.</Say>
    <Hangup/>
</Response>`

      return new NextResponse(errorTwiml, {
        headers: {
          "Content-Type": "text/xml",
        },
      })
    }

    // Format the number for calling
    const formattedNumber = `+91${digits}`

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Connecting you to ${digits}. Please hold.</Say>
    <Dial 
        timeout="30" 
        record="true" 
        recordingStatusCallback="https://master-tool.vercel.app/api/calling/recording-webhook"
        callerId="${from}"
    >
        <Number>${formattedNumber}</Number>
    </Dial>
    <Say voice="alice">The call could not be completed. Please try again later.</Say>
    <Hangup/>
</Response>`

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("Error connecting number:", error)

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Sorry, there was an error. Please try again later.</Say>
    <Hangup/>
</Response>`

    return new NextResponse(errorTwiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
