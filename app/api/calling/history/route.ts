import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const { db } = await connectToDatabase()

    const calls = await db.collection("calls").find({}).sort({ timestamp: -1 }).limit(50).toArray()

    return NextResponse.json({
      success: true,
      calls: calls.map((call) => ({
        ...call,
        _id: call._id.toString(),
      })),
    })
  } catch (error) {
    console.error("Error fetching call history:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch call history" }, { status: 500 })
  }
}
