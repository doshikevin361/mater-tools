import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Simulated account creation with realistic delays
async function simulateAccountCreation(platform: string, accountNumber: number) {
  // Simulate realistic creation time (30-90 seconds per account)
  const creationTime = 30000 + Math.random() * 60000

  return new Promise((resolve) => {
    setTimeout(() => {
      const success = Math.random() > 0.1 // 90% success rate

      if (success) {
        const username = `${platform}_user_${Date.now()}_${accountNumber}`
        const email = `${username}@tempmail.com`

        resolve({
          success: true,
          platform,
          accountNumber,
          username,
          email,
          password: `Pass${Math.floor(Math.random() * 10000)}!`,
          profile: {
            firstName: `User${accountNumber}`,
            lastName: `Test${accountNumber}`,
            fullName: `User${accountNumber} Test${accountNumber}`,
            birthDate: `199${Math.floor(Math.random() * 10)}-0${Math.floor(Math.random() * 9) + 1}-${Math.floor(Math.random() * 28) + 1}`,
            gender: Math.random() > 0.5 ? "male" : "female",
          },
          verified: Math.random() > 0.3, // 70% verified
          createdAt: new Date(),
        })
      } else {
        resolve({
          success: false,
          platform,
          accountNumber,
          error: "Account creation failed - platform restrictions",
        })
      }
    }, creationTime)
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { platforms, count, userId } = body

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    if (!platforms || platforms.length === 0) {
      return NextResponse.json({ success: false, message: "At least one platform is required" }, { status: 400 })
    }

    if (count < 1 || count > 10) {
      return NextResponse.json({ success: false, message: "Count must be between 1 and 10" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Create automation job
    const automationJob = {
      userId,
      platforms,
      totalAccounts: platforms.length * count,
      accountsPerPlatform: count,
      status: "processing",
      progress: 0,
      createdAccounts: [],
      failedAccounts: [],
      startedAt: new Date(),
      estimatedCompletionTime: new Date(Date.now() + platforms.length * count * 60000), // 1 min per account estimate
    }

    const jobResult = await db.collection("automation_jobs").insertOne(automationJob)
    const jobId = jobResult.insertedId.toString()

    // Send initial notification
    await db.collection("notifications").insertOne({
      userId,
      title: "Account Creation Started",
      message: `Creating ${platforms.length * count} accounts across ${platforms.join(", ")}. This may take ${Math.ceil(platforms.length * count)} minutes.`,
      type: "info",
      read: false,
      createdAt: new Date(),
    })

    // Start account creation process asynchronously
    setImmediate(async () => {
      let totalCreated = 0
      let totalFailed = 0
      const createdAccounts = []
      const failedAccounts = []

      for (const platform of platforms) {
        for (let i = 1; i <= count; i++) {
          try {
            // Update progress
            const currentProgress = Math.floor(((totalCreated + totalFailed) / (platforms.length * count)) * 100)
            await db.collection("automation_jobs").updateOne(
              { _id: new ObjectId(jobId) },
              {
                $set: {
                  progress: currentProgress,
                  currentTask: `Creating ${platform} account ${i}/${count}`,
                },
              },
            )

            // Send progress notification every 3 accounts
            if ((totalCreated + totalFailed) % 3 === 0 && totalCreated + totalFailed > 0) {
              await db.collection("notifications").insertOne({
                userId,
                title: "Account Creation Progress",
                message: `${totalCreated + totalFailed}/${platforms.length * count} accounts processed. ${currentProgress}% complete.`,
                type: "info",
                read: false,
                createdAt: new Date(),
              })
            }

            const result = await simulateAccountCreation(platform, i)

            if (result.success) {
              // Save successful account
              const accountData = {
                userId,
                platform: result.platform,
                accountNumber: result.accountNumber,
                username: result.username,
                email: result.email,
                password: result.password,
                profile: result.profile,
                status: "active",
                verified: result.verified,
                automationJobId: jobId,
                createdAt: new Date(),
              }

              await db.collection("social_automation_accounts").insertOne(accountData)
              createdAccounts.push(result)
              totalCreated++
            } else {
              failedAccounts.push(result)
              totalFailed++
            }
          } catch (error) {
            console.error(`Error creating ${platform} account ${i}:`, error)
            failedAccounts.push({
              success: false,
              platform,
              accountNumber: i,
              error: error.message,
            })
            totalFailed++
          }
        }
      }

      // Update final job status
      await db.collection("automation_jobs").updateOne(
        { _id: new ObjectId(jobId) },
        {
          $set: {
            status: "completed",
            progress: 100,
            completedAt: new Date(),
            totalCreated,
            totalFailed,
            createdAccounts,
            failedAccounts,
          },
        },
      )

      // Send completion notification
      await db.collection("notifications").insertOne({
        userId,
        title: "Account Creation Completed!",
        message: `Successfully created ${totalCreated} accounts. ${totalFailed} failed. Check your account list for details.`,
        type: totalFailed === 0 ? "success" : "warning",
        read: false,
        createdAt: new Date(),
      })
    })

    return NextResponse.json({
      success: true,
      message: "Account creation started in background",
      jobId,
      estimatedTime: `${platforms.length * count} minutes`,
      totalAccounts: platforms.length * count,
    })
  } catch (error) {
    console.error("Error starting automation:", error)
    return NextResponse.json({ success: false, message: "Failed to start account creation" }, { status: 500 })
  }
}
