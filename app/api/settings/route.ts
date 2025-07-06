import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || "demo-user"

    const db = await getDatabase()

    // Get user settings
    const userSettings = await db.collection("user_settings").findOne({ userId })

    // Default settings if none exist
    const defaultSettings = {
      userId,
      profile: {
        name: "Demo User",
        email: "demo@brandbuzzventures.com",
        phone: "+91 9876543210",
        company: "BrandBuzz Ventures",
        timezone: "Asia/Kolkata",
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        campaignUpdates: true,
        billingAlerts: true,
        weeklyReports: true,
      },
      api: {
        fast2smsApiKey: "ewcKXG9VBi0rNy74hfz1x5TopWguvPAYR8MS26jdICOmlaFQsL1dnI7bgoCEOqLYHj5eGBJZalW0fxz3",
        msg91ApiKey: "",
        emailProvider: "smtp",
        smtpSettings: {
          host: "smtp.gmail.com",
          port: 587,
          username: "",
          password: "",
        },
      },
      preferences: {
        defaultSenderId: "BRNDBZ",
        autoSchedule: false,
        confirmBeforeSend: true,
        saveTemplates: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const settings = userSettings || defaultSettings

    return NextResponse.json({
      success: true,
      settings,
    })
  } catch (error) {
    console.error("Settings GET error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch settings", error: error.message },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId = "demo-user", settings } = body

    if (!settings) {
      return NextResponse.json({ success: false, message: "Settings data is required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Update or create user settings
    const updatedSettings = {
      ...settings,
      userId,
      updatedAt: new Date(),
    }

    await db.collection("user_settings").updateOne(
      { userId },
      {
        $set: updatedSettings,
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    )

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      settings: updatedSettings,
    })
  } catch (error) {
    console.error("Settings POST error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to update settings", error: error.message },
      { status: 500 },
    )
  }
}
