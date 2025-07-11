import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const yourPhoneNumber = "+919876543210"

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Please wait while we connect you. You will hear a brief hold music.</Say>
    <Play>http://com.twilio.music.classical.s3.amazonaws.com/BusyStrings.wav</Play>
    <Dial timeout="30" record="true" recordingStatusCallback="https://master-tool.vercel.app/api/calling/recording-webhook">
        <Number>${yourPhoneNumber}</Number>
    </Dial>
    <Say voice="alice">The call could not be connected. Please try again later. Goodbye.</Say>
</Response>`

    return new Response(twiml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Sorry, there was an error connecting your call. Please try again later. Goodbye.</Say>
</Response>`

    return new Response(fallbackTwiml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
