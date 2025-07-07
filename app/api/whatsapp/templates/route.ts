import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const status = searchParams.get("status")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 },
      )
    }

    const db = await getDatabase()

    // Build query
    const query: any = { userId: userId }
    if (status) {
      query.status = status
    }

    // Get templates with pagination and optimized projection
    const templates = await db
      .collection("whatsapp_templates")
      .find(query, {
        projection: {
          templateId: 1,
          templateName: 1,
          message: 1,
          status: 1,
          createdAt: 1,
          lastChecked: 1,
          checkCount: 1,
          approvedAt: 1,
          rejectedAt: 1,
          mediaUrl: 1,
          mediaType: 1,
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    // Get total count for pagination
    const totalCount = await db.collection("whatsapp_templates").countDocuments(query)

    // Get usage statistics for each template
    const templateIds = templates.map((t) => t.templateId)
    const usageStats = await db
      .collection("campaigns")
      .aggregate([
        {
          $match: {
            templateId: { $in: templateIds },
            status: { $in: ["Completed", "Partially Completed"] },
          },
        },
        {
          $group: {
            _id: "$templateId",
            totalCampaigns: { $sum: 1 },
            totalSent: { $sum: "$sent" },
            totalFailed: { $sum: "$failed" },
            lastUsed: { $max: "$createdAt" },
          },
        },
      ])
      .toArray()

    // Combine template data with usage stats
    const templatesWithStats = templates.map((template) => {
      const stats = usageStats.find((s) => s._id === template.templateId)
      return {
        ...template,
        usage: stats
          ? {
              totalCampaigns: stats.totalCampaigns,
              totalSent: stats.totalSent,
              totalFailed: stats.totalFailed,
              lastUsed: stats.lastUsed,
              successRate:
                stats.totalSent > 0
                  ? ((stats.totalSent / (stats.totalSent + stats.totalFailed)) * 100).toFixed(1)
                  : "0.0",
            }
          : {
              totalCampaigns: 0,
              totalSent: 0,
              totalFailed: 0,
              lastUsed: null,
              successRate: "0.0",
            },
      }
    })

    return NextResponse.json({
      success: true,
      templates: templatesWithStats,
      pagination: {
        page: page,
        limit: limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
      summary: {
        total: totalCount,
        approved: templates.filter((t) => t.status === "APPROVED").length,
        pending: templates.filter((t) => t.status === "PENDING").length,
        rejected: templates.filter((t) => t.status === "REJECTED").length,
      },
    })
  } catch (error) {
    console.error("Templates list error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch templates", error: error.message },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get("templateId")
    const userId = searchParams.get("userId")

    if (!templateId || !userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Template ID and User ID are required",
        },
        { status: 400 },
      )
    }

    const db = await getDatabase()

    // Check if template belongs to user
    const template = await db.collection("whatsapp_templates").findOne({
      templateId: templateId,
      userId: userId,
    })

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          message: "Template not found",
        },
        { status: 404 },
      )
    }

    // Check if template is being used in active campaigns
    const activeCampaigns = await db.collection("campaigns").countDocuments({
      templateId: templateId,
      status: { $in: ["Processing", "Sending Messages", "Template Submitted - Awaiting Approval"] },
    })

    if (activeCampaigns > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot delete template that is being used in active campaigns",
        },
        { status: 400 },
      )
    }

    // Delete template from WhatsApp (optional - you might want to keep it for historical purposes)
    // For now, just mark as deleted in our database
    await db.collection("whatsapp_templates").updateOne(
      { templateId: templateId, userId: userId },
      {
        $set: {
          status: "DELETED",
          deletedAt: new Date(),
        },
      },
    )

    // Remove from check queue if exists
    await db.collection("template_check_queue").deleteOne({
      templateId: templateId,
    })

    return NextResponse.json({
      success: true,
      message: "Template deleted successfully",
    })
  } catch (error) {
    console.error("Template deletion error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to delete template", error: error.message },
      { status: 500 },
    )
  }
}
