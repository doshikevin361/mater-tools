import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    try {
      const db = await getDatabase()

      // Get user's campaigns
      const campaigns = await db.collection("campaigns").find({ userId }).toArray()

      // Get user's contacts
      const contacts = await db.collection("contacts").find({ userId }).toArray()

      // Calculate stats from user's actual data
      const totalCampaigns = campaigns.length
      const totalContacts = contacts.length

      // Calculate campaign stats
      const completedCampaigns = campaigns.filter((c) => c.status === "Completed").length
      const activeCampaigns = campaigns.filter((c) => c.status === "Processing" || c.status === "Sending").length

      // Calculate message stats
      const totalSent = campaigns.reduce((sum, c) => sum + (c.sent || 0), 0)
      const totalDelivered = campaigns.reduce((sum, c) => sum + (c.delivered || 0), 0)
      const totalOpened = campaigns.reduce((sum, c) => sum + (c.opened || 0), 0)
      const totalClicked = campaigns.reduce((sum, c) => sum + (c.clicked || 0), 0)

      // Calculate rates
      const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0
      const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0
      const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0

      // Calculate total cost
      const totalCost = campaigns.reduce((sum, c) => sum + (c.cost || 0), 0)

      // Get recent campaigns (last 5)
      const recentCampaigns = campaigns
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map((campaign) => ({
          id: campaign._id.toString(),
          name: campaign.name,
          type: campaign.type,
          status: campaign.status,
          recipients: campaign.recipientCount || 0,
          sent: campaign.sent || 0,
          delivered: campaign.delivered || 0,
          cost: campaign.cost || 0,
          createdAt: campaign.createdAt,
        }))

      // Platform breakdown
      const platformStats = {
        WhatsApp: campaigns.filter((c) => c.type === "WhatsApp").length,
        Email: campaigns.filter((c) => c.type === "Email").length,
        SMS: campaigns.filter((c) => c.type === "SMS").length,
        Voice: campaigns.filter((c) => c.type === "Voice").length,
      }

      return NextResponse.json({
        success: true,
        stats: {
          totalCampaigns,
          totalContacts,
          completedCampaigns,
          activeCampaigns,
          totalSent,
          totalDelivered,
          totalOpened,
          totalClicked,
          deliveryRate: Math.round(deliveryRate * 100) / 100,
          openRate: Math.round(openRate * 100) / 100,
          clickRate: Math.round(clickRate * 100) / 100,
          totalCost: Math.round(totalCost * 100) / 100,
          platformStats,
          recentCampaigns,
        },
      })
    } catch (dbError) {
      console.error("Database error:", dbError)

      // Return empty stats for new users or database issues
      return NextResponse.json({
        success: true,
        stats: {
          totalCampaigns: 0,
          totalContacts: 0,
          completedCampaigns: 0,
          activeCampaigns: 0,
          totalSent: 0,
          totalDelivered: 0,
          totalOpened: 0,
          totalClicked: 0,
          deliveryRate: 0,
          openRate: 0,
          clickRate: 0,
          totalCost: 0,
          platformStats: {
            WhatsApp: 0,
            Email: 0,
            SMS: 0,
            Voice: 0,
          },
          recentCampaigns: [],
        },
      })
    }
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}
