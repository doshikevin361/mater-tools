import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const from = formData.get("From") as string
    const to = formData.get("To") as string
    const digits = formData.get("Digits") as string

    console.log("Incoming call received:", { from, to, digits })

    // If digits are provided (from Gather), handle the menu selection
    if (digits) {
      return handleMenuSelection(digits, from)
    }

    // Main incoming call menu
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Welcome to BrandBuzz Ventures calling system. Thank you for calling.</Say>
    <Gather timeout="10" numDigits="1" action="https://master-tool.vercel.app/api/calling/incoming-call">
        <Say voice="alice">
            Press 1 to connect to customer support.
            Press 2 to leave a voice message.
            Press 3 to connect to a specific number.
            Press 0 to repeat this menu.
        </Say>
    </Gather>
    <Say voice="alice">We didn't receive your selection. Please call back. Goodbye.</Say>
    <Hangup/>
</Response>`

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("Error handling incoming call:", error)

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

function handleMenuSelection(digits: string, callerNumber: string) {
  let twiml = ""

  switch (digits) {
    case "1":
      // Connect to customer support (your phone)
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Connecting you to customer support. Please hold.</Say>
    <Dial timeout="30" record="true" recordingStatusCallback="https://master-tool.vercel.app/api/calling/recording-webhook">
        <Number>+919876543210</Number>
    </Dial>
    <Say voice="alice">Customer support is not available right now. Please try again later.</Say>
    <Hangup/>
</Response>`
      break

    case "2":
      // Leave a voice message
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Please leave your message after the beep. Press any key when finished.</Say>
    <Record 
        timeout="60" 
        maxLength="300" 
        action="https://master-tool.vercel.app/api/calling/voicemail-handler"
        recordingStatusCallback="https://master-tool.vercel.app/api/calling/recording-webhook"
        playBeep="true"
    />
    <Say voice="alice">Thank you for your message. Goodbye.</Say>
    <Hangup/>
</Response>`
      break

    case "3":
      // Connect to specific number (you can customize this)
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather timeout="15" numDigits="10" action="https://master-tool.vercel.app/api/calling/connect-number">
        <Say voice="alice">Please enter the 10 digit phone number you want to connect to, followed by the pound key.</Say>
    </Gather>
    <Say voice="alice">We didn't receive a valid number. Goodbye.</Say>
    <Hangup/>
</Response>`
      break

    case "0":
      // Repeat menu
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Redirect>https://master-tool.vercel.app/api/calling/incoming-call</Redirect>
</Response>`
      break

    default:
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Invalid selection. Please call back and try again.</Say>
    <Hangup/>
</Response>`
  }

  return new NextResponse(twiml, {
    headers: {
      "Content-Type": "text/xml",
    },
  })
}

export async function GET(request: NextRequest) {
  return POST(request)
}
