import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const conferenceId = formData.get("conferenceId") as string
    const callType = formData.get("callType") as string // "first" or "second"

    console.log("Conference TwiML requested:", { conferenceId, callType })

    const waitMessage =
      callType === "first"
        ? "Please wait while we connect the other party."
        : "You are being connected to the conference."

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">${waitMessage}</Say>
    <Dial>
        <Conference 
            statusCallback="${process.env.NEXT_PUBLIC_BASE_URL}/api/calling/conference-webhook"
            statusCallbackEvent="start,end,join,leave"
            record="true"
            recordingStatusCallback="${process.env.NEXT_PUBLIC_BASE_URL}/api/calling/recording-webhook"
            waitUrl="http://twimlets.com/holdmusic?Bucket=com.twilio.music.ambient"
            maxParticipants="2"
        >${conferenceId}</Conference>
    </Dial>
</Response>`

    return new NextResponse(twiml, {
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

    return new NextResponse(errorTwiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  }
}
