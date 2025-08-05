import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Rate limiting configuration
const RATE_LIMITS = {
  TEMPLATE_CREATION: 10, // per hour
  MESSAGE_SENDING: 1000, // per hour
  STATUS_CHECKS: 100, // per hour
}

// Polling configuration with exponential backoff
const POLLING_CONFIG = {
  INITIAL_INTERVAL: 60000, // 1 minute
  MAX_INTERVAL: 1800000, // 30 minutes
  MAX_DURATION: 86400000, // 24 hours
  BACKOFF_MULTIPLIER: 1.5,
}

export async function POST(request: NextRequest) {
  const db = await getDatabase()
  let session = null

  try {
    const body = await request.json()
    const { recipients, message, campaignName, userId, mediaUrl, mediaType } = body

    console.log("WhatsApp send request:", {
      recipientsCount: Array.isArray(recipients) ? recipients.length : 1,
      messageLength: message?.length,
      userId,
      hasMedia: !!mediaUrl,
      mediaType,
    })

    const actualUserId = userId

    if (!recipients || !message) {
      return NextResponse.json({ success: false, message: "Recipients and message are required" }, { status: 400 })
    }

    // Start database transaction
    session = db.client.startSession()
    await session.startTransaction()

    // Check rate limits
    const rateLimitCheck = await checkRateLimit(db, actualUserId, "TEMPLATE_CREATION", session)
    if (!rateLimitCheck.allowed) {
      await session.abortTransaction()
      return NextResponse.json(
        {
          success: false,
          message: `Rate limit exceeded. Try again in ${Math.ceil(rateLimitCheck.resetIn / 60000)} minutes.`,
        },
        { status: 429 },
      )
    }

    // Get user and check balance
    const user = await db.collection("users").findOne({ _id: actualUserId }, { session })
    if (!user) {
      await session.abortTransaction()
      console.log("User not found with ID:", actualUserId)
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    console.log("Found user:", user.firstName, user.lastName, "Balance:", user.balance)

    // Get user's actual contacts from database with optimized query
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
      .project({ _id: 1, name: 1, phone: 1, mobile: 1 }) // Only fetch needed fields
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

    // Generate message hash for template identification
    const messageHash = Buffer.from(message + (mediaUrl || ""))
      .toString("base64")
      .substring(0, 20)
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase()
    const templateName = `dynamic_msg_${messageHash}_${Date.now().toString().substring(-6)}`

    // Check if template already exists for this message (optimized query)
    const existingTemplate = await db.collection("whatsapp_templates").findOne(
      {
        messageHash: messageHash,
        userId: actualUserId,
        status: "APPROVED",
      },
      {
        session,
        projection: { templateName: 1, status: 1, _id: 1 },
      },
    )

    // Create campaign record
    const campaign = {
      name: campaignName || `WhatsApp Campaign - ${new Date().toLocaleDateString()}`,
      type: "WhatsApp",
      message,
      messageHash,
      templateName: existingTemplate?.templateName || templateName,
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null,
      recipients: Array.isArray(recipients) ? recipients : [recipients],
      recipientCount: contactList.length,
      status: existingTemplate ? "Ready to Send" : "Creating Template",
      sent: 0,
      delivered: 0,
      failed: 0,
      cost: campaignCost,
      createdAt: new Date(),
      userId: actualUserId,
      templateStatus: existingTemplate?.status || "PENDING",
    }

    const campaignResult = await db.collection("campaigns").insertOne(campaign, { session })
    const campaignId = campaignResult.insertedId

    // Update rate limit counter
    await updateRateLimit(db, actualUserId, "TEMPLATE_CREATION", session)

    // Commit transaction for campaign creation
    await session.commitTransaction()

    // If template exists and is approved, send immediately
    if (existingTemplate) {
      console.log("Using existing approved template:", existingTemplate.templateName)

      // Start sending messages immediately (in background)
      setImmediate(async () => {
        const sendResult = await sendMessagesWithTemplate(
          contactList,
          existingTemplate.templateName,
          whatsappConfig,
          db,
          campaignId,
          actualUserId,
          user.balance,
          baseCost,
          mediaCost,
          mediaUrl,
          mediaType,
        )
        console.log("Background send result:", sendResult)
      })

      return NextResponse.json({
        success: true,
        message: "Using existing approved template. Messages are being sent.",
        campaign: {
          ...campaign,
          _id: campaignId,
          status: "Sending Messages",
        },
      })
    }

    // Template doesn't exist - create new one
    console.log("Creating new template for message:", message)

    try {
      const templateResult = await createWhatsAppTemplate(templateName, message, mediaUrl, mediaType, whatsappConfig)

      if (!templateResult.success) {
        // Rollback campaign status
        await db.collection("campaigns").updateOne(
          { _id: campaignId },
          {
            $set: {
              status: "Failed",
              error: `Template creation failed: ${templateResult.error}`,
              failedAt: new Date(),
            },
          },
        )

        return NextResponse.json({
          success: false,
          message: "Failed to create WhatsApp template: " + templateResult.error,
        })
      }

      // Save template to database for tracking
      await db.collection("whatsapp_templates").insertOne({
        templateId: templateResult.templateId,
        templateName: templateName,
        messageHash: messageHash,
        message: message,
        mediaUrl: mediaUrl,
        mediaType: mediaType,
        status: "PENDING",
        userId: actualUserId,
        campaignId: campaignId,
        createdAt: new Date(),
        submittedAt: new Date(),
        nextCheckAt: new Date(Date.now() + POLLING_CONFIG.INITIAL_INTERVAL),
        checkInterval: POLLING_CONFIG.INITIAL_INTERVAL,
        checkCount: 0,
      })

      // Update campaign status
      await db.collection("campaigns").updateOne(
        { _id: campaignId },
        {
          $set: {
            status: "Template Submitted - Awaiting Approval",
            templateId: templateResult.templateId,
            templateSubmittedAt: new Date(),
          },
        },
      )

      // Schedule background approval checking (using database-driven approach)
      await scheduleTemplateCheck(db, templateResult.templateId, templateName, campaignId)

      return NextResponse.json({
        success: true,
        message: "Template created and submitted for approval. Messages will be sent automatically once approved.",
        campaign: {
          ...campaign,
          _id: campaignId,
          status: "Template Submitted - Awaiting Approval",
          templateId: templateResult.templateId,
        },
        templateInfo: {
          templateId: templateResult.templateId,
          templateName: templateName,
          status: "PENDING",
          message: "Template has been submitted to WhatsApp for approval. This usually takes 1-24 hours.",
          estimatedApprovalTime: "1-24 hours",
        },
      })
    } catch (error) {
      console.error("Template creation error:", error)

      // Rollback campaign
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

      return NextResponse.json(
        {
          success: false,
          message: "Failed to create template: " + error.message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("WhatsApp send error:", error)

    // Rollback transaction if it exists
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

// Rate limiting functions
async function checkRateLimit(db: any, userId: string, action: string, session: any) {
  const now = new Date()
  const hourAgo = new Date(now.getTime() - 3600000) // 1 hour ago

  const rateLimit = await db.collection("rate_limits").findOne(
    {
      userId: userId,
      action: action,
      createdAt: { $gte: hourAgo },
    },
    { session },
  )

  const currentCount = rateLimit?.count || 0
  const limit = RATE_LIMITS[action as keyof typeof RATE_LIMITS] || 100

  return {
    allowed: currentCount < limit,
    current: currentCount,
    limit: limit,
    resetIn: rateLimit ? 3600000 - (now.getTime() - rateLimit.createdAt.getTime()) : 0,
  }
}

async function updateRateLimit(db: any, userId: string, action: string, session: any) {
  const now = new Date()
  const hourAgo = new Date(now.getTime() - 3600000)

  await db.collection("rate_limits").updateOne(
    {
      userId: userId,
      action: action,
      createdAt: { $gte: hourAgo },
    },
    {
      $inc: { count: 1 },
      $setOnInsert: {
        userId: userId,
        action: action,
        createdAt: now,
      },
    },
    {
      upsert: true,
      session,
    },
  )
}

// Function to create WhatsApp template with retry logic
async function createWhatsAppTemplate(
  templateName: string,
  message: string,
  mediaUrl?: string,
  mediaType?: string,
  config: any,
  retryCount = 0,
) {
  const maxRetries = 3
  const retryDelay = Math.pow(2, retryCount) * 1000 // Exponential backoff

  try {
    const components = []

    // Add header component if media is present
    if (mediaUrl) {
      const headerFormat = mediaType?.toUpperCase() === "VIDEO" ? "VIDEO" : "IMAGE"
      components.push({
        type: "HEADER",
        format: headerFormat,
        example: {
          header_handle: [mediaUrl],
        },
      })
    }

    // Add body component with personalization
    components.push({
      type: "BODY",
      text: `Hello {{1}}, ${message}`,
      example: {
        body_text: [["Customer"]],
      },
    })

    const templatePayload = {
      name: templateName,
      language: "en_US",
      category: "MARKETING",
      components: components,
    }

    console.log("Creating template with payload:", JSON.stringify(templatePayload, null, 2))

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const response = await fetch(`${config.baseUrl}/${config.wabaId}/message_templates`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(templatePayload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const result = await response.json()
    console.log("Template creation response:", result)

    if (response.ok && result.id) {
      return {
        success: true,
        templateId: result.id,
        templateName: templateName,
        status: result.status || "PENDING",
      }
    } else if (response.status === 429 && retryCount < maxRetries) {
      // Rate limited - retry with exponential backoff
      console.log(`Rate limited, retrying in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`)
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
      return createWhatsAppTemplate(templateName, message, mediaUrl, mediaType, config, retryCount + 1)
    } else {
      throw new Error(result.error?.message || JSON.stringify(result))
    }
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Template creation timeout")
    }

    if (retryCount < maxRetries && !error.message.includes("timeout")) {
      console.log(`Template creation failed, retrying in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`)
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
      return createWhatsAppTemplate(templateName, message, mediaUrl, mediaType, config, retryCount + 1)
    }

    console.error("Template creation error:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

// Database-driven template checking (replaces aggressive polling)
async function scheduleTemplateCheck(db: any, templateId: string, templateName: string, campaignId: ObjectId) {
  // Insert into a job queue instead of starting immediate polling
  await db.collection("template_check_queue").insertOne({
    templateId: templateId,
    templateName: templateName,
    campaignId: campaignId,
    status: "PENDING",
    nextCheckAt: new Date(Date.now() + POLLING_CONFIG.INITIAL_INTERVAL),
    checkInterval: POLLING_CONFIG.INITIAL_INTERVAL,
    checkCount: 0,
    createdAt: new Date(),
    maxChecks: Math.floor(POLLING_CONFIG.MAX_DURATION / POLLING_CONFIG.INITIAL_INTERVAL),
  })

  console.log(`Scheduled template check for ${templateId}`)
}

// Function to send messages using approved template with transaction support
async function sendMessagesWithTemplate(
  contactList: any[],
  templateName: string,
  config: any,
  db: any,
  campaignId: ObjectId,
  userId: any,
  userBalance: number,
  baseCost: number,
  mediaCost: number,
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
    const batchSize = 10 // Process in batches to avoid memory issues

    // Update campaign status
    await db
      .collection("campaigns")
      .updateOne({ _id: campaignId }, { $set: { status: "Sending Messages", startedAt: new Date() } }, { session })

    // Check message sending rate limit
    const rateLimitCheck = await checkRateLimit(db, userId, "MESSAGE_SENDING", session)
    if (!rateLimitCheck.allowed) {
      throw new Error(
        `Message sending rate limit exceeded. Try again in ${Math.ceil(rateLimitCheck.resetIn / 60000)} minutes.`,
      )
    }

    // Process contacts in batches
    for (let i = 0; i < contactList.length; i += batchSize) {
      const batch = contactList.slice(i, i + batchSize)

      for (const contact of batch) {
        try {
          // Format phone number
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

          // Clean and format phone number
          phoneNumber = phoneNumber.toString().replace(/\D/g, "")

          // Format for Indian numbers
          const formattedNumbers = []
          if (phoneNumber.length === 10) {
            formattedNumbers.push("91" + phoneNumber)
          } else if (phoneNumber.length === 11 && phoneNumber.startsWith("0")) {
            formattedNumbers.push("91" + phoneNumber.substring(1))
          } else if (phoneNumber.length === 12 && phoneNumber.startsWith("91")) {
            formattedNumbers.push(phoneNumber)
          } else {
            formattedNumbers.push(phoneNumber)
            if (!phoneNumber.startsWith("91")) {
              formattedNumbers.push("91" + phoneNumber)
            }
          }

          let messageSuccess = false
          let lastError = ""

          // Try different phone number formats
          for (const tryPhoneNumber of formattedNumbers) {
            try {
              const messageResult = await sendSingleMessage(
                tryPhoneNumber,
                templateName,
                contact.name || "Customer",
                config,
                mediaUrl,
                mediaType,
              )

              if (messageResult.success) {
                console.log(`✅ Message sent successfully to ${tryPhoneNumber}`)
                messageSuccess = true
                totalSent++
                results.push({
                  contactId: contact._id,
                  phone: tryPhoneNumber,
                  name: contact.name,
                  success: true,
                  messageId: messageResult.messageId,
                  timestamp: new Date(),
                  templateUsed: templateName,
                })
                break
              } else {
                lastError = messageResult.error
                console.log(`❌ Failed to send to ${tryPhoneNumber}:`, lastError)
              }
            } catch (fetchError) {
              console.error(`Network error for ${tryPhoneNumber}:`, fetchError)
              lastError = fetchError.message || "Network error"
            }

            // Small delay between attempts
            await new Promise((resolve) => setTimeout(resolve, 200))
          }

          if (!messageSuccess) {
            totalFailed++
            results.push({
              contactId: contact._id,
              phone: formattedNumbers[0],
              name: contact.name,
              success: false,
              error: lastError || "All phone number formats failed",
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

      // Delay between batches to avoid rate limiting
      if (i + batchSize < contactList.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }

    // Calculate actual cost and update user balance
    const actualCost = totalSent * 0.5 + (mediaUrl && totalSent > 0 ? totalSent * 0.2 : 0)

    if (actualCost > 0) {
      // Update user balance
      const balanceUpdate = await db.collection("users").updateOne(
        { _id: userId },
        {
          $inc: { balance: -actualCost },
          $set: { updatedAt: new Date() },
        },
        { session },
      )

      if (balanceUpdate.matchedCount === 0) {
        throw new Error("User not found for balance update")
      }

      // Create transaction record
      await db.collection("transactions").insertOne(
        {
          userId: userId,
          type: "campaign_cost",
          amount: -actualCost,
          description: `WhatsApp campaign: ${totalSent} sent, ${totalFailed} failed${mediaUrl ? " (with media)" : ""}`,
          campaignId,
          balanceBefore: userBalance,
          balanceAfter: userBalance - actualCost,
          createdAt: new Date(),
        },
        { session },
      )

      // Update rate limit for message sending
      await updateRateLimit(db, userId, "MESSAGE_SENDING", session)
    }

    // Create message logs for each recipient
    const messageLogs = results.map((result) => ({
      campaignId: campaignId.toString(),
      userId: userId,
      contactId: result.contactId,
      contactName: result.name,
      contactPhone: result.phone,
      message: "WhatsApp template message",
      status: result.success ? "delivered" : "failed",
      timestamp: result.timestamp,
      error: result.success ? null : result.error,
      messageId: result.messageId || null,
      templateUsed: result.templateUsed || templateName,
      serviceResponse: result,
    }))

    if (messageLogs.length > 0) {
      await db.collection("message_logs").insertMany(messageLogs, { session })
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
      newBalance: userBalance - actualCost,
    }
  } catch (error) {
    console.error("Error in sendMessagesWithTemplate:", error)

    // Rollback transaction
    if (session && session.inTransaction()) {
      await session.abortTransaction()
    }

    // Update campaign status to failed
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

// Helper function to send a single message with retry logic
async function sendSingleMessage(
  phoneNumber: string,
  templateName: string,
  contactName: string,
  config: any,
  mediaUrl?: string,
  mediaType?: string,
  retryCount = 0,
) {
  const maxRetries = 2
  const retryDelay = Math.pow(2, retryCount) * 1000

  try {
    const messagePayload = {
      messaging_product: "whatsapp",
      to: phoneNumber,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: "en_US",
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: contactName,
              },
            ],
          },
        ],
      },
    }

    // Add header component if media exists
    if (mediaUrl) {
      messagePayload.template.components.unshift({
        type: "header",
        parameters: [
          {
            type: mediaType || "image",
            [mediaType || "image"]: {
              link: mediaUrl,
            },
          },
        ],
      })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

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
      // Rate limited - retry with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
      return sendSingleMessage(phoneNumber, templateName, contactName, config, mediaUrl, mediaType, retryCount + 1)
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
      return sendSingleMessage(phoneNumber, templateName, contactName, config, mediaUrl, mediaType, retryCount + 1)
    }

    return {
      success: false,
      error: error.message || "Network error",
    }
  }
}
