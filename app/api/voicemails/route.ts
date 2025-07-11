import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || "demo-user"

    const { db } = await connectToDatabase()

    const voicemails = await db.collection("voicemails").find({}).sort({ timestamp: -1 }).limit(50).toArray()

    return NextResponse.json({
      success: true,
      voicemails: voicemails.map((vm) => ({
        id: vm._id.toString(),
        from: vm.from,
        to: vm.to,
        duration: vm.duration,
        recordingUrl: vm.recordingUrl,
        recordingSid: vm.recordingSid,
        timestamp: vm.timestamp,
        status: vm.status,
        type: vm.type,
      })),
    })
  } catch (error) {
    console.error("Error fetching voicemails:", error)
    return NextResponse.json({ error: "Failed to fetch voicemails" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { voicemailId, status } = await request.json()

    if (!voicemailId || !status) {
      return NextResponse.json({ error: "Voicemail ID and status are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    await db.collection("voicemails").updateOne(
      { _id: voicemailId },
      {
        $set: {
          status: status,
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({
      success: true,
      message: "Voicemail status updated",
    })
  } catch (error) {
    console.error("Error updating voicemail:", error)
    return NextResponse.json({ error: "Failed to update voicemail" }, { status: 500 })
  }
}
