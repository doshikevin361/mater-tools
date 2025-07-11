import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const notificationData = await request.json()

    const { db } = await connectToDatabase()

    // Save notification to database
    const notification = {
      ...notificationData,
      timestamp: new Date(),
      read: false,
    }

    await db.collection("notifications").insertOne(notification)

    return NextResponse.json({ success: true, notification })
  } catch (error) {
    console.error("Error saving notification:", error)
    return NextResponse.json({ error: "Failed to save notification" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const notifications = await db
      .collection("notifications")
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { notificationId, read } = await request.json()

    const { db } = await connectToDatabase()

    await db.collection("notifications").updateOne({ _id: notificationId }, { $set: { read } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 })
  }
}
