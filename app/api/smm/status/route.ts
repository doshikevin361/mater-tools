import { type NextRequest, NextResponse } from "next/server"
import { getSMMClient } from "@/lib/smm-api-client"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get("campaignId")
    const userId = searchParams.get("userId")

    if (!campaignId || !userId) {
      return NextResponse.json({ success: false, message: "Missing campaignId or userId" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Get campaign from database
    const campaign = await db.collection("campaigns").findOne({
      _id: new ObjectId(campaignId),
      userId: userId,
    })

    if (!campaign) {
      return NextResponse.json({ success: false, message: "Campaign not found" }, { status: 404 })
    }

    if (!campaign.smmOrderId) {
      return NextResponse.json({
        success: true,
        campaign: campaign,
        status: "pending",
      })
    }

    // Get status from SMM API
    const smmClient = getSMMClient()
    const orderStatus = await smmClient.getOrderStatus(campaign.smmOrderId)

    // Update campaign with latest status
    const updatedCampaign = {
      ...campaign,
      currentCount:
        Number.parseInt(orderStatus.start_count) + (campaign.targetCount - Number.parseInt(orderStatus.remains)),
      status:
        orderStatus.status === "Completed"
          ? "completed"
          : orderStatus.status === "In progress"
            ? "active"
            : orderStatus.status === "Partial"
              ? "active"
              : "active",
      updatedAt: new Date(),
    }

    // Update in database
    await db.collection("campaigns").updateOne({ _id: new ObjectId(campaignId) }, { $set: updatedCampaign })

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign,
      smmStatus: orderStatus,
    })
  } catch (error) {
    console.error("Error fetching campaign status:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch campaign status",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
