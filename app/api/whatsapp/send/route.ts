import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  const db = await getDatabase()
  let session = null

  try {
    const body = await request.json()
    const { recipients, message, campaignName, userId, mediaUrl, mediaType, selectedTemplateId } = body

    console.log("WhatsApp send request:", {
      recipientsCount: Array.isArray(recipients) ? recipients.length : 1,
      messageLength: message?.length,
      userId,
      hasMedia: !!mediaUrl,
      mediaType,
      selectedTemplateId,
    })

    const actualUserId = userId

    if (!recipients || !message) {
      return NextResponse.json({ success: false, message: "Recipients and message are required" }, { status: 400 })
    }

    // Start database transaction
    session = db.client.startSession()
    await session.startTransaction()

    // Get user and check balance
    const user = await db.collection("users").findOne({ _id: actualUserId }, { session })
    if (!user) {
      await session.abortTransaction()
      console.log("User not found with ID:", actualUserId)
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    console.log("Found user:", user.firstName, user.lastName, "Balance:", user.balance)

    // Get user's actual contacts from database
    const contactIds = Array.isArray(recipients)
      ? recipients.map((id) => {
          try {
            return new ObjectId(id)
          } catch (error) {
            return id
          }
        })
      : [recipients]

    const contactList = await db
      .collection("contacts")
      .find(
        {
          $or: [{ _id: { $in: contactIds } }, { _id: { $in: recipients } }],
          userId: actualUserId,
          status: { $ne: "deleted" },
          phone: { $exists: true, $ne: null, $ne: "" },
        },
        { session },
      )
      .project({ _id: 1, name: 1, phone: 1, mobile: 1 })
      .toArray()

    console.log(`Found ${contactList.length} contacts with phone numbers`)

    if (contactList.length === 0) {
      await session.abortTransaction()
      return NextResponse.json(
        {
          success: false,
          message: "No contacts with valid phone numbers found.",
        },
        { status: 400 },
      )
    }

    const baseCost = contactList.length * 0.5
    const mediaCost = mediaUrl ? contactList.length * 0.2 : 0
    const campaignCost = baseCost + mediaCost

    // Check if user has sufficient balance
    if (user.balance < campaignCost) {
      await session.abortTransaction()
      return NextResponse.json(
        {
          success: false,
          message: `Insufficient balance. Required: ₹${campaignCost.toFixed(2)}, Available: ₹${user.balance.toFixed(2)}`,
        },
        { status: 400 },
      )
    }

    // Get user's approved templates from cache
    let selectedTemplate = null
    const cachedTemplates = await db.collection("whatsapp_templates_cache").find({ userId: actualUserId }).toArray()

    if (selectedTemplateId) {
      // Use specific template selected by user
      selectedTemplate = cachedTemplates.find((t) => t.id === selectedTemplateId || t.name === selectedTemplateId)
    } else {
      // Auto-select template based on message content
      selectedTemplate = selectBestTemplate(cachedTemplates, message)
    }

    if (!selectedTemplate) {
      await session.abortTransaction()
      return NextResponse.json(
        {
          success: false,
          message: "No approved templates found. Please create and approve templates first.",
        },
        { status: 400 },
      )
    }

    console.log("Using template:", selectedTemplate.name)

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

    // Create campaign record
    const campaign = {
      name: campaignName || `WhatsApp Campaign - ${new Date().toLocaleDateString()}`,
      type: "WhatsApp",
      message,
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null,
      recipients: Array.isArray(recipients) ? recipients : [recipients],
      recipientCount: contactList.length,
      status: "Sending Messages",
      sent: 0,
      delivered: 0,
      failed: 0,
      cost: campaignCost,
      createdAt: new Date(),
      startedAt: new Date(),
      userId: actualUserId,
      templateStatus: "APPROVED",
    }

    const campaignResult = await db.collection("campaigns").insertOne(campaign, { session })
    const campaignId = campaignResult.insertedId

    // Commit transaction for campaign creation
    await session.commitTransaction()

    // Send messages immediately using approved template
    setImmediate(async () => {
      const sendResult = await sendMessagesWithRealTemplate(
        contactList,
        selectedTemplate,
        message,
        whatsappConfig,
        db,
        campaignId,
        actualUserId,
        user.balance,
        campaignCost,
        mediaUrl,
        mediaType,
      )
      console.log("Message send result:", sendResult)
    })

    return NextResponse.json({
      success: true,
      message: `WhatsApp messages are being sent using template: ${selectedTemplate.name}`,
      campaign: {
        ...campaign,
        _id: campaignId,
        status: "Sending Messages",
      },
      templateUsed: {
        id: selectedTemplate.id,
        name: selectedTemplate.name,
        category: selectedTemplate.category,
      },
    })
  } catch (error) {
    console.error("WhatsApp send error:", error)

    if (session && session.inTransaction()) {
      await session.abortTransaction()
    }

    return NextResponse.json(
      { success: false, message: "Failed to start WhatsApp campaign", error: error.message },
      { status: 500 },
    )
  } finally {
    if (session) {
      await session.endSession()
    }
  }
}

// Function to select best template based on message content
function selectBestTemplate(templates: any[], message: string) {
  const messageLower = message.toLowerCase()

  // Priority order for template selection
  const templatePriorities = [
    { keywords: ["offer", "discount", "sale", "promo"], category: "MARKETING" },
    { keywords: ["order", "delivery", "shipped", "tracking"], category: "UTILITY" },
    { keywords: ["appointment", "reminder", "meeting", "schedule"], category: "UTILITY" },
    { keywords: ["welcome", "hello", "hi", "greetings"], category: "UTILITY" },
  ]

  // Try to find template by keywords and category
  for (const priority of templatePriorities) {
    const hasKeyword = priority.keywords.some((keyword) => messageLower.includes(keyword))
    if (hasKeyword) {
      const matchingTemplate = templates.find((t) => t.category === priority.category)
      if (matchingTemplate) {
        return matchingTemplate
      }
    }
  }

  // Fallback to first available template
  return templates.find((t) => t.status === "APPROVED") || templates[0]
}

// Function to send messages using real approved templates
async function sendMessagesWithRealTemplate(
  contactList: any[],
  template: any,
  customMessage: string,
  config: any,
  db: any,
  campaignId: ObjectId,
  userId: any,
  userBalance: number,
  campaignCost: number,
  mediaUrl?: string,
  mediaType?: string,
) {
  let session = null

  try {
    session = db.client.startSession()
    await session.startTransaction()

    let totalSent = 0
    let totalFailed = 0
    const results: any[] = []
    const batchSize = 10

    // Process contacts in batches
    for (let i = 0; i < contactList.length; i += batchSize) {
      const batch = contactList.slice(i, i + batchSize)

      for (const contact of batch) {
        try {
          // Format phone number for Indian numbers
          let phoneNumber = contact.phone || contact.mobile

          if (!phoneNumber) {
            totalFailed++
            results.push({
              contactId: contact._id,
              phone: "N/A",
              name: contact.name,
              success: false,
              error: "No phone number available",
              timestamp: new Date(),
            })
            continue
          }

          // Clean and format phone number - automatically add +91 for Indian numbers
          phoneNumber = phoneNumber.toString().replace(/\D/g, "")

          if (phoneNumber.length === 10) {
            phoneNumber = "91" + phoneNumber
          } else if (phoneNumber.length === 11 && phoneNumber.startsWith("0")) {
            phoneNumber = "91" + phoneNumber.substring(1)
          } else if (phoneNumber.length === 12 && phoneNumber.startsWith("91")) {
            // Already formatted
          } else if (!phoneNumber.startsWith("91")) {
            phoneNumber = "91" + phoneNumber
          }

          const messageResult = await sendSingleMessageWithRealTemplate(
            phoneNumber,
            template,
            customMessage,
            contact.name || "Customer",
            config,
            mediaUrl,
            mediaType,
          )

          if (messageResult.success) {
            console.log(`✅ Message sent successfully to +${phoneNumber}`)
            totalSent++
            results.push({
              contactId: contact._id,
              phone: phoneNumber,
              name: contact.name,
              success: true,
              messageId: messageResult.messageId,
              timestamp: new Date(),
              templateUsed: template.name,
            })
          } else {
            console.log(`❌ Failed to send to +${phoneNumber}:`, messageResult.error)
            totalFailed++
            results.push({
              contactId: contact._id,
              phone: phoneNumber,
              name: contact.name,
              success: false,
              error: messageResult.error,
              timestamp: new Date(),
            })
          }
        } catch (contactError) {
          console.error(`Error processing contact ${contact.name}:`, contactError)
          totalFailed++
          results.push({
            contactId: contact._id,
            phone: contact.phone || contact.mobile,
            name: contact.name,
            success: false,
            error: contactError.message,
            timestamp: new Date(),
          })
        }
      }

      // Delay between batches
      if (i + batchSize < contactList.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }

    // Calculate actual cost
    const actualCost = totalSent * 0.5 + (mediaUrl && totalSent > 0 ? totalSent * 0.2 : 0)

    if (actualCost > 0) {
      // Update user balance
      await db.collection("users").updateOne(
        { _id: userId },
        {
          $inc: { balance: -actualCost },
          $set: { updatedAt: new Date() },
        },
        { session },
      )

      // Create transaction record
      await db.collection("transactions").insertOne(
        {
          userId: userId,
          type: "campaign_cost",
          amount: -actualCost,
          description: `WhatsApp campaign: ${totalSent} sent, ${totalFailed} failed using template: ${template.name}`,
          campaignId,
          balanceBefore: userBalance,
          balanceAfter: userBalance - actualCost,
          createdAt: new Date(),
        },
        { session },
      )
    }

    // Update campaign with final results
    await db.collection("campaigns").updateOne(
      { _id: campaignId },
      {
        $set: {
          status: totalFailed === 0 ? "Completed" : totalSent > 0 ? "Partially Completed" : "Failed",
          sent: totalSent,
          failed: totalFailed,
          delivered: totalSent,
          completedAt: new Date(),
          results,
          finalCost: actualCost,
        },
      },
      { session },
    )

    // Commit transaction
    await session.commitTransaction()

    return {
      success: true,
      message: `WhatsApp campaign completed! ${totalSent} messages sent successfully, ${totalFailed} failed.`,
      results: {
        totalContacts: contactList.length,
        sent: totalSent,
        failed: totalFailed,
        cost: actualCost,
        successRate: contactList.length > 0 ? ((totalSent / contactList.length) * 100).toFixed(1) : "0.0",
      },
    }
  } catch (error) {
    console.error("Error in sendMessagesWithRealTemplate:", error)

    if (session && session.inTransaction()) {
      await session.abortTransaction()
    }

    await db.collection("campaigns").updateOne(
      { _id: campaignId },
      {
        $set: {
          status: "Failed",
          error: error.message,
          failedAt: new Date(),
        },
      },
    )

    return {
      success: false,
      error: error.message,
    }
  } finally {
    if (session) {
      await session.endSession()
    }
  }
}

// Helper function to send single message with real template
async function sendSingleMessageWithRealTemplate(
  phoneNumber: string,
  template: any,
  customMessage: string,
  contactName: string,
  config: any,
  mediaUrl?: string,
  mediaType?: string,
  retryCount = 0,
) {
  const maxRetries = 2
  const retryDelay = Math.pow(2, retryCount) * 1000

  try {
    const messagePayload: any = {
      messaging_product: "whatsapp",
      to: phoneNumber,
      type: "template",
      template: {
        name: template.name,
        language: {
          code: template.language || "en_US",
        },
        components: [],
      },
    }

    // Build template components based on actual template structure
    if (template.components) {
      for (const component of template.components) {
        if (component.type === "HEADER" && component.format !== "TEXT") {
          // Media header
          if (mediaUrl) {
            messagePayload.template.components.push({
              type: "header",
              parameters: [
                {
                  type: component.format.toLowerCase(),
                  [component.format.toLowerCase()]: {
                    link: mediaUrl,
                  },
                },
              ],
            })
          }
        } else if (component.type === "BODY") {
          // Body with parameters
          const bodyText = component.text || ""
          const parameterMatches = bodyText.match(/\{\{\d+\}\}/g) || []

          if (parameterMatches.length > 0) {
            const parameters = []

            // Fill parameters based on template requirements
            for (let i = 0; i < parameterMatches.length; i++) {
              if (i === 0) {
                parameters.push({ type: "text", text: contactName })
              } else if (i === 1) {
                parameters.push({ type: "text", text: customMessage })
              } else {
                // Default values for additional parameters
                parameters.push({ type: "text", text: "Value" })
              }
            }

            messagePayload.template.components.push({
              type: "body",
              parameters: parameters,
            })
          }
        }
      }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(`${config.baseUrl}/${config.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messagePayload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const result = await response.json()

    if (response.ok && result.messages) {
      return {
        success: true,
        messageId: result.messages[0].id,
        response: result,
      }
    } else if (response.status === 429 && retryCount < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
      return sendSingleMessageWithRealTemplate(
        phoneNumber,
        template,
        customMessage,
        contactName,
        config,
        mediaUrl,
        mediaType,
        retryCount + 1,
      )
    } else {
      return {
        success: false,
        error: result.error?.message || "Failed to send message",
      }
    }
  } catch (error) {
    if (error.name === "AbortError") {
      return {
        success: false,
        error: "Message send timeout",
      }
    }

    if (retryCount < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
      return sendSingleMessageWithRealTemplate(
        phoneNumber,
        template,
        customMessage,
        contactName,
        config,
        mediaUrl,
        mediaType,
        retryCount + 1,
      )
    }

    return {
      success: false,
      error: error.message || "Network error",
    }
  }
}
