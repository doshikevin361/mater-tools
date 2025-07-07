import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get("campaignId")
    const userId = searchParams.get("userId")

    if (!campaignId || !userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Campaign ID and User ID are required",
        },
        { status: 400 },
      )
    }

    const db = await getDatabase()

    // Get campaign details with optimized query
    const campaign = await db.collection("campaigns").findOne(
      {
        _id: new ObjectId(campaignId),
        userId: userId,
      },
      {
        projection: {
          _id: 1,
          name: 1,
          status: 1,
          message: 1,
          recipientCount: 1,
          sent: 1,
          failed: 1,
          delivered: 1,
          createdAt: 1,
          completedAt: 1,
          templateId: 1,
          cost: 1,
          finalCost: 1,
        },
      },
    )

    if (!campaign) {
      return NextResponse.json(
        {
          success: false,
          message: "Campaign not found",
        },
        { status: 404 },
      )
    }

    // Get template details if exists
    let templateInfo = null
    if (campaign.templateId) {
      templateInfo = await db.collection("whatsapp_templates").findOne(
        { templateId: campaign.templateId },
        {
          projection: {
            templateId: 1,
            templateName: 1,
            status: 1,
            createdAt: 1,
            lastChecked: 1,
            checkCount: 1,
            approvedAt: 1,
            rejectedAt: 1,
          },
        },
      )
    }

    // Get template check queue info if still pending
    let checkQueueInfo = null
    if (templateInfo && templateInfo.status === "PENDING") {
      checkQueueInfo = await db.collection("template_check_queue").findOne(
        { templateId: campaign.templateId },
        {
          projection: {
            nextCheckAt: 1,
            checkCount: 1,
            checkInterval: 1,
            lastError: 1,
          },
        },
      )
    }

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign._id,
        name: campaign.name,
        status: campaign.status,
        message: campaign.message,
        recipientCount: campaign.recipientCount,
        sent: campaign.sent || 0,
        failed: campaign.failed || 0,
        delivered: campaign.delivered || 0,
        createdAt: campaign.createdAt,
        completedAt: campaign.completedAt,
        estimatedCost: campaign.cost,
        actualCost: campaign.finalCost,
      },
      template: templateInfo
        ? {
            templateId: templateInfo.templateId,
            templateName: templateInfo.templateName,
            status: templateInfo.status,
            createdAt: templateInfo.createdAt,
            lastChecked: templateInfo.lastChecked,
            checkCount: templateInfo.checkCount || 0,
            approvedAt: templateInfo.approvedAt,
            rejectedAt: templateInfo.rejectedAt,
          }
        : null,
      checkQueue: checkQueueInfo
        ? {
            nextCheckAt: checkQueueInfo.nextCheckAt,
            checkCount: checkQueueInfo.checkCount,
            checkInterval: checkQueueInfo.checkInterval,
            lastError: checkQueueInfo.lastError,
          }
        : null,
    })
  } catch (error) {
    console.error("Template status check error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to check template status", error: error.message },
      { status: 500 },
    )
  }
}
