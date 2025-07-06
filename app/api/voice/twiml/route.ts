import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const audioUrl = searchParams.get("audioUrl")
    const message = searchParams.get("message")
    const voice = searchParams.get("voice") || "alice"
    const language = searchParams.get("language") || "en-US"

    console.log("TwiML request:", { audioUrl, message, voice, language })

    let twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>`

    if (audioUrl) {
      // Audio file playback
      console.log("Generating TwiML for audio playback:", audioUrl)
      
      // Validate audio URL
      try {
        new URL(audioUrl)
        if (audioUrl.startsWith("blob:")) {
          throw new Error("Blob URLs not supported")
        }
      } catch (urlError) {
        console.error("Invalid audio URL:", urlError)
        twiml += `
  <Say voice="${voice}" language="${language}">Sorry, there was an issue with the audio file. Please try again later.</Say>`
      }

      twiml += `
  <Play>${escapeXml(audioUrl)}</Play>
  <Pause length="1"/>
  <Say voice="${voice}" language="${language}">Thank you for listening. Have a great day!</Say>`
    } else if (message) {
      // Text-to-speech
      console.log("Generating TwiML for TTS:", message.substring(0, 50))
      twiml += `
  <Say voice="${voice}" language="${language}">${escapeXml(message)}</Say>
  <Pause length="1"/>
  <Say voice="${voice}" language="${language}">Thank you for listening. Have a great day!</Say>`
    } else {
      // Fallback message
      console.log("Generating fallback TwiML")
      twiml += `
  <Say voice="${voice}" language="${language}">Hello, this is an automated message from BrandBuzz Ventures. Thank you for your time.</Say>`
    }

    twiml += `
</Response>`

    console.log("Generated TwiML:", twiml)

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    })
  } catch (error) {
    console.error("TwiML generation error:", error)

    // Return safe fallback TwiML
    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">Hello, this is an automated message from BrandBuzz Ventures. Thank you for your time.</Say>
</Response>`

    return new NextResponse(fallbackTwiml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}
