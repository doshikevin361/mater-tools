import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function DELETE(request: NextRequest) {
  try {
    const { callId } = await request.json()

    if (!callId) {
      return NextResponse.json({ error: "Call ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Delete the call record
    const deleteResult = await db.collection("calls").deleteOne({
      _id: new ObjectId(callId),
    })

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ error: "Call record not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Call record deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting call:", error)
    return NextResponse.json(
      {
        error: "Failed to delete call record",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
