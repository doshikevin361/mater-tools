import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const conferenceSid = formData.get("ConferenceSid") as string
    const statusCallbackEvent = formData.get("StatusCallbackEvent") as string
    const timestamp = formData.get("Timestamp") as string

    console.log("Conference webhook received:", {
      conferenceSid,
      statusCallbackEvent,
      timestamp,
    })

    const { db } = await connectToDatabase()

    // Update conference status based on event
    const updateData: any = {
      updatedAt: new Date(),
    }

    switch (statusCallbackEvent) {
      case "conference-start":
        updateData.status = "active"
        updateData.startTime = new Date()
        break
      case "conference-end":
        updateData.status = "completed"
        updateData.endTime = new Date()
        // Calculate duration and cost
        const conference = await db.collection("conference_calls").findOne({ conferenceSid })
        if (conference && conference.startTime) {
          const duration = Math.floor((new Date().getTime() - new Date(conference.startTime).getTime()) / 1000)
          updateData.duration = duration
          updateData.cost = (duration / 60) * 0.1 // $0.10 per minute for conference calls
        }
        break
      case "participant-join":
        console.log("Participant joined conference")
        break
      case "participant-leave":
        console.log("Participant left conference")
        break
    }

    await db.collection("conference_calls").updateOne({ conferenceSid }, { $set: updateData })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing conference webhook:", error)
    return NextResponse.json({ error: "Failed to process conference webhook" }, { status: 500 })
  }
}
