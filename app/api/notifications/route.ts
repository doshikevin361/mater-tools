import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || "demo-user"
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    const db = await getDatabase()

    // Get user's notifications
    const notifications = await db
      .collection("notifications")
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    return NextResponse.json({
      success: true,
      notifications: notifications.map((notification) => ({
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        time: formatTimeAgo(notification.createdAt),
        createdAt: notification.createdAt,
      })),
    })
  } catch (error) {
    console.error("Get notifications error:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId, read } = body

    const db = await getDatabase()

    await db.collection("notifications").updateOne({ _id: notificationId }, { $set: { read, updatedAt: new Date() } })

    return NextResponse.json({
      success: true,
      message: "Notification updated successfully",
    })
  } catch (error) {
    console.error("Update notification error:", error)
    return NextResponse.json({ success: false, message: "Failed to update notification" }, { status: 500 })
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return "Just now"
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? "s" : ""} ago`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? "s" : ""} ago`
  }
}
