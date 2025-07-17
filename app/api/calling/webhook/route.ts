import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string
    const callStatus = formData.get("CallStatus") as string
    const callDuration = formData.get("CallDuration") as string
    const from = formData.get("From") as string
    const to = formData.get("To") as string
    const answeredBy = formData.get("AnsweredBy") as string

    console.log(`Call webhook received:`)
    console.log(`- CallSid: ${callSid}`)
    console.log(`- Status: ${callStatus}`)
    console.log(`- Duration: ${callDuration}`)
    console.log(`- From: ${from}`)
    console.log(`- To: ${to}`)
    console.log(`- AnsweredBy: ${answeredBy}`)

    const { db } = await connectToDatabase()

    const updateData: any = {
      status: callStatus,
      updatedAt: new Date(),
    }

    if (callDuration) {
      updateData.duration = Number.parseInt(callDuration)
      updateData.cost = (Number.parseInt(callDuration) / 60) * 0.05 // $0.05 per minute
    }

    if (answeredBy) {
      updateData.answeredBy = answeredBy
    }

    // Update existing call record by callSid
    const updateResult = await db.collection("calls").updateOne(
      { callSid: callSid },
      {
        $set: updateData,
        $setOnInsert: {
          phoneNumber: to,
          fromNumber: from,
          timestamp: new Date(),
          type: "browser_call",
        },
      },
      { upsert: true },
    )

    console.log(`Database update result:`, updateResult)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ success: false, error: "Failed to process webhook" }, { status: 500 })
  }
}
