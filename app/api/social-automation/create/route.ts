import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { platforms, accountCounts, userId } = body

    if (!platforms || !accountCounts || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Calculate total accounts to create
    const totalAccounts = platforms.reduce((sum: number, platform: string) => {
      return sum + (accountCounts[platform] || 0)
    }, 0)

    // Create automation job
    const job = {
      userId,
      platforms,
      accountCounts,
      totalAccounts,
      createdAccounts: 0,
      status: "processing",
      startTime: new Date(),
      progress: 0,
      accounts: [],
    }

    const result = await db.collection("automation_jobs").insertOne(job)
    const jobId = result.insertedId.toString()

    // Start background processing
    processAccountCreation(jobId, platforms, accountCounts, userId)

    // Send start notification
    await db.collection("notifications").insertOne({
      userId,
      type: "automation_started",
      title: "Social Automation Started",
      message: `Creating ${totalAccounts} accounts across ${platforms.length} platforms`,
      timestamp: new Date(),
      read: false,
    })

    return NextResponse.json({
      success: true,
      jobId,
      message: "Account creation started in background",
    })
  } catch (error) {
    console.error("Social automation error:", error)
    return NextResponse.json({ error: "Failed to start automation" }, { status: 500 })
  }
}

async function processAccountCreation(jobId: string, platforms: string[], accountCounts: any, userId: string) {
  const { db } = await connectToDatabase()

  try {
    let totalCreated = 0
    const totalAccounts = platforms.reduce((sum, platform) => sum + (accountCounts[platform] || 0), 0)
    const createdAccounts = []

    for (const platform of platforms) {
      const count = accountCounts[platform] || 0

      for (let i = 0; i < count; i++) {
        // Simulate account creation time (30-90 seconds)
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 60000 + 30000))

        // 90% success rate simulation
        const isSuccess = Math.random() > 0.1

        if (isSuccess) {
          const account = await createSocialAccount(platform, userId)
          createdAccounts.push(account)

          // Save account to database
          await db.collection("social_automation_accounts").insertOne(account)
        }

        totalCreated++
        const progress = Math.round((totalCreated / totalAccounts) * 100)

        // Update job progress
        await db.collection("automation_jobs").updateOne(
          { _id: jobId },
          {
            $set: {
              createdAccounts: totalCreated,
              progress,
              accounts: createdAccounts,
            },
          },
        )

        // Send progress notification every 3 accounts
        if (totalCreated % 3 === 0) {
          await db.collection("notifications").insertOne({
            userId,
            type: "automation_progress",
            title: "Automation Progress",
            message: `${totalCreated}/${totalAccounts} accounts created (${progress}%)`,
            timestamp: new Date(),
            read: false,
          })
        }
      }
    }

    // Mark job as completed
    await db.collection("automation_jobs").updateOne(
      { _id: jobId },
      {
        $set: {
          status: "completed",
          endTime: new Date(),
          progress: 100,
        },
      },
    )

    // Send completion notification
    await db.collection("notifications").insertOne({
      userId,
      type: "automation_completed",
      title: "Social Automation Completed",
      message: `Successfully created ${createdAccounts.length}/${totalAccounts} accounts`,
      timestamp: new Date(),
      read: false,
    })
  } catch (error) {
    console.error("Background processing error:", error)

    // Mark job as failed
    await db.collection("automation_jobs").updateOne(
      { _id: jobId },
      {
        $set: {
          status: "failed",
          endTime: new Date(),
          error: error.message,
        },
      },
    )
  }
}

function createSocialAccount(platform: string, userId: string) {
  const firstNames = ["Arjun", "Priya", "Rahul", "Sneha", "Vikram", "Anita", "Rohit", "Kavya", "Amit", "Pooja"]
  const lastNames = ["Sharma", "Patel", "Singh", "Kumar", "Gupta", "Agarwal", "Jain", "Verma", "Shah", "Mehta"]

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
  const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}`
  const email = `${username}@tempmail${Math.floor(Math.random() * 100)}.com`
  const password = generatePassword()

  return {
    userId,
    platform,
    email,
    firstName,
    lastName,
    username,
    password,
    birthDate: generateBirthDate(),
    gender: Math.random() > 0.5 ? "male" : "female",
    status: Math.random() > 0.1 ? "active" : "phone_verification_required",
    createdAt: new Date(),
    country: "India",
  }
}

function generatePassword() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%"
  let password = ""
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

function generateBirthDate() {
  const start = new Date(1990, 0, 1)
  const end = new Date(2005, 11, 31)
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}
