import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const to = formData.get("To") as string

    if (!to) {
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say>Invalid phone number. Please try again.</Say>
        </Response>`,
        {
          headers: { "Content-Type": "application/xml" },
        },
      )
    }

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Dial record="record-from-answer" recordingStatusCallback="/api/calling/recording-webhook">
        <Number>${to}</Number>
      </Dial>
    </Response>`

    return new NextResponse(twiml, {
      headers: { "Content-Type": "application/xml" },
    })
  } catch (error) {
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say>An error occurred. Please try again later.</Say>
      </Response>`,
      {
        headers: { "Content-Type": "application/xml" },
      },
    )
  }
}
