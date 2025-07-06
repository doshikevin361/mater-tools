import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("audio") as File

    if (!file) {
      return NextResponse.json({ success: false, message: "No audio file provided" }, { status: 400 })
    }

    console.log("Uploading file:", {
      name: file.name,
      size: file.size,
      type: file.type,
    })

    // Upload to Vercel Blob using your store URL
    const blob = await put(file.name, file, {
      access: "public",
      token: "vercel_blob_rw_store_oUJ4yaaoVoPU9wQE_KjGvN8f2M3pL7qR9sT1vX4wY6zA8bC5dE2fG3hI9jK0lM",
    })

    console.log("Blob upload result:", blob)

    return NextResponse.json({
      success: true,
      message: "Audio uploaded successfully",
      audioUrl: blob.url,
      filename: file.name,
      size: file.size,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to upload audio file",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
