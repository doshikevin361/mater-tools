import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, forceRefresh = false } = body

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedTemplates = await db
        .collection("whatsapp_templates_cache")
        .find({ userId: userId })
        .sort({ lastUpdated: -1 })
        .toArray()

      // If cache is less than 1 hour old, return cached data
      const oneHourAgo = new Date(Date.now() - 3600000)
      if (cachedTemplates.length > 0 && cachedTemplates[0].lastUpdated > oneHourAgo) {
        return NextResponse.json({
          success: true,
          templates: cachedTemplates,
          source: "cache",
          message: `Loaded ${cachedTemplates.length} templates from cache`,
        })
      }
    }

    // WhatsApp Business API Configuration
    const whatsappConfig = {
      accessToken:
        "EAAKl4Tvl9NkBPCHFySyCvs7QSpBxgB5mtn5xV2cSPDIwzn75BIpvyMSsaWeF1Ib3AFzZCDIsyTKbHhDPjdJV0z4gJ4kPSOCGHTMQQQOpNogzOuTx69NNrgFUiusW2A6F7V9frF2ss0EHEUqjhqtMKpfN6yqGloVjCvZBNmS5YqpeAWUr9wgRZBLJZCd1t78H0HQkwMdbKH4hx7dxiKJCXEJArVBC82V187fY",
      wabaId: "981328203955307",
      baseUrl: "https://graph.facebook.com/v21.0",
    }

    // Fetch templates from WhatsApp Business API
    const response = await fetch(`${whatsappConfig.baseUrl}/${whatsappConfig.wabaId}/message_templates`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${whatsappConfig.accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    console.log("WhatsApp API response:", result)

    if (!result.data) {
      return NextResponse.json({
        success: false,
        message: "No templates data received from WhatsApp API",
      })
    }

    // Process and format templates
    const processedTemplates = result.data
      .filter((template: any) => template.status === "APPROVED")
      .map((template: any) => {
        // Extract template content and parameters
        let bodyText = ""
        let headerText = ""
        let footerText = ""
        let parametersCount = 0
        let hasMedia = false
        let mediaType = null

        if (template.components) {
          for (const component of template.components) {
            if (component.type === "HEADER") {
              if (component.format === "TEXT") {
                headerText = component.text || ""
              } else {
                hasMedia = true
                mediaType = component.format?.toLowerCase()
              }
            } else if (component.type === "BODY") {
              bodyText = component.text || ""
              // Count parameters in body text
              const paramMatches = bodyText.match(/\{\{\d+\}\}/g)
              parametersCount = paramMatches ? paramMatches.length : 0
            } else if (component.type === "FOOTER") {
              footerText = component.text || ""
            }
          }
        }

        // Create readable template content
        let templateContent = ""
        if (headerText) templateContent += headerText + "\n\n"
        if (bodyText) templateContent += bodyText
        if (footerText) templateContent += "\n\n" + footerText

        return {
          id: template.id,
          name: template.name,
          category: template.category,
          language: template.language,
          status: template.status,
          components: template.components,
          content: templateContent,
          bodyText: bodyText,
          headerText: headerText,
          footerText: footerText,
          parametersCount: parametersCount,
          hasMedia: hasMedia,
          mediaType: mediaType,
          userId: userId,
          lastUpdated: new Date(),
        }
      })

    console.log(`Processed ${processedTemplates.length} approved templates`)

    // Clear old cache and save new templates
    await db.collection("whatsapp_templates_cache").deleteMany({ userId: userId })

    if (processedTemplates.length > 0) {
      await db.collection("whatsapp_templates_cache").insertMany(processedTemplates)
    }

    return NextResponse.json({
      success: true,
      templates: processedTemplates,
      source: "api",
      message: `Fetched ${processedTemplates.length} approved templates from WhatsApp`,
    })
  } catch (error) {
    console.error("Error fetching WhatsApp templates:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch templates: " + error.message,
      },
      { status: 500 },
    )
  }
}
