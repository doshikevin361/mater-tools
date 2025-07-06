import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get("campaignId")
    const platform = searchParams.get("platform") || "all"
    const status = searchParams.get("status") || "all"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const db = await getDatabase()

    // Build query
    const query: any = {}

    if (campaignId) {
      query.campaignId = campaignId
    }

    if (status !== "all") {
      query.status = status
    }

    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    }

    // Get campaign info if filtering by platform
    if (platform !== "all") {
      const campaigns = await db.collection("campaigns").find({ type: platform, userId: "demo-user" }).toArray()

      const campaignIds = campaigns.map((c) => c._id)
      query.campaignId = { $in: campaignIds }
    }

    // Get total count
    const total = await db.collection("message_logs").countDocuments(query)

    // Get delivery reports with pagination
    const reports = await db
      .collection("message_logs")
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: "campaigns",
            localField: "campaignId",
            foreignField: "_id",
            as: "campaign",
          },
        },
        {
          $lookup: {
            from: "contacts",
            localField: "contactId",
            foreignField: "_id",
            as: "contact",
          },
        },
        {
          $project: {
            campaignId: 1,
            contactId: 1,
            status: 1,
            timestamp: 1,
            messageId: 1,
            error: 1,
            mobile: 1,
            email: 1,
            campaign: { $arrayElemAt: ["$campaign", 0] },
            contact: { $arrayElemAt: ["$contact", 0] },
          },
        },
        { $sort: { timestamp: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ])
      .toArray()

    // Get delivery statistics
    const deliveryStats = await db
      .collection("message_logs")
      .aggregate([
        { $match: query },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray()

    const stats = {
      total,
      sent: deliveryStats.find((s) => s._id === "sent")?.count || 0,
      delivered: deliveryStats.find((s) => s._id === "delivered")?.count || 0,
      failed: deliveryStats.find((s) => s._id === "failed")?.count || 0,
      pending: deliveryStats.find((s) => s._id === "pending")?.count || 0,
    }

    // Calculate delivery rate
    stats.deliveryRate = stats.sent > 0 ? ((stats.delivered / stats.sent) * 100).toFixed(2) : 0

    return NextResponse.json({
      success: true,
      reports,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Delivery reports error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch delivery reports",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { campaignIds, format = "csv" } = await request.json()
    const db = await getDatabase()

    // Build query for export
    const query: any = {}
    if (campaignIds && campaignIds.length > 0) {
      query.campaignId = { $in: campaignIds }
    }

    // Get all delivery data for export
    const exportData = await db
      .collection("message_logs")
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: "campaigns",
            localField: "campaignId",
            foreignField: "_id",
            as: "campaign",
          },
        },
        {
          $lookup: {
            from: "contacts",
            localField: "contactId",
            foreignField: "_id",
            as: "contact",
          },
        },
        {
          $project: {
            campaignName: { $arrayElemAt: ["$campaign.name", 0] },
            campaignType: { $arrayElemAt: ["$campaign.type", 0] },
            contactName: { $arrayElemAt: ["$contact.name", 0] },
            contactPhone: "$mobile",
            contactEmail: "$email",
            status: 1,
            timestamp: 1,
            messageId: 1,
            error: 1,
          },
        },
        { $sort: { timestamp: -1 } },
      ])
      .toArray()

    if (format === "csv") {
      // Generate CSV content
      const csvHeaders = [
        "Campaign Name",
        "Campaign Type",
        "Contact Name",
        "Phone",
        "Email",
        "Status",
        "Timestamp",
        "Message ID",
        "Error",
      ]

      const csvRows = exportData.map((row) => [
        row.campaignName || "",
        row.campaignType || "",
        row.contactName || "",
        row.contactPhone || "",
        row.contactEmail || "",
        row.status || "",
        row.timestamp ? new Date(row.timestamp).toISOString() : "",
        row.messageId || "",
        row.error || "",
      ])

      const csvContent = [
        csvHeaders.join(","),
        ...csvRows.map((row) => row.map((field) => `"${field}"`).join(",")),
      ].join("\n")

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="delivery-report-${Date.now()}.csv"`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: exportData,
      count: exportData.length,
    })
  } catch (error) {
    console.error("Export delivery reports error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to export delivery reports",
      },
      { status: 500 },
    )
  }
}
