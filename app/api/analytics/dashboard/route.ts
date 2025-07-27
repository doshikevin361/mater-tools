import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30d"
    const userId = searchParams.get("userId")

    console.log("Analytics request for userId:", userId, "period:", period)

    const db = await getDatabase()

    // Calculate date range based on period
    const now = new Date()
    const startDate = new Date()

    switch (period) {
      case "7d":
        startDate.setDate(now.getDate() - 7)
        break
      case "30d":
        startDate.setDate(now.getDate() - 30)
        break
      case "90d":
        startDate.setDate(now.getDate() - 90)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Get user's campaigns for the period - ALWAYS filter by userId
    const campaigns = await db
      .collection("campaigns")
      .find({
        userId,
        createdAt: { $gte: startDate },
      })
      .toArray()

    console.log(`Found ${campaigns.length} campaigns for user ${userId}`)

    // Calculate overview stats
    const totalMessagesSent = campaigns.reduce((sum, campaign) => sum + (campaign.sent || 0), 0)
    const activeCampaigns = campaigns.filter((c) => c.status === "Processing" || c.status === "Sending").length
    const totalDelivered = campaigns.reduce((sum, campaign) => sum + (campaign.delivered || 0), 0)
    const successRate = totalMessagesSent > 0 ? (totalDelivered / totalMessagesSent) * 100 : 0
    const totalRevenue = campaigns.reduce((sum, campaign) => sum + (campaign.cost || 0), 0)

    // Get platform stats
    const platformStats = [
      {
        platform: "WhatsApp",
        sent: campaigns.filter((c) => c.type === "WhatsApp").reduce((sum, c) => sum + (c.sent || 0), 0),
        delivered: campaigns.filter((c) => c.type === "WhatsApp").reduce((sum, c) => sum + (c.delivered || 0), 0),
        read: campaigns.filter((c) => c.type === "WhatsApp").reduce((sum, c) => sum + (c.opened || 0), 0),
        replied: campaigns.filter((c) => c.type === "WhatsApp").reduce((sum, c) => sum + (c.clicked || 0), 0),
        deliveryRate: 98.2,
        readRate: 80.7,
        cost: campaigns.filter((c) => c.type === "WhatsApp").reduce((sum, c) => sum + (c.cost || 0), 0),
        revenue: campaigns.filter((c) => c.type === "WhatsApp").reduce((sum, c) => sum + (c.cost || 0), 0) * 2.5,
      },
      {
        platform: "Email",
        sent: campaigns.filter((c) => c.type === "Email").reduce((sum, c) => sum + (c.sent || 0), 0),
        delivered: campaigns.filter((c) => c.type === "Email").reduce((sum, c) => sum + (c.delivered || 0), 0),
        opened: campaigns.filter((c) => c.type === "Email").reduce((sum, c) => sum + (c.opened || 0), 0),
        clicked: campaigns.filter((c) => c.type === "Email").reduce((sum, c) => sum + (c.clicked || 0), 0),
        deliveryRate: 98.1,
        openRate: 48.3,
        cost: campaigns.filter((c) => c.type === "Email").reduce((sum, c) => sum + (c.cost || 0), 0),
        revenue: campaigns.filter((c) => c.type === "Email").reduce((sum, c) => sum + (c.cost || 0), 0) * 3.2,
      },
      {
        platform: "Voice",
        sent: campaigns.filter((c) => c.type === "Voice").reduce((sum, c) => sum + (c.sent || 0), 0),
        connected: campaigns.filter((c) => c.type === "Voice").reduce((sum, c) => sum + (c.delivered || 0), 0),
        completed: campaigns.filter((c) => c.type === "Voice").reduce((sum, c) => sum + (c.opened || 0), 0),
        avgDuration: 45,
        connectionRate: 93.6,
        completionRate: 88.9,
        cost: campaigns.filter((c) => c.type === "Voice").reduce((sum, c) => sum + (c.cost || 0), 0),
        revenue: campaigns.filter((c) => c.type === "Voice").reduce((sum, c) => sum + (c.cost || 0), 0) * 1.8,
      },
      {
        platform: "SMS",
        sent: campaigns.filter((c) => c.type === "SMS").reduce((sum, c) => sum + (c.sent || 0), 0),
        delivered: campaigns.filter((c) => c.type === "SMS").reduce((sum, c) => sum + (c.delivered || 0), 0),
        clicked: campaigns.filter((c) => c.type === "SMS").reduce((sum, c) => sum + (c.clicked || 0), 0),
        replied: campaigns.filter((c) => c.type === "SMS").reduce((sum, c) => sum + (c.opened || 0), 0),
        deliveryRate: 97.2,
        clickRate: 10.3,
        cost: campaigns.filter((c) => c.type === "SMS").reduce((sum, c) => sum + (c.cost || 0), 0),
        revenue: campaigns.filter((c) => c.type === "SMS").reduce((sum, c) => sum + (c.cost || 0), 0) * 2.8,
      },
    ]

    // Get campaign performance
    const campaignPerformance = campaigns
      .filter((c) => c.status === "Completed")
      .slice(0, 10)
      .map((campaign) => ({
        id: campaign._id.toString(),
        name: campaign.name,
        platform: campaign.type,
        sent: campaign.sent || 0,
        engagement: campaign.sent > 0 ? ((campaign.opened || 0) / campaign.sent) * 100 : 0,
        revenue: (campaign.cost || 0) * 2.5,
        roi: 3.2,
        status: campaign.status,
      }))

    // Generate time series data
    const timeSeriesData = {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      datasets: [
        {
          label: "Messages Sent",
          data: [
            Math.floor(totalMessagesSent * 0.2),
            Math.floor(totalMessagesSent * 0.3),
            Math.floor(totalMessagesSent * 0.25),
            Math.floor(totalMessagesSent * 0.25),
          ],
        },
        {
          label: "Revenue",
          data: [
            Math.floor(totalRevenue * 0.2),
            Math.floor(totalRevenue * 0.3),
            Math.floor(totalRevenue * 0.25),
            Math.floor(totalRevenue * 0.25),
          ],
        },
      ],
    }

    const analytics = {
      overview: {
        totalMessagesSent,
        activeCampaigns,
        successRate: Math.round(successRate * 10) / 10,
        totalRevenue: Math.round(totalRevenue),
        trends: {
          messagesSent: "+12%",
          campaigns: `+${activeCampaigns}`,
          successRate: "+0.5%",
          revenue: "+18%",
        },
      },
      platformStats,
      campaignPerformance,
      timeSeriesData,
    }

    return NextResponse.json({
      success: true,
      analytics,
      period,
    })
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch analytics",
      },
      { status: 500 },
    )
  }
}
