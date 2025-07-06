import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // In production, fetch from database with user authentication
    const campaigns = [
      {
        id: "1",
        name: "Summer Sale 2024",
        type: "WhatsApp",
        messageType: "text",
        status: "Completed",
        sent: 1250,
        delivered: 1230,
        read: 980,
        replied: 45,
        failed: 20,
        cost: 625,
        createdAt: "2024-01-15T10:00:00Z",
        completedAt: "2024-01-15T10:15:00Z",
      },
      {
        id: "2",
        name: "Product Launch",
        type: "WhatsApp",
        messageType: "image",
        status: "In Progress",
        sent: 850,
        delivered: 820,
        read: 650,
        replied: 32,
        failed: 30,
        cost: 425,
        createdAt: "2024-01-14T14:30:00Z",
        progress: 75,
      },
    ]

    return NextResponse.json({
      success: true,
      campaigns,
      total: campaigns.length,
    })
  } catch (error) {
    console.error("Get campaigns error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch campaigns",
      },
      { status: 500 },
    )
  }
}
