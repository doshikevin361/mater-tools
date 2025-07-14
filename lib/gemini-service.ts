import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyDXYs8TsJP4g8yF62tVHzHeeGtYDiGXNX4")

interface CommentRequest {
  postContent: string
  platform: string
  style: string
  sentiment: "positive" | "negative" | "neutral"
}

interface CommentResponse {
  comment: string
  confidence: number
}

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
    positive: {
      engaging: "Love this! 😍 What inspired you to create this?",
      supportive: "This is amazing! Keep up the great work! 💪",
      question: "This looks incredible! How long did this take? 🤔",
      compliment: "Absolutely beautiful! You're so talented! ✨",
      casual: "This is so cool! 😊",
    },
    negative: {
      engaging: "Interesting perspective. Have you considered this angle? 🤔",
      supportive: "Good effort! Maybe try this approach next time?",
      question: "What made you choose this particular method?",
      compliment: "I appreciate the effort, though I'd love to see more of X",
      casual: "Not bad, but could use some work 😅",
    },
    neutral: {
      engaging: "Thanks for sharing this. What's your take on it?",
      supportive: "Informative post. Thanks for the insights.",
      question: "Can you elaborate on this point?",
      compliment: "Well-presented information.",
      casual: "Interesting stuff 👍",
    },
  },
  facebook: {
    positive: {
      engaging: "This is fantastic! I'd love to hear more about your experience with this.",
      supportive: "You're doing amazing work! This really resonates with me.",
      question: "This is really interesting! What got you started with this?",
      compliment: "Incredible post! Your insights are always so valuable.",
      casual: "Love this! Thanks for sharing your thoughts.",
    },
    negative: {
      engaging: "I see your point, but have you considered the other side of this?",
      supportive: "Good attempt, though I think there might be room for improvement here.",
      question: "What evidence supports this particular viewpoint?",
      compliment: "I see the effort, though I'd suggest looking into X as well.",
      casual: "Hmm, not sure I agree with this one.",
    },
    neutral: {
      engaging: "Thanks for sharing. Thoughts on the broader implications?",
      supportive: "Informative post. Appreciate you taking the time to share this.",
      question: "Can you provide more context on this topic?",
      compliment: "Well-researched and clearly presented.",
      casual: "Interesting perspective 👍",
    },
  },
  twitter: {
    positive: {
      engaging: "This is gold! 🔥 What's your next move?",
      supportive: "Absolutely love this! You're crushing it! 💪",
      question: "This is brilliant! How did you figure this out? 🤔",
      compliment: "Pure genius! Your content is always top-tier! ⭐",
      casual: "This hits different! 😎",
    },
    negative: {
      engaging: "Interesting take, but what about this counterpoint? 🤔",
      supportive: "Good effort, though I'd suggest considering X as well.",
      question: "What data backs up this claim?",
      compliment: "I see the effort, but maybe explore Y angle too?",
      casual: "Eh, not convinced on this one 🤷‍♂️",
    },
    neutral: {
      engaging: "Thanks for sharing. Thoughts on the broader implications?",
      supportive: "Informative thread. Appreciate you taking the time to share this.",
      question: "Can you elaborate on this point?",
      compliment: "Well-presented information.",
      casual: "Interesting perspective 👍",
    },
  },
  youtube: {
    positive: {
      engaging: "Fantastic video! This really opened my eyes. What's your take on the future of this topic?",
      supportive: "Amazing content as always! Your explanations make complex topics so easy to understand. Keep it up!",
      question: "Great video! I'm curious about one thing - how did you first get interested in this subject?",
      compliment:
        "Incredible work! The production quality and content depth are both outstanding. You're truly talented!",
      casual: "Love this video! Really enjoyed watching it. Thanks for the great content!",
    },
    negative: {
      engaging:
        "Interesting video, though I think there might be some missing context. Have you considered addressing X?",
      supportive: "Good effort on this video! I'd suggest maybe exploring the counterarguments as well for balance.",
      question: "What sources did you use for this information? I'd love to fact-check some of these claims.",
      compliment: "I appreciate the work that went into this, though I feel like some important points were missed.",
      casual: "Not bad, but I think you could have gone deeper on some topics.",
    },
    neutral: {
      engaging: "Thanks for the video. What are your thoughts on how this applies to different contexts?",
      supportive: "Informative content. Appreciate you taking the time to research and present this.",
      question: "Can you provide more details on the methodology you mentioned?",
      compliment: "Well-structured video with clear explanations.",
      casual: "Interesting topic. Thanks for covering it.",
    },
  },
}

class GeminiCommentService {
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

class GeminiService {
  private apiKey: string
  private baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || "AIzaSyDXYs8TsJP4g8yF62tVHzHeeGtYDiGXNX4"
    if (!this.apiKey) {
      console.warn("GEMINI_API_KEY not found in environment variables")
    }
  }

  private getPlatformPrompt(platform: string, sentiment: string): string {
    const sentimentContext = {
      positive: "supportive, encouraging, and uplifting",
      negative: "constructively critical, questioning, or providing respectful feedback",
      neutral: "balanced, informative, and objective",
    }

    const basePrompts = {
      instagram: `Generate a ${sentimentContext[sentiment as keyof typeof sentimentContext]} Instagram comment that is casual, engaging, and uses appropriate emojis. Keep it under 150 characters and make it feel natural and authentic.`,

      facebook: `Create a ${sentimentContext[sentiment as keyof typeof sentimentContext]} Facebook comment that is conversational and thoughtful. It can be longer than other platforms (up to 200 characters) and should encourage discussion.`,

      twitter: `Write a ${sentimentContext[sentiment as keyof typeof sentimentContext]} Twitter reply that is concise, witty, and under 280 characters. Make it engaging and shareable.`,

      youtube: `Compose a ${sentimentContext[sentiment as keyof typeof sentimentContext]} YouTube comment that is detailed and constructive. It can be longer (up to 300 characters) and should add value to the video discussion.`,
    }

    return basePrompts[platform as keyof typeof basePrompts] || basePrompts.instagram
  }

  private getStyleModifier(style: string): string {
    const styleModifiers = {
      engaging: "Make it conversation-starting and interactive, encouraging responses.",
      supportive: "Make it encouraging, positive, and uplifting to boost the creator's morale.",
      question: "Frame it as a thoughtful question that sparks discussion and engagement.",
      compliment: "Focus on genuine praise and appreciation for the content or creator.",
      casual: "Keep it natural and friendly, like a comment from a close friend.",
    }

    return styleModifiers[style as keyof typeof styleModifiers] || styleModifiers.engaging
  }

  private getFallbackComment(platform: string, style: string, sentiment: string): string {
    const fallbacks = {
      instagram: {
        positive: {
          engaging: "Love this! 😍 What inspired you to create this?",
          supportive: "This is amazing! Keep up the great work! 💪",
          question: "This looks incredible! How long did this take? 🤔",
          compliment: "Absolutely beautiful! You're so talented! ✨",
          casual: "This is so cool! 😊",
        },
        negative: {
          engaging: "Interesting perspective. Have you considered this angle? 🤔",
          supportive: "Good effort! Maybe try this approach next time?",
          question: "What made you choose this particular method?",
          compliment: "I appreciate the effort, though I'd love to see more of X",
          casual: "Not bad, but could use some work 😅",
        },
        neutral: {
          engaging: "Thanks for sharing this. What's your take on it?",
          supportive: "Informative post. Thanks for the insights.",
          question: "Can you elaborate on this point?",
          compliment: "Well-presented information.",
          casual: "Interesting stuff 👍",
        },
      },
      facebook: {
        positive: {
          engaging: "This is fantastic! I'd love to hear more about your experience with this.",
          supportive: "You're doing amazing work! This really resonates with me.",
          question: "This is really interesting! What got you started with this?",
          compliment: "Incredible post! Your insights are always so valuable.",
          casual: "Love this! Thanks for sharing your thoughts.",
        },
        negative: {
          engaging: "I see your point, but have you considered the other side of this?",
          supportive: "Good attempt, though I think there might be room for improvement here.",
          question: "What evidence supports this particular viewpoint?",
          compliment: "I see the effort, though I'd suggest looking into X as well.",
          casual: "Hmm, not sure I agree with this one.",
        },
        neutral: {
          engaging: "Thanks for sharing. Thoughts on the broader implications?",
          supportive: "Informative post. Appreciate you taking the time to share this.",
          question: "Can you provide more context on this topic?",
          compliment: "Well-researched and clearly presented.",
          casual: "Interesting perspective 👍",
        },
      },
      twitter: {
        positive: {
          engaging: "This is gold! 🔥 What's your next move?",
          supportive: "Absolutely love this! You're crushing it! 💪",
          question: "This is brilliant! How did you figure this out? 🤔",
          compliment: "Pure genius! Your content is always top-tier! ⭐",
          casual: "This hits different! 😎",
        },
        negative: {
          engaging: "Interesting take, but what about this counterpoint? 🤔",
          supportive: "Good effort, though I'd suggest considering X as well.",
          question: "What data backs up this claim?",
          compliment: "I see the effort, but maybe explore Y angle too?",
          casual: "Eh, not convinced on this one 🤷‍♂️",
        },
        neutral: {
          engaging: "Thanks for sharing. Thoughts on the broader implications?",
          supportive: "Informative thread. Appreciate you taking the time to share this.",
          question: "Can you elaborate on this point?",
          compliment: "Well-presented information.",
          casual: "Interesting perspective 👍",
        },
      },
      youtube: {
        positive: {
          engaging: "Fantastic video! This really opened my eyes. What's your take on the future of this topic?",
          supportive:
            "Amazing content as always! Your explanations make complex topics so easy to understand. Keep it up!",
          question: "Great video! I'm curious about one thing - how did you first get interested in this subject?",
          compliment:
            "Incredible work! The production quality and content depth are both outstanding. You're truly talented!",
          casual: "Love this video! Really enjoyed watching it. Thanks for the great content!",
        },
        negative: {
          engaging:
            "Interesting video, though I think there might be some missing context. Have you considered addressing X?",
          supportive:
            "Good effort on this video! I'd suggest maybe exploring the counterarguments as well for balance.",
          question: "What sources did you use for this information? I'd love to fact-check some of these claims.",
          compliment:
            "I appreciate the work that went into this, though I feel like some important points were missed.",
          casual: "Not bad, but I think you could have gone deeper on some topics.",
        },
        neutral: {
          engaging: "Thanks for the video. What are your thoughts on how this applies to different contexts?",
          supportive: "Informative content. Appreciate you taking the time to research and present this.",
          question: "Can you provide more details on the methodology you mentioned?",
          compliment: "Well-structured video with clear explanations.",
          casual: "Interesting topic. Thanks for covering it.",
        },
      },
    }

    return (
      fallbacks[platform as keyof typeof fallbacks]?.[sentiment as keyof typeof fallbacks.instagram]?.[
        style as keyof typeof fallbacks.instagram.positive
      ] || "Thanks for sharing! 👍"
    )
  }

  async generateComment(request: CommentRequest): Promise<CommentResponse> {
    try {
      if (!this.apiKey) {
        // Return fallback comment if no API key
        return {
          comment: this.getFallbackComment(request.platform, request.style, request.sentiment),
          confidence: 0.7,
        }
      }

      const platformPrompt = this.getPlatformPrompt(request.platform, request.sentiment)
      const styleModifier = this.getStyleModifier(request.style)

      const prompt = `${platformPrompt} ${styleModifier}

Post content: "${request.postContent}"

Requirements:
- Be authentic and natural
- Match the ${request.sentiment} sentiment
- Use appropriate tone for ${request.platform}
- ${request.style} style
- No hashtags unless specifically for Instagram
- Keep it concise and engaging
- Avoid generic responses

Generate only the comment text, nothing else.`

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 200,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const generatedComment = data.candidates[0].content.parts[0].text.trim()

        // Validate comment quality
        const confidence = this.calculateConfidence(generatedComment, request)

        return {
          comment: generatedComment,
          confidence,
        }
      } else {
        throw new Error("Invalid response from Gemini API")
      }
    } catch (error) {
      console.error("Error generating comment with Gemini:", error)

      // Return fallback comment on error
      return {
        comment: this.getFallbackComment(request.platform, request.style, request.sentiment),
        confidence: 0.6,
      }
    }
  }

  private calculateConfidence(comment: string, request: CommentRequest): number {
    let confidence = 0.8 // Base confidence

    // Check length appropriateness
    const lengthLimits = {
      instagram: 150,
      facebook: 200,
      twitter: 280,
      youtube: 300,
    }

    const maxLength = lengthLimits[request.platform as keyof typeof lengthLimits] || 150
    if (comment.length > maxLength) {
      confidence -= 0.2
    }

    // Check for platform-appropriate elements
    if (
      request.platform === "instagram" &&
      !comment.includes("😊") &&
      !comment.includes("❤️") &&
      !comment.includes("🔥")
    ) {
      // Instagram comments often have emojis
      confidence -= 0.1
    }

    // Check sentiment alignment
    const positiveWords = ["love", "amazing", "great", "awesome", "fantastic", "incredible"]
    const negativeWords = ["but", "however", "though", "consider", "maybe", "could"]
    const neutralWords = ["thanks", "interesting", "informative", "appreciate"]

    const commentLower = comment.toLowerCase()

    if (request.sentiment === "positive" && positiveWords.some((word) => commentLower.includes(word))) {
      confidence += 0.1
    } else if (request.sentiment === "negative" && negativeWords.some((word) => commentLower.includes(word))) {
      confidence += 0.1
    } else if (request.sentiment === "neutral" && neutralWords.some((word) => commentLower.includes(word))) {
      confidence += 0.1
    }

    return Math.min(confidence, 1.0)
  }

  async generateMultipleComments(request: CommentRequest, count = 3): Promise<CommentResponse[]> {
    const comments: CommentResponse[] = []

    for (let i = 0; i < count; i++) {
      try {
        const comment = await this.generateComment(request)
        comments.push(comment)

        // Add small delay between requests to avoid rate limiting
        if (i < count - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.error(`Error generating comment ${i + 1}:`, error)
        // Add fallback comment
        comments.push({
          comment: this.getFallbackComment(request.platform, request.style, request.sentiment),
          confidence: 0.5,
        })
      }
    }

    return comments
  }
}

export const geminiCommentService = new GeminiCommentService()
export const geminiService = new GeminiService()
export default geminiService
