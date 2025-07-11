import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaignId = params.id
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || "demo-user-123"

    const db = await getDatabase()

    // Get campaign details - ALWAYS filter by userId
    const campaign = await db.collection("campaigns").findOne({
      _id: new ObjectId(campaignId),
      userId: userId,
    })

    if (!campaign) {
      return NextResponse.json(
        {
          success: false,
          message: "Campaign not found",
        },
        { status: 404 },
      )
    }

    // Get message logs for this campaign
    const messageLogs = await db
      .collection("message_logs")
      .find({ campaignId: campaignId, userId: userId })
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray()

    // Get delivery statistics
    const deliveryStats = await db
      .collection("message_logs")
      .aggregate([
        { $match: { campaignId: campaignId, userId: userId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray()

    const stats = {
      sent: deliveryStats.find((s) => s._id === "sent")?.count || 0,
      delivered: deliveryStats.find((s) => s._id === "delivered")?.count || 0,
      failed: deliveryStats.find((s) => s._id === "failed")?.count || 0,
      pending: deliveryStats.find((s) => s._id === "pending")?.count || 0,
    }

    return NextResponse.json({
      success: true,
      campaign: {
        ...campaign,
        deliveryStats: stats,
      },
      messageLogs,
    })
  } catch (error) {
    console.error("Get campaign details error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch campaign details",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaignId = params.id
    const updates = await request.json()
    const { userId = "demo-user-123" } = updates

    const db = await getDatabase()

    // Check if campaign exists and belongs to user
    const campaign = await db.collection("campaigns").findOne({
      _id: new ObjectId(campaignId),
      userId: userId,
    })

    if (!campaign) {
      return NextResponse.json(
        {
          success: false,
          message: "Campaign not found",
        },
        { status: 404 },
      )
    }

    // Update campaign
    const result = await db.collection("campaigns").updateOne(
      { _id: new ObjectId(campaignId), userId: userId },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No changes made to campaign",
        },
        { status: 400 },
      )
    }

    // Get updated campaign
    const updatedCampaign = await db.collection("campaigns").findOne({ _id: new ObjectId(campaignId) })

    return NextResponse.json({
      success: true,
      message: "Campaign updated successfully",
      campaign: updatedCampaign,
    })
  } catch (error) {
    console.error("Update campaign error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update campaign",
      },
      { status: 500 },
    )
  }
}
