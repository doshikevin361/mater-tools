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
    const direction = formData.get("Direction") as string

    console.log("Call status webhook received:", {
      callSid,
      callStatus,
      callDuration,
      from,
      to,
      direction,
    })

    // Connect to database and update call record
    const { db } = await connectToDatabase()

    const updateData = {
      status: callStatus,
      duration: Number.parseInt(callDuration) || 0,
      cost: callDuration ? (Number.parseInt(callDuration) / 60) * 0.05 : 0, // $0.05 per minute
      updatedAt: new Date(),
    }

    // Add completion timestamp for completed calls
    if (callStatus === "completed") {
      updateData.completedAt = new Date()
    }

    const result = await db.collection("call_history").updateOne({ callSid }, { $set: updateData })

    if (result.matchedCount === 0) {
      console.log("Call record not found, creating new one")

      // Create new record if not found (for incoming calls)
      const newRecord = {
        callSid,
        userId: "demo-user", // In real app, determine from phone number mapping
        phoneNumber: direction === "inbound" ? from : to,
        direction: direction || "outbound",
        ...updateData,
        timestamp: new Date(),
        createdAt: new Date(),
      }

      await db.collection("call_history").insertOne(newRecord)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing call webhook:", error)
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
  }
}
