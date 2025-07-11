import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const conferenceSid = formData.get("ConferenceSid") as string
    const statusCallbackEvent = formData.get("StatusCallbackEvent") as string
    const participantCount = formData.get("ParticipantCount") as string

    console.log("Conference webhook received:", {
      conferenceSid,
      statusCallbackEvent,
      participantCount,
    })

    const { db } = await connectToDatabase()

    const updateData = {
      status: statusCallbackEvent,
      participantCount: Number.parseInt(participantCount) || 0,
      updatedAt: new Date(),
    }

    if (statusCallbackEvent === "conference-end") {
      updateData.endTime = new Date()
    }

    await db.collection("conference_calls").updateOne({ conferenceId: conferenceSid }, { $set: updateData })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing conference webhook:", error)
    return NextResponse.json({ error: "Failed to process conference webhook" }, { status: 500 })
  }
}
