import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const jobId = searchParams.get("jobId")

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    if (jobId) {
      // Get specific job status
      const job = await db.collection("automation_jobs").findOne({
        _id: new ObjectId(jobId),
        userId,
      })

      if (!job) {
        return NextResponse.json({ success: false, message: "Job not found" }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        job: {
          ...job,
          id: job._id.toString(),
        },
      })
    } else {
      // Get all jobs for user
      const jobs = await db.collection("automation_jobs").find({ userId }).sort({ createdAt: -1 }).limit(10).toArray()

      return NextResponse.json({
        success: true,
        jobs: jobs.map((job) => ({
          ...job,
          id: job._id.toString(),
        })),
      })
    }
  } catch (error) {
    console.error("Error fetching automation status:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch status" }, { status: 500 })
  }
}
