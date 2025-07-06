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

    // Send WhatsApp messages using Telebu API
    try {
      await db
        .collection("campaigns")
        .updateOne({ _id: campaignId }, { $set: { status: "Sending", startedAt: new Date() } })

      let totalSent = 0
      let totalFailed = 0
      const results = []

      // Updated Telebu WhatsApp API configuration - check if token needs refresh
      const telebuConfig = {
        baseUrl: "https://apisocial.telebu.com/whatsapp-api/v1.0/customer/88325/bot/952cf500d8334254",
        authToken:
          "Bearer 00D8d000003VHZr!AQEAQJvuK15_TF3Dtyw_linVnsbL5CrtOn8RrFqpAXeLpak4kf1gNNx9ggt.7gg5hae5KWeeVyIcxmnYrxvfqbDoQTVuSLSE",
        templateName: "buzz_demo",
        namespace: "e539406f_8256_4fe3_b91d_b979da88da9e",
      }

      // First, let's test the API endpoint with a simple request
      console.log("Testing API endpoint accessibility...")
      try {
        const testResponse = await fetch(`${telebuConfig.baseUrl}/template`, {
          method: "POST",
          headers: {
            Authorization: telebuConfig.authToken,
            "Content-Type": "application/json",
            Accept: "application/json",
            "User-Agent": "BrandBuzz-WhatsApp/1.0",
          },
          body: JSON.stringify({
            payload: {
              name: telebuConfig.templateName,
              components: [
                {
                  type: "body",
                  parameters: [
                    {
                      type: "text",
                      text: "Test User",
                    },
                    {
                      type: "text",
                      text: "Test message",
                    },
                  ],
                },
              ],
              language: {
                code: "en_US",
                policy: "deterministic",
              },
              namespace: telebuConfig.namespace,
            },
            phoneNumber: "918733832957",
          }),
        })

        console.log("Test API Response Status:", testResponse.status, testResponse.statusText)
        console.log("Test API Response Headers:", Object.fromEntries(testResponse.headers.entries()))

        const testResponseText = await testResponse.text()
        console.log("Test API Response Body:", testResponseText)

        if (testResponse.status === 401) {
          console.error("❌ Authentication failed - Token may be expired or invalid")

          // Update campaign as failed due to auth
          await db.collection("campaigns").updateOne(
            { _id: campaignId },
            {
              $set: {
                status: "Failed",
                error: "Authentication failed - Invalid or expired token",
                failedAt: new Date(),
              },
            },
          )

          return NextResponse.json({
            success: false,
            message: "WhatsApp API authentication failed. Please check your API credentials.",
            error: "HTTP 401 - Unauthorized. The API token may be expired or invalid.",
            debugInfo: {
              httpStatus: 401,
              apiEndpoint: `${telebuConfig.baseUrl}/template`,
              authTokenLength: telebuConfig.authToken.length,
              suggestion: "Please verify your Telebu API token is valid and not expired",
            },
          })
        }
      } catch (testError) {
        console.error("API test failed:", testError)
      }

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

          // Clean and format phone number
          phoneNumber = phoneNumber.toString().replace(/\D/g, "") // Remove all non-digits

          // Handle Indian numbers - try different formats
          const formattedNumbers = []

          if (phoneNumber.length === 10) {
            formattedNumbers.push("91" + phoneNumber) // Add India country code
            formattedNumbers.push("+91" + phoneNumber) // With + prefix
          } else if (phoneNumber.length === 11 && phoneNumber.startsWith("0")) {
            const withoutZero = phoneNumber.substring(1)
            formattedNumbers.push("91" + withoutZero)
            formattedNumbers.push("+91" + withoutZero)
          } else if (phoneNumber.length === 12 && phoneNumber.startsWith("91")) {
            formattedNumbers.push(phoneNumber) // Already has country code
            formattedNumbers.push("+" + phoneNumber) // With + prefix
          } else if (phoneNumber.length === 13 && phoneNumber.startsWith("091")) {
            const cleaned = phoneNumber.substring(1)
            formattedNumbers.push(cleaned)
            formattedNumbers.push("+" + cleaned)
          } else {
            // Use as is and also try with +91
            formattedNumbers.push(phoneNumber)
            formattedNumbers.push("91" + phoneNumber)
            formattedNumbers.push("+91" + phoneNumber)
          }

          console.log("Trying phone number formats:", formattedNumbers)

          let messageSuccess = false
          let lastError = ""
          let lastResponse = null

          // Try different phone number formats
          for (const tryPhoneNumber of formattedNumbers) {
            try {
              console.log(`Attempting to send to: ${tryPhoneNumber}`)

              // Prepare WhatsApp template payload
              const templatePayload = {
                payload: {
                  name: telebuConfig.templateName,
                  components: [
                    {
                      type: "body",
                      parameters: [
                        {
                          type: "text",
                          text: contact.name || "Customer",
                        },
                        {
                          type: "text",
                          text: message,
                        },
                      ],
                    },
                  ],
                  language: {
                    code: "en_US",
                    policy: "deterministic",
                  },
                  namespace: telebuConfig.namespace,
                },
                phoneNumber: tryPhoneNumber,
              }

              // Add header component only if media is provided
              if (mediaUrl) {
                templatePayload.payload.components.unshift({
                  type: "header",
                  parameters: [
                    {
                      type: "image",
                      image: {
                        link: mediaUrl,
                      },
                    },
                  ],
                })
              }

              console.log(`Payload for ${tryPhoneNumber}:`, JSON.stringify(templatePayload, null, 2))

              // Send WhatsApp message via Telebu API with timeout
              const controller = new AbortController()
              const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

              const response = await fetch(`${telebuConfig.baseUrl}/template`, {
                method: "POST",
                headers: {
                  Authorization: telebuConfig.authToken,
                  "Content-Type": "application/json",
                  Accept: "application/json",
                  "User-Agent": "BrandBuzz-WhatsApp/1.0",
                },
                body: JSON.stringify(templatePayload),
                signal: controller.signal,
              })

              clearTimeout(timeoutId)

              console.log(`Response status for ${tryPhoneNumber}:`, response.status, response.statusText)
              console.log(`Response headers:`, Object.fromEntries(response.headers.entries()))

              const responseText = await response.text()
              console.log(`Raw response for ${tryPhoneNumber}:`, responseText)

              let result
              try {
                result = responseText ? JSON.parse(responseText) : {}
              } catch (parseError) {
                console.error("Failed to parse API response:", parseError)
                result = {
                  error: "Invalid JSON response",
                  rawResponse: responseText,
                  parseError: parseError.message,
                }
              }

              console.log(`Parsed response for ${tryPhoneNumber}:`, result)

              // Handle specific HTTP status codes
              if (response.status === 401) {
                lastError = "Authentication failed - Invalid or expired API token"
                lastResponse = { httpStatus: 401, error: "Unauthorized" }
                console.log(`❌ Auth failed for ${tryPhoneNumber}: Token invalid/expired`)
                break // No point trying other formats if auth fails
              } else if (response.status === 400) {
                lastError = result.message || result.error || "Bad request - Check template or phone number format"
                lastResponse = result
                console.log(`❌ Bad request for ${tryPhoneNumber}:`, lastError)
              } else if (response.status === 429) {
                lastError = "Rate limit exceeded - Too many requests"
                lastResponse = result
                console.log(`❌ Rate limited for ${tryPhoneNumber}`)
                // Wait longer before next attempt
                await new Promise((resolve) => setTimeout(resolve, 2000))
              } else if (response.ok && responseText && !result.error) {
                console.log(`✅ Success for ${tryPhoneNumber}`)
                messageSuccess = true
                totalSent++
                results.push({
                  contactId: contact._id,
                  phone: tryPhoneNumber,
                  name: contact.name,
                  success: true,
                  messageId: result.messageId || result.id || result.data?.id || "unknown",
                  timestamp: new Date(),
                  apiResponse: result,
                  httpStatus: response.status,
                })
                break // Success, no need to try other formats
              } else {
                lastError =
                  result.message ||
                  result.error ||
                  result.errors ||
                  `HTTP ${response.status}: ${response.statusText}` ||
                  "Unknown error"
                lastResponse = result
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
        await new Promise((resolve) => setTimeout(resolve, 500))
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
          detailedResults: results, // Include detailed results for debugging
        },
        newBalance: user.balance - actualCost,
        debugInfo: {
          apiEndpoint: `${telebuConfig.baseUrl}/template`,
          authTokenLength: telebuConfig.authToken.length,
          templateName: telebuConfig.templateName,
          namespace: telebuConfig.namespace,
          authenticationStatus: "Failed - HTTP 401 Unauthorized",
          recommendation: "Please verify your Telebu API token is valid and not expired",
        },
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
