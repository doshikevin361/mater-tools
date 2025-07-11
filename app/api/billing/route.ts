import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || "demo-user"

    const db = await getDatabase()

    const user = await db.collection("users").findOne({ _id: userId })

    const transactions = await db
      .collection("transactions")
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    const monthlyStats = await db
      .collection("campaigns")
      .aggregate([
        {
          $match: {
            userId,
            createdAt: { $gte: currentMonth },
          },
        },
        {
          $group: {
            _id: "$type",
            totalCost: { $sum: "$cost" },
            totalMessages: { $sum: "$sent" },
            campaignCount: { $sum: 1 },
          },
        },
      ])
      .toArray()

    const totalStats = await db
      .collection("transactions")
      .aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: "$type",
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray()

    const credits = totalStats.find((s) => s._id === "credit")?.totalAmount || 0
    const debits = totalStats.find((s) => s._id === "debit")?.totalAmount || 0

    const usage = {
      thisMonth: {
        whatsapp: { messages: 0, cost: 0 },
        email: { messages: 0, cost: 0 },
        voice: { calls: 0, cost: 0 },
        sms: { messages: 0, cost: 0 },
      },
    }

    monthlyStats.forEach((stat) => {
      const type = stat._id.toLowerCase()
      if (usage.thisMonth[type]) {
        usage.thisMonth[type].messages = stat.totalMessages
        usage.thisMonth[type].cost = stat.totalCost
      }
    })

    const billingData = {
      currentBalance: user?.balance || 0,
      totalAdded: credits,
      totalSpent: debits,
      currency: "INR",
      transactions: transactions.map((t) => ({
        id: t._id.toString(),
        type: t.type,
        amount: t.amount,
        description: t.description,
        date: t.createdAt,
        status: t.status || "completed",
        campaignId: t.campaignId,
        balanceBefore: t.balanceBefore,
        balanceAfter: t.balanceAfter,
      })),
      usage,
      subscription: {
        plan: user?.plan || "Free",
        price: user?.plan === "Professional" ? 2999 : 0,
        billingCycle: "monthly",
        nextBilling: "2024-02-15",
        features: ["Unlimited WhatsApp messages", "Advanced analytics", "Priority support", "Custom templates"],
      },
    }

    return NextResponse.json({
      success: true,
      billing: billingData,
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to fetch billing data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, paymentMethod, userId = "demo-user" } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, message: "Invalid amount" }, { status: 400 })
    }

    const db = await getDatabase()

    const user = await db.collection("users").findOne({ _id: userId })
    const currentBalance = user?.balance || 0

    const transaction = {
      userId,
      type: "credit",
      amount: Number.parseFloat(amount),
      description: `Account top-up via ${paymentMethod}`,
      paymentMethod,
      status: "completed",
      balanceBefore: currentBalance,
      balanceAfter: currentBalance + Number.parseFloat(amount),
      createdAt: new Date(),
    }

    await db.collection("transactions").insertOne(transaction)

    const newBalance = currentBalance + Number.parseFloat(amount)
    await db.collection("users").updateOne(
      { _id: userId },
      {
        $set: { balance: newBalance, updatedAt: new Date() },
      },
      { upsert: true },
    )

    return NextResponse.json({
      success: true,
      message: "Payment processed successfully",
      transaction: {
        ...transaction,
        id: transaction._id?.toString(),
      },
      newBalance: newBalance,
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Payment failed" }, { status: 500 })
  }
}
