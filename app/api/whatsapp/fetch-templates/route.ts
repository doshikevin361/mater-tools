import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    // WhatsApp Business API Configuration
    const whatsappConfig = {
      appId: "745336744572121",
      appSecret: "a708e1afd97406d6c5e0a92fae2cc1a9",
      accessToken:
        "EAAKl4Tvl9NkBPCHFySyCvs7QSpBxgB5mtn5xV2cSPDIwzn75BIpvyMSsaWeF1Ib3AFzZCDIsyTKbHhDPjdJV0z4gJ4kPSOCGHTMQQQOpNogzOuTx69NNrgFUiusW2A6F7V9frF2ss0EHEUqjhqtMKpfN6yqGloVjCvZBNmS5YqpeAWUr9wgRZBLJZCd1t78H0HQkwMdbKH4hx7dxiKJCXEJArVBC82V187fY",
      wabaId: "981328203955307",
      phoneNumberId: "642124598993683",
      baseUrl: "https://graph.facebook.com/v21.0",
    }

    console.log("Fetching templates from WhatsApp Business API...")

    // Fetch templates from WhatsApp Business API
    const response = await fetch(`${whatsappConfig.baseUrl}/${whatsappConfig.wabaId}/message_templates?limit=100`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${whatsappConfig.accessToken}`,
        "Content-Type": "application/json",
      },
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("Failed to fetch templates:", result)
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch templates from WhatsApp",
          error: result.error?.message || "Unknown error",
        },
        { status: 500 },
      )
    }

    console.log(`Found ${result.data?.length || 0} templates`)

    // Filter only approved templates
    const approvedTemplates = result.data?.filter((template: any) => template.status === "APPROVED") || []

    console.log(`Found ${approvedTemplates.length} approved templates`)

    // Store templates in database for caching
    const db = await getDatabase()

    // Clear existing cached templates for this user
    await db.collection("whatsapp_templates_cache").deleteMany({ userId })

    // Cache the fetched templates
    if (approvedTemplates.length > 0) {
      const templatesWithUserId = approvedTemplates.map((template: any) => ({
        ...template,
        userId,
        cachedAt: new Date(),
        lastUpdated: new Date(),
      }))

      await db.collection("whatsapp_templates_cache").insertMany(templatesWithUserId)
    }

    // Format templates for frontend use
    const formattedTemplates = approvedTemplates.map((template: any) => ({
      id: template.id,
      name: template.name,
      status: template.status,
      category: template.category,
      language: template.language,
      components: template.components,
      hasMedia: template.components?.some((comp: any) => comp.type === "HEADER" && comp.format !== "TEXT"),
      mediaType: template.components
        ?.find((comp: any) => comp.type === "HEADER" && comp.format !== "TEXT")
        ?.format?.toLowerCase(),
      bodyText: template.components?.find((comp: any) => comp.type === "BODY")?.text || "",
      headerText:
        template.components?.find((comp: any) => comp.type === "HEADER" && comp.format === "TEXT")?.text || "",
      footerText: template.components?.find((comp: any) => comp.type === "FOOTER")?.text || "",
      parametersCount: (
        template.components?.find((comp: any) => comp.type === "BODY")?.text?.match(/\{\{\d+\}\}/g) || []
      ).length,
    }))

    return NextResponse.json({
      success: true,
      message: `Found ${approvedTemplates.length} approved templates`,
      templates: formattedTemplates,
      totalCount: result.data?.length || 0,
      approvedCount: approvedTemplates.length,
    })
  } catch (error) {
    console.error("Error fetching WhatsApp templates:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch templates",
        error: error.message,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, forceRefresh } = body

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Check if we have cached templates and they're not too old (unless force refresh)
    if (!forceRefresh) {
      const cachedTemplates = await db
        .collection("whatsapp_templates_cache")
        .find({
          userId,
          cachedAt: { $gte: new Date(Date.now() - 3600000) }, // 1 hour cache
        })
        .toArray()

      if (cachedTemplates.length > 0) {
        console.log(`Using ${cachedTemplates.length} cached templates`)

        const formattedTemplates = cachedTemplates.map((template: any) => ({
          id: template.id,
          name: template.name,
          status: template.status,
          category: template.category,
          language: template.language,
          components: template.components,
          hasMedia: template.components?.some((comp: any) => comp.type === "HEADER" && comp.format !== "TEXT"),
          mediaType: template.components
            ?.find((comp: any) => comp.type === "HEADER" && comp.format !== "TEXT")
            ?.format?.toLowerCase(),
          bodyText: template.components?.find((comp: any) => comp.type === "BODY")?.text || "",
          headerText:
            template.components?.find((comp: any) => comp.type === "HEADER" && comp.format === "TEXT")?.text || "",
          footerText: template.components?.find((comp: any) => comp.type === "FOOTER")?.text || "",
          parametersCount: (
            template.components?.find((comp: any) => comp.type === "BODY")?.text?.match(/\{\{\d+\}\}/g) || []
          ).length,
        }))

        return NextResponse.json({
          success: true,
          message: `Using ${cachedTemplates.length} cached templates`,
          templates: formattedTemplates,
          cached: true,
        })
      }
    }

    // Fetch fresh templates from API
    const fetchUrl = new URL("/api/whatsapp/fetch-templates", request.url)
    fetchUrl.searchParams.set("userId", userId)

    const fetchResponse = await fetch(fetchUrl.toString(), {
      method: "GET",
    })

    const fetchResult = await fetchResponse.json()
    return NextResponse.json(fetchResult)
  } catch (error) {
    console.error("Error in template fetch POST:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch templates",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
