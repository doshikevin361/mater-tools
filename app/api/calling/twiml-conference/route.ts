import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conferenceId = searchParams.get("conferenceId") || "default-conference"
    const callType = searchParams.get("callType") || "first"

    console.log("Conference TwiML requested:", { conferenceId, callType })

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">You are being connected to the conference call. Please wait.</Say>
    <Dial>
        <Conference 
            statusCallback="https://master-tool.vercel.app/api/calling/conference-webhook"
            statusCallbackEvent="start end join leave mute hold"
            record="true"
            recordingStatusCallback="https://master-tool.vercel.app/api/calling/recording-webhook"
        >${conferenceId}</Conference>
    </Dial>
</Response>`

    return new Response(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("Error generating conference TwiML:", error)

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Sorry, we are experiencing technical difficulties. Please try again later.</Say>
    <Hangup/>
</Response>`

    return new Response(errorTwiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
