import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const rawTo = formData.get("To") as string
    const from = formData.get("From") as string

    if (!rawTo) {
      throw new Error("No destination number provided")
    }

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
    const callerId = process.env.TWILIO_PHONE_NUMBER || "+19252617266"

    console.log(`Outgoing call from ${from} to ${to}`)

    const baseUrl = process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_APP_URL || "https://mastertool.brandbuzzinsights.ai/"
      : "http://localhost:3000"

    const recordingWebhookUrl = `${baseUrl}/api/calling/recording-webhook`


    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial callerId="${callerId}" record="record-from-ringing-dual" recordingStatusCallback="${recordingWebhookUrl}">
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