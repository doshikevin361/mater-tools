import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

export async function POST(request: NextRequest) {
  const twiml = new twilio.twiml.VoiceResponse()

  // Direct connection - no hold music, just connect
  twiml.say("Hello! You are now connected to a browser call.")

  // Connect to browser client
  const dial = twiml.dial({
    callerId: "+19252617266",
    record: "record-from-answer",
    recordingStatusCallback: "https://master-tool.vercel.app/api/calling/recording-webhook",
  })

  dial.client("browser-user")

  return new NextResponse(twiml.toString(), {
    headers: {
      "Content-Type": "text/xml",
    },
  })
}
