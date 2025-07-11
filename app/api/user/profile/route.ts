import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // In production, get user from JWT token
    const user = {
      id: "1",
      firstName: "Demo",
      lastName: "User",
      email: "demo@brandbuzzventures.com",
      phone: "+91 9876543210",
      company: "BrandBuzz Ventures",
      businessType: "services",
      plan: "Professional",
      balance: 12450,
      avatar: "/placeholder.svg?height=32&width=32",
      settings: {
        notifications: {
          email: true,
          sms: false,
          push: true,
        },
        timezone: "Asia/Kolkata",
        language: "en",
      },
      subscription: {
        plan: "Professional",
        status: "active",
        nextBilling: "2024-02-15",
        features: ["Unlimited WhatsApp messages", "Advanced analytics", "Priority support", "Custom templates"],
      },
      usage: {
        messagesThisMonth: 11266,
        messagesLimit: 50000,
        campaignsThisMonth: 23,
        campaignsLimit: 100,
      },
    }

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error) {
    console.error("Profile error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch profile",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updates = await request.json()

    // In production, validate and update user in database
    const updatedUser = {
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update profile",
      },
      { status: 500 },
    )
  }
}
