import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
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

    const db = await getDatabase()

    // Get user and check balance
    const user = await db.collection("users").findOne({ _id: actualUserId })
    if (!user) {
      console.log("User not found with ID:", actualUserId)
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    console.log("Found user:", user.firstName, user.lastName, "Balance:", user.balance)

    // Get user's actual contacts from database
    let contactList = []

    if (Array.isArray(recipients)) {
      const contactIds = recipients.map((id) => {
        try {
          return new ObjectId(id)
        } catch (error) {
          return id
        }
      })

      contactList = await db
        .collection("contacts")
        .find({
          $or: [{ _id: { $in: contactIds } }, { _id: { $in: recipients } }],
          userId: actualUserId,
          status: { $ne: "deleted" },
          phone: { $exists: true, $ne: null, $ne: "" },
        })
        .toArray()
    }

    console.log(`Found ${contactList.length} contacts with phone numbers`)
    console.log(
      "Contact details:",
      contactList.map((c) => ({ name: c.name, phone: c.phone, mobile: c.mobile })),
    )

    if (contactList.length === 0) {
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
      return NextResponse.json(
        {
          success: false,
          message: `Insufficient balance. Required: ₹${campaignCost.toFixed(2)}, Available: ₹${user.balance.toFixed(2)}`,
        },
        { status: 400 },
      )
    }

    // Create campaign record
    const campaign = {
      name: campaignName || `WhatsApp Campaign - ${new Date().toLocaleDateString()}`,
      type: "WhatsApp",
      message,
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null,
      recipients: Array.isArray(recipients) ? recipients : [recipients],
      recipientCount: contactList.length,
      status: "Processing",
      sent: 0,
      delivered: 0,
      failed: 0,
      cost: campaignCost,
      createdAt: new Date(),
      userId: actualUserId,
    }

    const campaignResult = await db.collection("campaigns").insertOne(campaign)
    const campaignId = campaignResult.insertedId

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

    // Dynamic Template Management Functions
    async function createDynamicTemplate(messageContent: string, hasMedia = false) {
      try {
        // Generate template name based on message content hash
        const templateName = `dynamic_${Date.now()}_${Math.random().toString(36).substring(7)}`

        // Create template components
        const components = []

        // Add header component if media is present
        if (hasMedia && mediaUrl) {
          components.push({
            type: "HEADER",
            format: mediaType?.toUpperCase() || "IMAGE",
            example: {
              header_handle: [mediaUrl],
            },
          })
        }

        // Add body component with dynamic variable
        components.push({
          type: "BODY",
          text: `Hello {{1}}, ${messageContent}`,
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

        console.log("Creating template:", JSON.stringify(templatePayload, null, 2))

        const response = await fetch(`${whatsappConfig.baseUrl}/${whatsappConfig.wabaId}/message_templates`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${whatsappConfig.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(templatePayload),
        })

        const result = await response.json()
        console.log("Template creation response:", result)

        if (response.ok && result.id) {
          return {
            success: true,
            templateId: result.id,
            templateName: templateName,
            status: result.status || "PENDING",
          }
        } else {
          throw new Error(result.error?.message || "Failed to create template")
        }
      } catch (error) {
        console.error("Template creation error:", error)
        return {
          success: false,
          error: error.message,
        }
      }
    }

    async function checkTemplateStatus(templateId: string) {
      try {
        const response = await fetch(`${whatsappConfig.baseUrl}/${templateId}`, {
          headers: {
            Authorization: `Bearer ${whatsappConfig.accessToken}`,
          },
        })

        const result = await response.json()
        return {
          success: response.ok,
          status: result.status,
          data: result,
        }
      } catch (error) {
        console.error("Template status check error:", error)
        return {
          success: false,
          error: error.message,
        }
      }
    }

    async function sendWhatsAppMessage(phoneNumber: string, templateName: string, contactName: string) {
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
                    text: contactName || "Customer",
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

        console.log("Sending message payload:", JSON.stringify(messagePayload, null, 2))

        const response = await fetch(`${whatsappConfig.baseUrl}/${whatsappConfig.phoneNumberId}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${whatsappConfig.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messagePayload),
        })

        const result = await response.json()
        console.log("Message send response:", result)

        if (response.ok && result.messages) {
          return {
            success: true,
            messageId: result.messages[0].id,
            response: result,
          }
        } else {
          throw new Error(result.error?.message || "Failed to send message")
        }
      } catch (error) {
        console.error("Message send error:", error)
        return {
          success: false,
          error: error.message,
        }
      }
    }

    // Send WhatsApp messages with dynamic template creation
    try {
      await db
        .collection("campaigns")
        .updateOne({ _id: campaignId }, { $set: { status: "Creating Template", startedAt: new Date() } })

      let totalSent = 0
      let totalFailed = 0
      const results = []
      let templateInfo = null

      // Step 1: Create dynamic template
      console.log("Creating dynamic template for message:", message)
      const templateResult = await createDynamicTemplate(message, !!mediaUrl)

      if (!templateResult.success) {
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

      templateInfo = templateResult
      console.log("Template created successfully:", templateInfo)

      // Step 2: Wait for template approval (polling)
      await db
        .collection("campaigns")
        .updateOne({ _id: campaignId }, { $set: { status: "Waiting for Template Approval" } })

      let templateApproved = false
      let approvalAttempts = 0
      const maxApprovalAttempts = 30 // 5 minutes with 10-second intervals

      while (!templateApproved && approvalAttempts < maxApprovalAttempts) {
        console.log(`Checking template approval status... Attempt ${approvalAttempts + 1}`)

        const statusCheck = await checkTemplateStatus(templateInfo.templateId)

        if (statusCheck.success) {
          console.log("Template status:", statusCheck.status)

          if (statusCheck.status === "APPROVED") {
            templateApproved = true
            console.log("✅ Template approved!")
            break
          } else if (statusCheck.status === "REJECTED") {
            await db.collection("campaigns").updateOne(
              { _id: campaignId },
              {
                $set: {
                  status: "Failed",
                  error: "Template was rejected by WhatsApp",
                  failedAt: new Date(),
                },
              },
            )

            return NextResponse.json({
              success: false,
              message: "WhatsApp template was rejected. Please modify your message and try again.",
            })
          }
        }

        approvalAttempts++
        if (approvalAttempts < maxApprovalAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 10000)) // Wait 10 seconds
        }
      }

      if (!templateApproved) {
        await db.collection("campaigns").updateOne(
          { _id: campaignId },
          {
            $set: {
              status: "Failed",
              error: "Template approval timeout",
              failedAt: new Date(),
            },
          },
        )

        return NextResponse.json({
          success: false,
          message: "Template approval is taking longer than expected. Please try again later.",
        })
      }

      // Step 3: Send messages using approved template
      await db.collection("campaigns").updateOne({ _id: campaignId }, { $set: { status: "Sending Messages" } })

      for (const contact of contactList) {
        try {
          // Format phone number properly
          let phoneNumber = contact.phone || contact.mobile
          console.log("Original phone number:", phoneNumber)

          if (!phoneNumber) {
            console.log("No phone number found for contact:", contact.name)
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

          // Clean and format phone number for WhatsApp
          phoneNumber = phoneNumber.toString().replace(/\D/g, "") // Remove all non-digits

          // Handle Indian numbers - try different formats
          const formattedNumbers = []

          if (phoneNumber.length === 10) {
            formattedNumbers.push("91" + phoneNumber) // Add India country code
          } else if (phoneNumber.length === 11 && phoneNumber.startsWith("0")) {
            const withoutZero = phoneNumber.substring(1)
            formattedNumbers.push("91" + withoutZero)
          } else if (phoneNumber.length === 12 && phoneNumber.startsWith("91")) {
            formattedNumbers.push(phoneNumber) // Already has country code
          } else if (phoneNumber.length === 13 && phoneNumber.startsWith("091")) {
            const cleaned = phoneNumber.substring(1)
            formattedNumbers.push(cleaned)
          } else {
            // Use as is and also try with +91
            formattedNumbers.push(phoneNumber)
            if (!phoneNumber.startsWith("91")) {
              formattedNumbers.push("91" + phoneNumber)
            }
          }

          console.log("Trying phone number formats:", formattedNumbers)

          let messageSuccess = false
          let lastError = ""
          let lastResponse = null

          // Try different phone number formats
          for (const tryPhoneNumber of formattedNumbers) {
            try {
              console.log(`Attempting to send to: ${tryPhoneNumber}`)

              const sendResult = await sendWhatsAppMessage(
                tryPhoneNumber,
                templateInfo.templateName,
                contact.name || "Customer",
              )

              if (sendResult.success) {
                console.log(`✅ Success for ${tryPhoneNumber}`)
                messageSuccess = true
                totalSent++
                results.push({
                  contactId: contact._id,
                  phone: tryPhoneNumber,
                  name: contact.name,
                  success: true,
                  messageId: sendResult.messageId,
                  timestamp: new Date(),
                  templateUsed: templateInfo.templateName,
                  apiResponse: sendResult.response,
                })
                break // Success, no need to try other formats
              } else {
                lastError = sendResult.error
                lastResponse = sendResult
                console.log(`❌ Failed for ${tryPhoneNumber}:`, lastError)
              }
            } catch (fetchError) {
              console.error(`Network error for ${tryPhoneNumber}:`, fetchError)
              lastError = fetchError.message || "Network error"
              lastResponse = { networkError: fetchError.message }
            }

            // Small delay between attempts
            await new Promise((resolve) => setTimeout(resolve, 100))
          }

          // If none of the formats worked
          if (!messageSuccess) {
            totalFailed++
            results.push({
              contactId: contact._id,
              phone: formattedNumbers[0], // Use first attempted format
              name: contact.name,
              success: false,
              error: lastError || "All phone number formats failed",
              timestamp: new Date(),
              apiResponse: lastResponse,
              attemptedFormats: formattedNumbers,
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

        // Delay between contacts to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      console.log("Final campaign results:", { totalSent, totalFailed, results })

      // Update campaign with results
      await db.collection("campaigns").updateOne(
        { _id: campaignId },
        {
          $set: {
            status: totalFailed === 0 ? "Completed" : totalSent > 0 ? "Partially Completed" : "Failed",
            sent: totalSent,
            failed: totalFailed,
            delivered: totalSent, // Assume sent = delivered for now
            completedAt: new Date(),
            results,
            templateInfo: templateInfo,
          },
        },
      )

      // Deduct cost from user balance (only for successfully sent messages)
      const actualCost = totalSent * 0.5 + (mediaUrl && totalSent > 0 ? totalSent * 0.2 : 0)

      if (actualCost > 0) {
        await db.collection("users").updateOne(
          { _id: actualUserId },
          {
            $inc: { balance: -actualCost },
            $set: { updatedAt: new Date() },
          },
        )

        // Create transaction record
        await db.collection("transactions").insertOne({
          userId: actualUserId,
          type: "campaign_cost",
          amount: -actualCost,
          description: `WhatsApp campaign: ${totalSent} sent, ${totalFailed} failed${mediaUrl ? " (with media)" : ""}`,
          campaignId,
          balanceBefore: user.balance,
          balanceAfter: user.balance - actualCost,
          createdAt: new Date(),
        })
      }

      return NextResponse.json({
        success: true,
        message: `WhatsApp campaign completed! ${totalSent} messages sent successfully, ${totalFailed} failed.`,
        campaign: {
          ...campaign,
          _id: campaignId,
          sent: totalSent,
          failed: totalFailed,
          status: totalFailed === 0 ? "Completed" : totalSent > 0 ? "Partially Completed" : "Failed",
        },
        results: {
          totalContacts: contactList.length,
          sent: totalSent,
          failed: totalFailed,
          cost: actualCost,
          successRate: contactList.length > 0 ? ((totalSent / contactList.length) * 100).toFixed(1) : "0.0",
          detailedResults: results,
        },
        templateInfo: {
          templateId: templateInfo.templateId,
          templateName: templateInfo.templateName,
          status: "APPROVED",
        },
        newBalance: user.balance - actualCost,
      })
    } catch (sendError) {
      console.error("WhatsApp sending error:", sendError)

      await db.collection("campaigns").updateOne(
        { _id: campaignId },
        {
          $set: {
            status: "Failed",
            error: sendError.message,
            failedAt: new Date(),
          },
        },
      )

      return NextResponse.json(
        {
          success: false,
          message: "Failed to send WhatsApp campaign: " + sendError.message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("WhatsApp send error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to start WhatsApp campaign", error: error.message },
      { status: 500 },
    )
  }
}
