import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string
    const callStatus = formData.get("CallStatus") as string
    const callDuration = formData.get("CallDuration") as string
    const to = formData.get("To") as string

    const db = await getDatabase()

    const updateData: any = {
      status: callStatus?.toLowerCase(),
      updatedAt: new Date(),
    }

    if (callDuration) {
      updateData.duration = Number.parseInt(callDuration)
      updateData.cost = Math.ceil(Number.parseInt(callDuration) / 60) * 0.05
    }

    await db.collection("call_history").updateOne({ phoneNumber: to }, { $set: updateData }, { upsert: false })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
