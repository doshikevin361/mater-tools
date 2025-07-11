import { NextResponse } from "next/server"

export async function POST() {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! You have received a call through our browser calling system. Please hold while we connect you.</Say>
    <Dial>
        <Number>+918733832957</Number>
    </Dial>
</Response>`

  return new NextResponse(twiml, {
    headers: {
      "Content-Type": "text/xml",
    },
  })
}
