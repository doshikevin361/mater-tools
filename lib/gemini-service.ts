import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// Platform-specific comment constraints
const PLATFORM_CONSTRAINTS = {
  instagram: {
    maxLength: 2200,
    style: "casual, emoji-friendly, hashtag-aware",
    tone: "visual-focused, engaging, community-oriented",
  },
  facebook: {
    maxLength: 8000,
    style: "conversational, detailed, personal",
    tone: "friendly, thoughtful, discussion-oriented",
  },
  twitter: {
    maxLength: 280,
    style: "concise, witty, trending-aware",
    tone: "quick, clever, conversation-starting",
  },
  youtube: {
    maxLength: 10000,
    style: "detailed, constructive, video-focused",
    tone: "helpful, appreciative, content-specific",
  },
}

// Comment style templates
const COMMENT_STYLES = {
  engaging: {
    prompt: "Create an engaging, conversation-starting comment that encourages interaction",
    examples: [
      "This is so inspiring! What motivated you to start this journey?",
      "Love this perspective! Have you considered...?",
    ],
  },
  supportive: {
    prompt: "Write a supportive, encouraging comment that uplifts the creator",
    examples: ["You're doing amazing work! Keep it up!", "This really resonates with me. Thank you for sharing!"],
  },
  question: {
    prompt: "Ask a thoughtful, relevant question that shows genuine interest",
    examples: ["What's your biggest tip for beginners?", "How long did this take you to master?"],
  },
  compliment: {
    prompt: "Give a genuine, specific compliment about the content",
    examples: ["The attention to detail here is incredible!", "Your creativity never fails to amaze me!"],
  },
  casual: {
    prompt: "Write a casual, natural comment like a friend would make",
    examples: ["This is so cool!", "Totally agree with this!", "Thanks for sharing this!"],
  },
}

// Fallback comments for each platform and style
const FALLBACK_COMMENTS = {
  instagram: {
    engaging: [
      "This is amazing! 🔥 What inspired this?",
      "Love this content! 💯 More please!",
      "So good! 😍 How did you do this?",
    ],
    supportive: ["You're crushing it! 💪", "Keep shining! ✨", "This made my day! 🌟"],
    question: ["What's your secret? 🤔", "Any tips for beginners? 💭", "How long did this take? ⏰"],
    compliment: ["Absolutely stunning! 😍", "Pure talent! 🎨", "This is perfection! 👌"],
    casual: ["So cool! 😎", "Love it! ❤️", "Amazing work! 🙌"],
  },
  facebook: {
    engaging: [
      "This really got me thinking! What's your take on this?",
      "Great post! I'd love to hear more about your experience with this.",
      "This is so relevant right now. Thanks for sharing your perspective!",
    ],
    supportive: [
      "Thank you for sharing this! It's exactly what I needed to hear today.",
      "Your posts always inspire me to be better. Keep up the amazing work!",
      "This is so encouraging! I appreciate you taking the time to share this.",
    ],
    question: [
      "I'm curious about your process - how do you approach this?",
      "What would you recommend for someone just starting out?",
      "Have you always felt this way, or did something change your perspective?",
    ],
    compliment: [
      "The way you explain things is so clear and helpful!",
      "I always learn something new from your posts.",
      "Your insights are always so thoughtful and well-articulated.",
    ],
    casual: [
      "This is great! Thanks for sharing.",
      "Totally agree with this!",
      "Love seeing posts like this on my feed!",
    ],
  },
  twitter: {
    engaging: ["This! 🔥 What's your take?", "So true! Anyone else relate?", "This hits different 💯"],
    supportive: ["You got this! 💪", "Keep going! 🚀", "Proud of you! ✨"],
    question: ["How do you do it? 🤔", "What's the secret? 👀", "Tips? 💭"],
    compliment: ["Pure genius! 🧠", "This is it! 👏", "Nailed it! 🎯"],
    casual: ["Facts! 💯", "This! 🙌", "So good! 🔥"],
  },
  youtube: {
    engaging: [
      "This video really opened my eyes! What other topics are you planning to cover?",
      "Great content as always! I'd love to see a follow-up video on this topic.",
      "This was so helpful! Have you considered doing a series on this?",
    ],
    supportive: [
      "Thank you for making such high-quality content! Your hard work really shows.",
      "I always look forward to your videos. Keep up the fantastic work!",
      "This channel has become one of my favorites. Thank you for all you do!",
    ],
    question: [
      "What software do you use for editing? The quality is amazing!",
      "How long did it take you to research and create this video?",
      "Do you have any book recommendations on this topic?",
    ],
    compliment: [
      "The production quality of your videos keeps getting better and better!",
      "Your explanation style is so clear and easy to follow.",
      "The way you break down complex topics is really impressive.",
    ],
    casual: [
      "Great video! Thanks for sharing this.",
      "This was really interesting to watch!",
      "Love the content! Keep it coming!",
    ],
  },
}

// Generate AI comment using Gemini
export async function generateComment(postContent: string, platform: string, style = "engaging"): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const constraints = PLATFORM_CONSTRAINTS[platform as keyof typeof PLATFORM_CONSTRAINTS]
    const styleConfig = COMMENT_STYLES[style as keyof typeof COMMENT_STYLES]

    if (!constraints || !styleConfig) {
      throw new Error("Invalid platform or style")
    }

    const prompt = `
You are an AI assistant that generates natural, human-like social media comments.

PLATFORM: ${platform.toUpperCase()}
STYLE: ${style}
MAX LENGTH: ${constraints.maxLength} characters
PLATFORM STYLE: ${constraints.style}
TONE: ${constraints.tone}

TASK: ${styleConfig.prompt}

POST CONTENT TO COMMENT ON:
"${postContent}"

REQUIREMENTS:
1. Write a ${style} comment that feels natural and human
2. Keep it under ${constraints.maxLength} characters
3. Match the ${platform} platform style: ${constraints.style}
4. Use a ${constraints.tone} tone
5. Be relevant to the post content
6. Avoid generic responses
7. ${platform === "instagram" ? "Include 1-2 relevant emojis" : ""}
8. ${platform === "twitter" ? "Be concise and impactful" : ""}
9. ${platform === "youtube" ? "Reference the video content specifically" : ""}
10. ${platform === "facebook" ? "Encourage discussion" : ""}

EXAMPLES OF GOOD ${style.toUpperCase()} COMMENTS:
${styleConfig.examples.join("\n")}

Generate ONE comment only. Do not include quotes or explanations.
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let comment = response.text().trim()

    // Remove quotes if present
    comment = comment.replace(/^["']|["']$/g, "")

    // Ensure length constraints
    if (comment.length > constraints.maxLength) {
      comment = comment.substring(0, constraints.maxLength - 3) + "..."
    }

    // Validate comment quality
    if (comment.length < 10 || comment.toLowerCase().includes("as an ai")) {
      throw new Error("Generated comment quality too low")
    }

    return comment
  } catch (error) {
    console.error("Gemini comment generation error:", error)

    // Return fallback comment
    const fallbacks = FALLBACK_COMMENTS[platform as keyof typeof FALLBACK_COMMENTS]
    if (fallbacks && fallbacks[style as keyof typeof fallbacks]) {
      const styleComments = fallbacks[style as keyof typeof fallbacks]
      return styleComments[Math.floor(Math.random() * styleComments.length)]
    }

    // Ultimate fallback
    return "Great content! 👍"
  }
}

// Validate and score comment quality
export function scoreComment(comment: string, platform: string): number {
  let score = 0

  // Length check
  const constraints = PLATFORM_CONSTRAINTS[platform as keyof typeof PLATFORM_CONSTRAINTS]
  if (comment.length >= 10 && comment.length <= constraints.maxLength) {
    score += 30
  }

  // Engagement indicators
  if (comment.includes("?")) score += 20 // Questions encourage engagement
  if (comment.match(/[!]{1,2}/)) score += 10 // Enthusiasm
  if (
    platform === "instagram" &&
    comment.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u)
  ) {
    score += 15 // Emojis for Instagram
  }

  // Avoid generic responses
  const genericPhrases = ["nice", "good", "great post", "awesome", "cool"]
  const isGeneric = genericPhrases.some((phrase) => comment.toLowerCase().includes(phrase))
  if (!isGeneric) score += 25

  return Math.min(score, 100)
}

// Get platform-specific comment suggestions
export function getCommentSuggestions(platform: string, style: string): string[] {
  const fallbacks = FALLBACK_COMMENTS[platform as keyof typeof FALLBACK_COMMENTS]
  if (fallbacks && fallbacks[style as keyof typeof fallbacks]) {
    return fallbacks[style as keyof typeof fallbacks]
  }
  return ["Great content!", "Thanks for sharing!", "Love this!"]
}
