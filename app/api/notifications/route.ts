import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const notifications = await db
      .collection("notifications")
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    // Add formatted time for display
    const formattedNotifications = notifications.map((notification) => ({
      ...notification,
      id: notification._id.toString(),
      time: new Date(notification.createdAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }))

    return NextResponse.json({
      success: true,
      notifications: formattedNotifications,
      count: formattedNotifications.length,
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch notifications",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, title, message, type = "info" } = body

    if (!userId || !title || !message) {
      return NextResponse.json({ success: false, message: "User ID, title, and message are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const notification = {
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date(),
    }

    const result = await db.collection("notifications").insertOne(notification)

    return NextResponse.json({
      success: true,
      message: "Notification created successfully",
      notificationId: result.insertedId,
    })
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create notification",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId, read = true } = body

    if (!notificationId) {
      return NextResponse.json({ success: false, message: "Notification ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const result = await db
      .collection("notifications")
      .updateOne({ _id: notificationId }, { $set: { read, updatedAt: new Date() } })

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: "Notification not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Notification updated successfully",
    })
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update notification",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
