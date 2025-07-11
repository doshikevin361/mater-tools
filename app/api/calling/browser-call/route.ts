import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, userId, duration = 0, action } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    if (action === "start") {
      // Start a real call using Twilio
      const twilioResponse = await fetch(
        "https://api.twilio.com/2010-04-01/Accounts/AC86b70352ccc2023f8cfa305712b474cd/Calls.json",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from("AC86b70352ccc2023f8cfa305712b474cd:your_auth_token").toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: phoneNumber,
            From: "+19252617266",
            Url: "https://master-tool.vercel.app/api/calling/twiml-response",
            Record: "true",
            StatusCallback: "https://master-tool.vercel.app/api/calling/status-webhook",
          }),
        },
      )

      const callData = await twilioResponse.json()

      if (callData.sid) {
        // Store call in database
        const callRecord = {
          userId: userId || "demo-user",
          phoneNumber: phoneNumber,
          callSid: callData.sid,
          callType: "browser",
          status: "initiated",
          timestamp: new Date(),
          createdAt: new Date(),
        }

        await db.collection("call_history").insertOne(callRecord)

        return NextResponse.json({
          success: true,
          callSid: callData.sid,
          status: callData.status,
          message: "Real call initiated",
        })
      }
    }

    if (action === "end") {
      // End the call and calculate cost
      const cost = (duration / 60) * 0.05 // $0.05 per minute

      await db.collection("call_history").updateOne(
        { callSid: request.headers.get("call-sid") },
        {
          $set: {
            duration: duration,
            cost: cost,
            status: "completed",
            endTime: new Date(),
          },
        },
      )

      return NextResponse.json({
        success: true,
        message: "Call ended and logged",
        cost: cost,
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Browser call error:", error)
    return NextResponse.json({ error: "Failed to process browser call" }, { status: 500 })
  }
}
