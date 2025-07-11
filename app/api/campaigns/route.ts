import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const type = searchParams.get("type")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Build query - ALWAYS filter by userId
    const query: any = { userId }
    if (type) {
      query.type = type
    }

    console.log("Campaigns GET query:", query)

    // Get total count
    const total = await db.collection("campaigns").countDocuments(query)

    // Get campaigns with pagination, sorted by most recent first
    const campaigns = await db
      .collection("campaigns")
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()

    console.log(`Found ${campaigns.length} campaigns for user ${userId}`)

    // Calculate pagination
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      campaigns: campaigns.map((campaign) => ({
        ...campaign,
        _id: campaign._id.toString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error("Campaigns GET error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch campaigns", error: error.message },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, type, description, subject, content } = body

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    if (!name || !type) {
      return NextResponse.json({ success: false, message: "Campaign name and type are required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Create new campaign - ALWAYS include userId
    const campaign = {
      userId,
      name: name.trim(),
      type,
      description: description?.trim() || "",
      subject: subject?.trim() || "",
      content: content?.trim() || "",
      status: "Draft",
      recipients: [],
      recipientCount: 0,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      failed: 0,
      cost: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("campaigns").insertOne(campaign)

    return NextResponse.json({
      success: true,
      message: "Campaign created successfully",
      campaign: {
        ...campaign,
        _id: result.insertedId.toString(),
      },
    })
  } catch (error) {
    console.error("Campaigns POST error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to create campaign", error: error.message },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignId, userId, ...updates } = body

    if (!campaignId || !userId) {
      return NextResponse.json({ success: false, message: "Campaign ID and User ID are required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Check if campaign exists and belongs to user
    const campaign = await db.collection("campaigns").findOne({
      _id: new ObjectId(campaignId),
      userId,
    })

    if (!campaign) {
      return NextResponse.json({ success: false, message: "Campaign not found" }, { status: 404 })
    }

    // Update campaign
    const result = await db.collection("campaigns").updateOne(
      { _id: new ObjectId(campaignId), userId },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ success: false, message: "No changes made to campaign" }, { status: 400 })
    }

    // Get updated campaign
    const updatedCampaign = await db.collection("campaigns").findOne({
      _id: new ObjectId(campaignId),
    })

    return NextResponse.json({
      success: true,
      message: "Campaign updated successfully",
      campaign: {
        ...updatedCampaign,
        _id: updatedCampaign._id.toString(),
      },
    })
  } catch (error) {
    console.error("Campaigns PUT error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to update campaign", error: error.message },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get("id")
    const userId = searchParams.get("userId")

    if (!campaignId || !userId) {
      return NextResponse.json({ success: false, message: "Campaign ID and User ID are required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Check if campaign exists and belongs to user
    const campaign = await db.collection("campaigns").findOne({
      _id: new ObjectId(campaignId),
      userId,
    })

    if (!campaign) {
      return NextResponse.json({ success: false, message: "Campaign not found" }, { status: 404 })
    }

    // Delete the campaign
    await db.collection("campaigns").deleteOne({
      _id: new ObjectId(campaignId),
      userId,
    })

    return NextResponse.json({
      success: true,
      message: "Campaign deleted successfully",
    })
  } catch (error) {
    console.error("Campaigns DELETE error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to delete campaign", error: error.message },
      { status: 500 },
    )
  }
}
