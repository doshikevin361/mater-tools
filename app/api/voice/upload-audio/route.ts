import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    console.log("Audio upload request received")

    const formData = await request.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      console.log("No audio file provided in request")
      return NextResponse.json({ success: false, message: "No audio file provided" }, { status: 400 })
    }

    console.log("Audio file details:", {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
      lastModified: audioFile.lastModified,
    })

    // Enhanced file type validation for MP3 and other audio formats
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

    console.log("File validation:", {
      type: audioFile.type,
      extension: fileExtension,
      isValidType,
    })

    if (!isValidType) {
      console.log("Invalid file type detected")
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
      console.log("File too large:", audioFile.size)
      return NextResponse.json({ success: false, message: "File too large. Maximum size is 25MB." }, { status: 400 })
    }

    // Generate unique filename with proper extension
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const originalExtension = fileExtension || "mp3"
    const filename = `voice-${timestamp}-${randomId}.${originalExtension}`

    console.log("Uploading to Vercel Blob:", { filename })

    // Upload to Vercel Blob storage with the token from environment
    const blob = await put(filename, audioFile, {
      access: "public",
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    console.log("File uploaded to Vercel Blob successfully:", blob)

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
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
