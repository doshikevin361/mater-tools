import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const digits = formData.get("Digits") as string
    const callSid = formData.get("CallSid") as string

    console.log("IVR Response received:", { digits, callSid })

    let twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>`

    switch (digits) {
      case "1":
        twiml += `
    <Say voice="alice">You pressed 1. Thank you for your interest in our products. A representative will contact you soon.</Say>`
        break
      case "2":
        twiml += `
    <Say voice="alice">You pressed 2. For customer support, please call our helpline at 1-800-SUPPORT.</Say>`
        break
      case "3":
        twiml += `
    <Say voice="alice">You pressed 3. Visit our website at example dot com for more information.</Say>`
        break
      case "0":
        twiml += `
    <Say voice="alice">You pressed 0. Connecting you to our main office.</Say>
    <Dial>+1234567890</Dial>`
        break
      default:
        twiml += `
    <Say voice="alice">Invalid selection. Please try again.</Say>
    <Redirect>/api/voice/ivr-response</Redirect>`
        break
    }

    twiml += `
    <Say voice="alice">Thank you for calling. Goodbye!</Say>
</Response>`

    return new Response(twiml, {
      headers: {
        "Content-Type": "application/xml",
      },
    })
  } catch (error) {
    console.error("IVR response error:", error)

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">We're sorry, there was an error processing your request. Please try again later. Goodbye!</Say>
</Response>`

    return new Response(errorTwiml, {
      headers: {
        "Content-Type": "application/xml",
      },
    })
  }
}
