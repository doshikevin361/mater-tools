import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export interface CommentGenerationOptions {
  postContent: string
  commentStyle: "engaging" | "supportive" | "question" | "compliment" | "casual"
  commentSentiment?: "positive" | "negative" | "neutral"
  platform: "instagram" | "facebook" | "twitter" | "youtube"
  maxLength?: number
}

export interface GeneratedComment {
  comment: string
  confidence: number
  style: string
  platform: string
}

// Platform-specific comment styles and constraints
const PLATFORM_CONSTRAINTS = {
  instagram: {
    maxLength: 2200,
    allowEmojis: true,
    allowHashtags: true,
    tone: "casual_friendly",
  },
  facebook: {
    maxLength: 8000,
    allowEmojis: true,
    allowHashtags: false,
    tone: "conversational",
  },
  twitter: {
    maxLength: 280,
    allowEmojis: true,
    allowHashtags: true,
    tone: "concise",
  },
  youtube: {
    maxLength: 10000,
    allowEmojis: true,
    allowHashtags: false,
    tone: "detailed",
  },
}

// Comment style prompts
const COMMENT_PROMPTS = {
  engaging: {
    instagram:
      "Create an engaging Instagram comment that sparks conversation. Use 1-2 relevant emojis and keep it authentic and friendly.",
    facebook: "Write an engaging Facebook comment that encourages discussion. Be conversational and genuine.",
    twitter: "Create a witty, engaging Twitter reply that fits the character limit. Be concise but impactful.",
    youtube: "Write an engaging YouTube comment that adds value to the discussion. Be thoughtful and constructive.",
  },
  supportive: {
    instagram:
      "Write a supportive and encouraging Instagram comment. Be positive and uplifting with appropriate emojis.",
    facebook: "Create a supportive Facebook comment that shows genuine care and encouragement.",
    twitter: "Write a brief but supportive Twitter reply that uplifts the original poster.",
    youtube: "Create a supportive YouTube comment that encourages the creator and shows appreciation.",
  },
  question: {
    instagram: "Ask a thoughtful question in an Instagram comment that encourages the poster to engage back.",
    facebook: "Write a Facebook comment with a genuine question that sparks meaningful discussion.",
    twitter: "Ask a concise, thought-provoking question in a Twitter reply.",
    youtube: "Ask an insightful question in a YouTube comment that relates to the video content.",
  },
  compliment: {
    instagram: "Write a genuine compliment for this Instagram post. Be specific and authentic.",
    facebook: "Give a sincere compliment in a Facebook comment. Be specific about what you appreciate.",
    twitter: "Write a brief but genuine compliment in a Twitter reply.",
    youtube: "Compliment the YouTube creator on their content. Be specific about what you enjoyed.",
  },
  casual: {
    instagram: "Write a casual, natural Instagram comment like a friend would. Use emojis appropriately.",
    facebook: "Create a casual, friendly Facebook comment using natural language.",
    twitter: "Write a casual Twitter reply that sounds natural and conversational.",
    youtube: "Leave a casual YouTube comment that feels genuine and relatable.",
  },
}

// Sentiment-specific prompt modifiers
const SENTIMENT_MODIFIERS = {
  positive: {
    instagram: "Make the comment positive, uplifting, and encouraging. Use positive emojis and supportive language.",
    facebook: "Write a positive, supportive comment that shows appreciation and encouragement.",
    twitter: "Create a positive, uplifting reply that shows support and enthusiasm.",
    youtube: "Write a positive comment that shows appreciation for the content and encourages the creator.",
  },
  negative: {
    instagram:
      "Write a constructive criticism or questioning comment. Be respectful but point out concerns or ask challenging questions.",
    facebook: "Create a respectful but critical comment that raises valid concerns or questions about the content.",
    twitter:
      "Write a respectful disagreement or constructive criticism. Keep it civil but express different viewpoint.",
    youtube:
      "Provide constructive feedback or criticism about the video content. Be respectful but honest about concerns.",
  },
  neutral: {
    instagram:
      "Write a balanced, informative comment that's neither overly positive nor negative. Be objective and factual.",
    facebook: "Create a neutral, informative comment that adds value without being overly emotional.",
    twitter: "Write an objective, balanced reply that provides information or perspective without strong emotion.",
    youtube: "Leave a neutral, informative comment that discusses the content objectively.",
  },
}

// Fallback comments by platform and style
const FALLBACK_COMMENTS = {
  instagram: {
    engaging: ["Love this! 😍", "This is amazing! ✨", "So inspiring! 🔥", "Absolutely beautiful! 💕"],
    supportive: ["You've got this! 💪", "Keep shining! ✨", "So proud of you! ❤️", "Amazing work! 🙌"],
    question: ["How did you do this?", "What inspired this?", "Any tips to share?", "Where was this taken?"],
    compliment: ["Gorgeous! 😍", "Perfect shot! 📸", "Love your style! ✨", "So talented! 🎨"],
    casual: ["Nice! 👍", "Cool! 😎", "Awesome! 🔥", "Love it! ❤️"],
  },
  facebook: {
    engaging: [
      "This is fantastic! Thanks for sharing.",
      "Really interesting perspective!",
      "Love seeing content like this!",
      "This made my day!",
    ],
    supportive: ["You're doing amazing!", "Keep up the great work!", "So inspiring to see this!", "Proud of you!"],
    question: ["What's your take on this?", "How did you get started?", "Any advice for beginners?", "What's next?"],
    compliment: ["Excellent work!", "Really well done!", "You have great taste!", "This is beautiful!"],
    casual: ["Nice post!", "Thanks for sharing!", "Good stuff!", "Appreciate this!"],
  },
  twitter: {
    engaging: ["This! 🔥", "💯", "So true! ✨", "Love this! 👏"],
    supportive: ["You've got this! 💪", "Keep going! 🚀", "Proud of you! ❤️", "Amazing! 🙌"],
    question: ["Thoughts?", "How so?", "What's your take?", "Any tips?"],
    compliment: ["Well said! 👏", "Great point! 💯", "Love this! ✨", "Brilliant! 🔥"],
    casual: ["Nice! 👍", "Cool! 😎", "True! ✅", "Same! 🤝"],
  },
  youtube: {
    engaging: [
      "Great video! Really enjoyed watching this.",
      "This was so helpful, thank you!",
      "Amazing content as always!",
      "Love your videos!",
    ],
    supportive: [
      "Keep up the amazing work!",
      "You're doing great!",
      "Thanks for all your hard work!",
      "Appreciate your content!",
    ],
    question: [
      "Could you make a video about...?",
      "What equipment do you use?",
      "How long did this take?",
      "Any tutorials coming?",
    ],
    compliment: [
      "Excellent video quality!",
      "Great editing!",
      "Love your presentation style!",
      "Really well explained!",
    ],
    casual: ["Nice video!", "Thanks for sharing!", "Good stuff!", "Enjoyed this!"],
  },
}

export class GeminiCommentService {
  private model: any

  constructor() {
    this.model = genAI.getGenerativeModel({ model: "gemini-pro" })
  }

  async generateComment(options: CommentGenerationOptions): Promise<GeneratedComment> {
    try {
      const { postContent, commentStyle, commentSentiment = "positive", platform, maxLength } = options
      const constraints = PLATFORM_CONSTRAINTS[platform]
      const effectiveMaxLength = maxLength || constraints.maxLength

      // Get platform and style specific prompt
      const basePrompt = COMMENT_PROMPTS[commentStyle][platform]

      // Get sentiment modifier
      const sentimentModifier = SENTIMENT_MODIFIERS[commentSentiment][platform]

      // Create comprehensive prompt
      const prompt = `
${basePrompt}

${sentimentModifier}

Post content: "${postContent}"

Requirements:
- Maximum ${effectiveMaxLength} characters
- Platform: ${platform}
- Style: ${commentStyle}
- Sentiment: ${commentSentiment}
- ${constraints.allowEmojis ? "Use appropriate emojis" : "no emojis"}
- ${constraints.allowHashtags ? "Hashtags allowed if relevant" : "no hashtags"}
- Tone: ${constraints.tone}
- Be authentic and natural
- ${commentSentiment === "negative" ? "Be respectful even when critical" : ""}
- ${commentSentiment === "positive" ? "Be genuinely supportive and encouraging" : ""}
- ${commentSentiment === "neutral" ? "Be balanced and objective" : ""}
- Make it feel human-written

Generate only the comment text, nothing else.
`

      console.log(`Generating ${commentSentiment} ${commentStyle} comment for ${platform}...`)

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      let comment = response.text().trim()

      // Clean up the comment
      comment = this.cleanComment(comment, platform, effectiveMaxLength)

      // Validate comment quality
      const confidence = this.calculateConfidence(comment, postContent, commentStyle, commentSentiment)

      console.log(`Generated comment: "${comment}" (confidence: ${confidence})`)

      return {
        comment,
        confidence,
        style: commentStyle,
        platform,
      }
    } catch (error) {
      console.error(`Gemini comment generation failed: ${error.message}`)

      // Return fallback comment based on sentiment
      const fallbackComment = this.getFallbackComment(options.platform, options.commentStyle, options.commentSentiment)

      return {
        comment: fallbackComment,
        confidence: 0.5,
        style: options.commentStyle,
        platform: options.platform,
      }
    }
  }

  private cleanComment(comment: string, platform: string, maxLength: number): string {
    // Remove quotes if present
    comment = comment.replace(/^["']|["']$/g, "")

    // Remove line breaks and extra spaces
    comment = comment.replace(/\n+/g, " ").replace(/\s+/g, " ").trim()

    // Ensure it's not too long
    if (comment.length > maxLength) {
      // Try to cut at a word boundary
      const truncated = comment.substring(0, maxLength - 3)
      const lastSpace = truncated.lastIndexOf(" ")

      if (lastSpace > maxLength * 0.8) {
        comment = truncated.substring(0, lastSpace) + "..."
      } else {
        comment = truncated + "..."
      }
    }

    // Platform-specific cleaning
    if (platform === "twitter" && comment.length > 280) {
      comment = comment.substring(0, 277) + "..."
    }

    return comment
  }

  private calculateConfidence(comment: string, postContent: string, style: string, sentiment?: string): number {
    let confidence = 0.7 // Base confidence

    // Check length appropriateness
    if (comment.length > 10 && comment.length < 500) {
      confidence += 0.1
    }

    // Check for style appropriateness
    if (style === "question" && comment.includes("?")) {
      confidence += 0.1
    }

    if (
      style === "supportive" &&
      (comment.toLowerCase().includes("great") ||
        comment.toLowerCase().includes("amazing") ||
        comment.toLowerCase().includes("love"))
    ) {
      confidence += 0.1
    }

    // Check sentiment appropriateness
    if (sentiment === "positive") {
      const positiveWords = ["great", "amazing", "love", "awesome", "fantastic", "wonderful", "excellent"]
      if (positiveWords.some((word) => comment.toLowerCase().includes(word))) {
        confidence += 0.1
      }
    }

    if (sentiment === "negative") {
      const criticalWords = ["however", "but", "concern", "issue", "problem", "disagree", "question"]
      if (criticalWords.some((word) => comment.toLowerCase().includes(word))) {
        confidence += 0.1
      }
    }

    // Check for spam indicators (reduce confidence)
    const spamWords = ["buy", "sale", "discount", "click here", "follow me", "check out my"]
    if (spamWords.some((word) => comment.toLowerCase().includes(word))) {
      confidence -= 0.3
    }

    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, confidence))
  }

  private getFallbackComment(platform: string, style: string, sentiment = "positive"): string {
    // Sentiment-specific fallback comments
    const sentimentFallbacks = {
      positive: FALLBACK_COMMENTS,
      negative: {
        instagram: {
          engaging: [
            "Interesting perspective, but what about...?",
            "I see your point, however...",
            "Not sure I agree with this approach 🤔",
          ],
          supportive: ["This could be improved by...", "Have you considered...?", "Maybe try a different approach?"],
          question: [
            "Why did you choose this method?",
            "What's the reasoning behind this?",
            "How do you address the concerns about...?",
          ],
          compliment: [
            "Good effort, but could be better",
            "Nice try, room for improvement",
            "Decent work, needs refinement",
          ],
          casual: ["Hmm, not convinced", "Could be better", "Questionable choice"],
        },
        facebook: {
          engaging: [
            "I have to disagree with this approach",
            "This raises some concerns",
            "Not sure this is the right way",
          ],
          supportive: [
            "This could use some improvement",
            "Consider revising this approach",
            "Maybe rethink this strategy",
          ],
          question: ["Why this particular approach?", "What about the downsides?", "How do you address the criticism?"],
          compliment: ["Good attempt, needs work", "Decent effort, could improve", "Nice try, but missing something"],
          casual: ["Not buying it", "Seems off", "Questionable"],
        },
        twitter: {
          engaging: ["Disagree with this take", "This seems problematic", "Not convinced by this"],
          supportive: ["Could be better", "Needs improvement", "Missing the mark"],
          question: ["Why though?", "Source?", "How so?"],
          compliment: ["Meh", "Could be better", "Not impressed"],
          casual: ["Nah", "Disagree", "Not it"],
        },
        youtube: {
          engaging: [
            "I have to disagree with some points made here",
            "This video raises some concerns",
            "Not sure about this approach",
          ],
          supportive: [
            "The content could be improved",
            "Consider addressing these issues",
            "Maybe revise this approach",
          ],
          question: [
            "Why did you choose this method?",
            "What about the counterarguments?",
            "How do you respond to criticism?",
          ],
          compliment: ["Good effort but needs work", "Decent video, could improve", "Nice try, missing some points"],
          casual: ["Not convinced by this", "Seems questionable", "Could be better"],
        },
      },
      neutral: {
        instagram: {
          engaging: ["Interesting content", "Thanks for sharing", "Good to know", "Noted"],
          supportive: ["Informative post", "Useful information", "Good point", "Fair enough"],
          question: ["What's your source?", "Any data on this?", "How was this measured?", "What's the context?"],
          compliment: ["Well presented", "Clear information", "Good format", "Informative"],
          casual: ["Okay", "I see", "Fair point", "Noted"],
        },
        facebook: {
          engaging: [
            "Interesting perspective shared here",
            "Thanks for the information",
            "Good to be aware of this",
            "Noted for reference",
          ],
          supportive: ["Informative post", "Useful to know", "Good information", "Fair point made"],
          question: [
            "What's the source for this?",
            "Any supporting data?",
            "How was this determined?",
            "What's the full context?",
          ],
          compliment: ["Well presented information", "Clear and informative", "Good format", "Informative content"],
          casual: ["Understood", "I see", "Fair enough", "Noted"],
        },
        twitter: {
          engaging: ["Interesting", "Noted", "Fair point", "I see"],
          supportive: ["Informative", "Good to know", "Fair enough", "Understood"],
          question: ["Source?", "Data?", "Context?", "How so?"],
          compliment: ["Well said", "Clear", "Informative", "Fair"],
          casual: ["OK", "I see", "Fair", "Noted"],
        },
        youtube: {
          engaging: [
            "Interesting video content",
            "Thanks for the information",
            "Good to know about this",
            "Informative content",
          ],
          supportive: ["Informative video", "Useful information shared", "Good points made", "Fair presentation"],
          question: [
            "What's your source for this?",
            "Any supporting research?",
            "How was this tested?",
            "What's the methodology?",
          ],
          compliment: ["Well presented video", "Clear explanation", "Good production quality", "Informative content"],
          casual: ["Understood", "I see", "Fair enough", "Noted"],
        },
      },
    }

    const platformFallbacks = sentimentFallbacks[sentiment as keyof typeof sentimentFallbacks][platform]
    const styleFallbacks = platformFallbacks[style as keyof typeof platformFallbacks]

    // Return random fallback comment
    return styleFallbacks[Math.floor(Math.random() * styleFallbacks.length)]
  }

  async generateMultipleComments(options: CommentGenerationOptions, count = 3): Promise<GeneratedComment[]> {
    const comments: GeneratedComment[] = []

    for (let i = 0; i < count; i++) {
      try {
        const comment = await this.generateComment(options)
        comments.push(comment)

        // Small delay between generations
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Failed to generate comment ${i + 1}:`, error)
      }
    }

    return comments
  }

  // Analyze post content to suggest best comment style
  async suggestCommentStyle(postContent: string, platform: string): Promise<string> {
    try {
      const prompt = `
Analyze this social media post and suggest the best comment style from these options:
- engaging: For posts that need conversation starters
- supportive: For personal achievements, struggles, or milestones  
- question: For posts that could benefit from thoughtful questions
- compliment: For creative work, photos, or accomplishments
- casual: For everyday posts that need simple, friendly responses

Post content: "${postContent}"
Platform: ${platform}

Respond with only one word: the best style option.
`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const suggestion = response.text().trim().toLowerCase()

      // Validate suggestion
      const validStyles = ["engaging", "supportive", "question", "compliment", "casual"]
      if (validStyles.includes(suggestion)) {
        return suggestion
      }

      // Default fallback
      return "engaging"
    } catch (error) {
      console.error("Failed to suggest comment style:", error)
      return "engaging" // Default fallback
    }
  }
}

// Export singleton instance
export const geminiCommentService = new GeminiCommentService()
