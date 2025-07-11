import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get("jobId")
    const userId = searchParams.get("userId")

    if (!jobId || !userId) {
      return NextResponse.json({ error: "Missing jobId or userId" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const job = await db.collection("automation_jobs").findOne({
      _id: new ObjectId(jobId),
      userId,
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job._id,
        status: job.status,
        progress: job.progress,
        totalAccounts: job.totalAccounts,
        createdAccounts: job.createdAccounts,
        platforms: job.platforms,
        startTime: job.startTime,
        endTime: job.endTime,
        accounts: job.accounts || [],
      },
    })
  } catch (error) {
    console.error("Status check error:", error)
    return NextResponse.json({ error: "Failed to get job status" }, { status: 500 })
  }
}
