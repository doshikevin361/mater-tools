import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { platform, sentiment, targetUrl, count = 50 } = body

    if (!platform || !sentiment || !targetUrl) {
      return NextResponse.json(
        { success: false, message: "Platform, sentiment, and target URL are required" },
        { status: 400 },
      )
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ success: false, message: "Gemini API key not configured" }, { status: 500 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    // Create platform-specific prompts
    const platformContext = {
      facebook: "Facebook posts and content",
      instagram: "Instagram photos, reels, and stories",
      twitter: "Twitter tweets and discussions",
      youtube: "YouTube videos and content",
    }

    const sentimentContext = {
      positive: "supportive, encouraging, praising, appreciative, enthusiastic, and uplifting",
      negative: "critical, disappointed, questioning, concerned, skeptical, and constructive criticism",
    }

    const prompt = `
Generate ${count} unique ${sentiment} comments for ${platform} content at URL: ${targetUrl}

Context: These comments are for ${platformContext[platform as keyof typeof platformContext]} and should be ${sentimentContext[sentiment as keyof typeof sentimentContext]}.

Requirements:
1. Each comment should be 10-50 words long
2. Use natural, conversational language
3. Make them feel authentic and human-written
4. Include relevant emojis (2-3 per comment)
5. Vary the tone and style
6. Make them platform-appropriate for ${platform}
7. Ensure they are ${sentiment} in sentiment
8. Avoid repetitive phrases
9. Include some comments with questions
10. Make some comments more detailed, others brief

Format: Return as a JSON array of strings, each string being one comment.

Example format:
["Comment 1 here 😊", "Comment 2 here 👍", "Comment 3 here 🔥"]

Generate exactly ${count} unique comments now:
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Try to parse the JSON response
    let comments: string[] = []
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        comments = JSON.parse(jsonMatch[0])
      } else {
        // Fallback: split by lines and clean up
        comments = text
          .split("\n")
          .filter((line) => line.trim() && !line.includes("```") && !line.includes("json"))
          .map((line) =>
            line
              .replace(/^\d+\.\s*/, "")
              .replace(/^[-*]\s*/, "")
              .trim(),
          )
          .filter((comment) => comment.length > 5)
          .slice(0, count)
      }
    } catch (parseError) {
      // Fallback parsing
      comments = text
        .split("\n")
        .filter((line) => line.trim() && line.length > 10)
        .map((line) =>
          line
            .replace(/^\d+\.\s*/, "")
            .replace(/^[-*]\s*/, "")
            .trim(),
        )
        .slice(0, count)
    }

    // Ensure we have the requested number of comments
    if (comments.length < count) {
      // Generate additional comments if needed
      const additionalCount = count - comments.length
      const additionalPrompt = `Generate ${additionalCount} more unique ${sentiment} comments for ${platform}, different from the previous ones. Format as JSON array.`

      try {
        const additionalResult = await model.generateContent(additionalPrompt)
        const additionalResponse = await additionalResult.response
        const additionalText = additionalResponse.text()

        const additionalJsonMatch = additionalText.match(/\[[\s\S]*\]/)
        if (additionalJsonMatch) {
          const additionalComments = JSON.parse(additionalJsonMatch[0])
          comments = [...comments, ...additionalComments]
        }
      } catch (error) {
        console.error("Error generating additional comments:", error)
      }
    }

    // Ensure we don't exceed the requested count
    comments = comments.slice(0, count)

    // Validate comments
    const validComments = comments.filter(
      (comment) => typeof comment === "string" && comment.length >= 5 && comment.length <= 200,
    )

    if (validComments.length === 0) {
      return NextResponse.json({ success: false, message: "Failed to generate valid comments" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      comments: validComments,
      count: validComments.length,
      platform,
      sentiment,
      targetUrl,
    })
  } catch (error) {
    console.error("Comment generation error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate comments",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
