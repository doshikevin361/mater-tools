import { type NextRequest, NextResponse } from "next/server"
import { getSMMClient } from "@/lib/smm-api-client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const platform = searchParams.get("platform")

    const smmClient = getSMMClient()

    let services
    if (platform) {
      services = await smmClient.getServicesByCategory(platform)
    } else {
      services = await smmClient.getServices()
    }

    return NextResponse.json({
      success: true,
      services,
      count: services.length,
    })
  } catch (error) {
    console.error("Error fetching SMM services:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch services",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
