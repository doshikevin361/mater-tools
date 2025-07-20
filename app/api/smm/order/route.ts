import { type NextRequest, NextResponse } from "next/server"
import { getSMMClient, calculateServiceCost } from "@/lib/smm-api-client"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, platform, serviceType, targetUrl, quantity, campaignName } = body

    if (!userId || !platform || !serviceType || !targetUrl || !quantity) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    const smmClient = getSMMClient()

    // Find appropriate service
    const service = await smmClient.findService(platform, serviceType)
    if (!service) {
      return NextResponse.json(
        { success: false, message: `Service not found for ${platform} ${serviceType}` },
        { status: 404 },
      )
    }

    // Check quantity limits
    const minQuantity = Number.parseInt(service.min)
    const maxQuantity = Number.parseInt(service.max)

    if (quantity < minQuantity || quantity > maxQuantity) {
      return NextResponse.json(
        {
          success: false,
          message: `Quantity must be between ${minQuantity} and ${maxQuantity}`,
        },
        { status: 400 },
      )
    }

    // Calculate cost
    const cost = calculateServiceCost(service, quantity)

    // Connect to database
    const { db } = await connectToDatabase()

    // Check user balance
    const user = await db.collection("users").findOne({ _id: userId })
    if (!user || user.balance < cost) {
      return NextResponse.json({ success: false, message: "Insufficient balance" }, { status: 400 })
    }

    // Place order with SMM API
    const smmOrder = await smmClient.createOrder({
      service: service.service,
      link: targetUrl,
      quantity: quantity,
    })

    if (!smmOrder.order) {
      return NextResponse.json({ success: false, message: "Failed to create order with SMM service" }, { status: 500 })
    }

    // Create campaign in database
    const campaign = {
      name: campaignName || `${platform} ${serviceType} Campaign`,
      platform: platform,
      type: serviceType,
      targetUrl: targetUrl,
      targetCount: quantity,
      currentCount: Number.parseInt(smmOrder.start_count) || 0,
      status: "active",
      cost: cost,
      smmOrderId: smmOrder.order,
      smmService: service,
      userId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("campaigns").insertOne(campaign)

    // Deduct balance from user
    await db.collection("users").updateOne(
      { _id: userId },
      {
        $inc: { balance: -cost },
        $set: { updatedAt: new Date() },
      },
    )

    // Create transaction record
    await db.collection("transactions").insertOne({
      userId: userId,
      type: "debit",
      amount: cost,
      description: `${platform} ${serviceType} campaign - ${quantity} ${serviceType}`,
      campaignId: result.insertedId.toString(),
      status: "completed",
      createdAt: new Date(),
      balanceBefore: user.balance,
      balanceAfter: user.balance - cost,
    })

    return NextResponse.json({
      success: true,
      campaign: {
        ...campaign,
        id: result.insertedId.toString(),
      },
      smmOrder: smmOrder,
      message: "Campaign created successfully",
    })
  } catch (error) {
    console.error("Error creating SMM order:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create campaign",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
