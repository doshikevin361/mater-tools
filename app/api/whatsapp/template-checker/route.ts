import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

// This endpoint should be called by a cron job or background worker
export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase()

    // WhatsApp Business API Configuration
    const whatsappConfig = {
      accessToken:
        "EAAKl4Tvl9NkBPCHFySyCvs7QSpBxgB5mtn5xV2cSPDIwzn75BIpvyMSsaWeF1Ib3AFzZCDIsyTKbHhDPjdJV0z4gJ4kPSOCGHTMQQQOpNogzOuTx69NNrgFUiusW2A6F7V9frF2ss0EHEUqjhqtMKpfN6yqGloVjCvZBNmS5YqpeAWUr9wgRZBLJZCd1t78H0HQkwMdbKH4hx7dxiKJCXEJArVBC82V187fY",
      baseUrl: "https://graph.facebook.com/v21.0",
    }

    // Get templates that need checking (using efficient query)
    const now = new Date()
    const templatesToCheck = await db
      .collection("template_check_queue")
      .find({
        status: "PENDING",
        nextCheckAt: { $lte: now },
        checkCount: { $lt: 100 }, // Max 100 checks per template
      })
      .limit(10) // Process max 10 templates per run
      .toArray()

    console.log(`Found ${templatesToCheck.length} templates to check`)

    const results = []

    for (const templateCheck of templatesToCheck) {
      try {
        // Check template status with timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        const statusResponse = await fetch(`${whatsappConfig.baseUrl}/${templateCheck.templateId}`, {
          headers: {
            Authorization: `Bearer ${whatsappConfig.accessToken}`,
          },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (statusResponse.ok) {
          const statusResult = await statusResponse.json()
          console.log(`Template ${templateCheck.templateId} status:`, statusResult.status)

          // Calculate next check time with exponential backoff
          const currentInterval = templateCheck.checkInterval || 60000
          const nextInterval = Math.min(currentInterval * 1.5, 1800000) // Max 30 minutes
          const nextCheckAt = new Date(now.getTime() + nextInterval)

          if (statusResult.status === "APPROVED") {
            console.log(`✅ Template ${templateCheck.templateId} approved!`)

            // Update template status
            await db.collection("whatsapp_templates").updateOne(
              { templateId: templateCheck.templateId },
              {
                $set: {
                  status: "APPROVED",
                  approvedAt: new Date(),
                  lastChecked: now,
                },
              },
            )

            // Remove from check queue
            await db.collection("template_check_queue").deleteOne({
              _id: templateCheck._id,
            })

            // Update campaign and trigger message sending
            const campaign = await db.collection("campaigns").findOne({
              _id: templateCheck.campaignId,
            })

            if (campaign) {
              await db.collection("campaigns").updateOne(
                { _id: templateCheck.campaignId },
                {
                  $set: {
                    status: "Template Approved - Starting Send",
                    templateApprovedAt: new Date(),
                  },
                },
              )

              // Trigger message sending (you might want to use a separate queue for this)
              results.push({
                templateId: templateCheck.templateId,
                status: "APPROVED",
                action: "TRIGGER_SEND",
                campaignId: templateCheck.campaignId,
              })
            }
          } else if (statusResult.status === "REJECTED") {
            console.log(`❌ Template ${templateCheck.templateId} rejected`)

            // Update template status
            await db.collection("whatsapp_templates").updateOne(
              { templateId: templateCheck.templateId },
              {
                $set: {
                  status: "REJECTED",
                  rejectedAt: new Date(),
                  lastChecked: now,
                },
              },
            )

            // Remove from check queue
            await db.collection("template_check_queue").deleteOne({
              _id: templateCheck._id,
            })

            // Update campaign status
            await db.collection("campaigns").updateOne(
              { _id: templateCheck.campaignId },
              {
                $set: {
                  status: "Failed - Template Rejected",
                  error: "WhatsApp rejected the template. Please modify your message and try again.",
                  failedAt: new Date(),
                },
              },
            )

            results.push({
              templateId: templateCheck.templateId,
              status: "REJECTED",
              action: "CAMPAIGN_FAILED",
              campaignId: templateCheck.campaignId,
            })
          } else {
            // Still pending - update check info
            await db.collection("template_check_queue").updateOne(
              { _id: templateCheck._id },
              {
                $set: {
                  lastChecked: now,
                  nextCheckAt: nextCheckAt,
                  checkInterval: nextInterval,
                },
                $inc: { checkCount: 1 },
              },
            )

            // Update template last checked time
            await db.collection("whatsapp_templates").updateOne(
              { templateId: templateCheck.templateId },
              {
                $set: {
                  lastChecked: now,
                },
                $inc: { checkCount: 1 },
              },
            )

            results.push({
              templateId: templateCheck.templateId,
              status: statusResult.status,
              action: "CONTINUE_CHECKING",
              nextCheckAt: nextCheckAt,
            })
          }
        } else {
          console.error(`Failed to check template ${templateCheck.templateId}:`, statusResponse.status)

          // Update with error but continue checking
          await db.collection("template_check_queue").updateOne(
            { _id: templateCheck._id },
            {
              $set: {
                lastChecked: now,
                lastError: `HTTP ${statusResponse.status}`,
                nextCheckAt: new Date(now.getTime() + templateCheck.checkInterval),
              },
              $inc: { checkCount: 1 },
            },
          )

          results.push({
            templateId: templateCheck.templateId,
            status: "ERROR",
            error: `HTTP ${statusResponse.status}`,
            action: "RETRY_LATER",
          })
        }
      } catch (error) {
        console.error(`Error checking template ${templateCheck.templateId}:`, error)

        // Update with error
        await db.collection("template_check_queue").updateOne(
          { _id: templateCheck._id },
          {
            $set: {
              lastChecked: now,
              lastError: error.message,
              nextCheckAt: new Date(now.getTime() + templateCheck.checkInterval),
            },
            $inc: { checkCount: 1 },
          },
        )

        results.push({
          templateId: templateCheck.templateId,
          status: "ERROR",
          error: error.message,
          action: "RETRY_LATER",
        })
      }

      // Small delay between checks to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    // Clean up old completed/failed checks (older than 7 days)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    await db.collection("template_check_queue").deleteMany({
      $or: [
        { status: { $in: ["APPROVED", "REJECTED"] } },
        { createdAt: { $lt: weekAgo } },
        { checkCount: { $gte: 100 } },
      ],
    })

    return NextResponse.json({
      success: true,
      message: `Processed ${templatesToCheck.length} template checks`,
      results: results,
      summary: {
        approved: results.filter((r) => r.status === "APPROVED").length,
        rejected: results.filter((r) => r.status === "REJECTED").length,
        pending: results.filter((r) => r.action === "CONTINUE_CHECKING").length,
        errors: results.filter((r) => r.status === "ERROR").length,
      },
    })
  } catch (error) {
    console.error("Template checker error:", error)
    return NextResponse.json(
      { success: false, message: "Template checker failed", error: error.message },
      { status: 500 },
    )
  }
}
