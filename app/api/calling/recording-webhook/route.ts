import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string
    const recordingSid = formData.get("RecordingSid") as string
    const recordingUrl = formData.get("RecordingUrl") as string
    const recordingStatus = formData.get("RecordingStatus") as string
    const recordingDuration = formData.get("RecordingDuration") as string

    console.log("Recording webhook received:", {
      callSid,
      recordingSid,
      recordingUrl,
      recordingStatus,
      recordingDuration,
    })

    if (recordingStatus === "completed" && recordingUrl) {
      // Update call record with recording information
      const { db } = await connectToDatabase()

      const updateData = {
        recordingSid,
        recordingUrl: `${recordingUrl}.mp3`, // Add .mp3 extension for download
        recordingDuration: Number.parseInt(recordingDuration) || 0,
        updatedAt: new Date(),
      }

      await db.collection("call_history").updateOne({ callSid }, { $set: updateData })

      console.log(`Recording saved for call ${callSid}: ${recordingUrl}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing recording webhook:", error)
    return NextResponse.json({ error: "Failed to process recording webhook" }, { status: 500 })
  }
}

// Get recording URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const callSid = searchParams.get("callSid")

    if (!callSid) {
      return NextResponse.json({ error: "Call SID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const call = await db.collection("call_history").findOne({ callSid })

    if (!call) {
      return NextResponse.json({ error: "Call record not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      recordingUrl: call.recordingUrl,
      recordingSid: call.recordingSid,
      recordingDuration: call.recordingDuration,
      recordingAvailable: call.recordingAvailable || false,
    })
  } catch (error) {
    console.error("Error fetching recording:", error)
    return NextResponse.json({ error: "Failed to fetch recording" }, { status: 500 })
  }
}
