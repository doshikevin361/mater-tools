import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const rawTo = formData.get("To") as string
    const from = formData.get("From") as string

    // Format the phone number to ensure E.164 format
    const formatIndianNumber = (number: string): string => {
      const cleaned = number.replace(/\D/g, "")
      if (cleaned.length === 10) {
        return `+91${cleaned}`
      }
      if (cleaned.startsWith("91") && cleaned.length === 12) {
        return `+${cleaned}`
      }
      return `+91${cleaned}`
    }

    const to = formatIndianNumber(rawTo)

    console.log(`Outgoing call from ${from} to ${to}`)

    console.log(`Outgoing call from ${from} to ${to}`)

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial callerId="+19252617266" record="record-from-ringing-dual" recordingStatusCallback="/api/calling/recording-webhook">
        <Number>${to}</Number>
    </Dial>
</Response>`

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("Error generating TwiML:", error)

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Sorry, there was an error processing your call. Please try again.</Say>
</Response>`

    return new NextResponse(errorTwiml, {
      headers: {
        "Content-Type": "text/xml",
      },
      status: 500,
    })
  }
}