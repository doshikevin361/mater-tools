import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {

    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    if (!audioFile) {
      return NextResponse.json({ success: false, message: "No audio file provided" }, { status: 400 })
    }

   

    const allowedTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
      "audio/webm",
      "audio/x-wav",
      "audio/mp4",
      "audio/aac",
      "audio/m4a",
      "audio/x-m4a",
      "audio/x-mpeg",
      "audio/mpeg3",
      "audio/x-mpeg3",
      "audio/x-mp3",
      // Sometimes browsers don't set MIME type correctly
      "application/octet-stream",
    ]

    // Also check file extension as fallback
    const fileExtension = audioFile.name.toLowerCase().split(".").pop()
    const allowedExtensions = ["mp3", "wav", "ogg", "webm", "mp4", "aac", "m4a"]

    const isValidType = allowedTypes.includes(audioFile.type) || allowedExtensions.includes(fileExtension || "")


    if (!isValidType) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid file type. Please upload an audio file. Detected type: ${audioFile.type}, Extension: ${fileExtension}`,
          details: {
            detectedType: audioFile.type,
            detectedExtension: fileExtension,
            allowedTypes: allowedTypes,
            allowedExtensions: allowedExtensions,
          },
        },
        { status: 400 },
      )
    }

    const maxSize = 25 * 1024 * 1024 // 25MB
    if (audioFile.size > maxSize) {
      return NextResponse.json({ success: false, message: "File too large. Maximum size is 25MB." }, { status: 400 })
    }

    // Generate unique filename with proper extension
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const originalExtension = fileExtension || "mp3"
    const filename = `voice-${timestamp}-${randomId}.${originalExtension}`


    const blob = await put(filename, audioFile, {
      access: "public",
      addRandomSuffix: false,
      token: "vercel_blob_rw_oUJ4yaaoVoPU9wQE_LtVQCp1WnkzLYQ2Y5AW6smjXLMg9li",
    })


    return NextResponse.json({
      success: true,
      message: "Audio file uploaded successfully",
      audioUrl: blob.url,
      filename: blob.pathname,
      size: audioFile.size,
      type: audioFile.type,
      originalName: audioFile.name,
      duration: null,
    })
  } catch (error) {
    console.error("Audio upload error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to upload audio file",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === "development" ? (error as Error).stack : undefined,
      },
      { status: 500 },
    )
  }
}
