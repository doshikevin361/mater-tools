import { GoogleGenerativeAI } from "@google/generative-ai"

interface CommentGenerationOptions {
  platform: "instagram" | "facebook" | "twitter" | "youtube"
  style: "engaging" | "supportive" | "question" | "compliment" | "casual"
  sentiment: "positive" | "negative" | "neutral"
  postContent?: string
  userContext?: string
}

interface CommentResponse {
  success: boolean
  comment: string
  fallbackUsed: boolean
  quality: number
  error?: string
}

class GeminiService {
  private genAI: GoogleGenerativeAI
  private model: any

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not found. Using fallback comments only.")
      return
    }

    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" })
  }

  async generateComment(options: CommentGenerationOptions): Promise<CommentResponse> {
    try {
      if (!this.model) {
        return this.getFallbackComment(options)
      }

      const prompt = this.buildPrompt(options)
      console.log(
        `Generating ${options.platform} comment with ${options.style} style and ${options.sentiment} sentiment`,
      )

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const comment = response.text().trim()

      // Validate and score the comment
      const quality = this.scoreComment(comment, options)

      if (quality < 0.5) {
        console.log("Generated comment quality too low, using fallback")
        return this.getFallbackComment(options)
      }

      return {
        success: true,
        comment: this.cleanComment(comment),
        fallbackUsed: false,
        quality: quality,
      }
    } catch (error) {
      console.error("Gemini API error:", error)
      return this.getFallbackComment(options)
    }
  }

  private buildPrompt(options: CommentGenerationOptions): string {
    const { platform, style, sentiment, postContent } = options

    let basePrompt = `Generate a ${sentiment} ${style} comment for ${platform}.`

    // Platform-specific constraints
    switch (platform) {
      case "instagram":
        basePrompt += " Keep it casual, use 1-2 relevant emojis, max 150 characters."
        break
      case "facebook":
        basePrompt += " Make it conversational and engaging, max 200 characters."
        break
      case "twitter":
        basePrompt += " Keep it concise and witty, max 280 characters."
        break
      case "youtube":
        basePrompt += " Make it thoughtful and video-related, max 250 characters."
        break
    }

    // Sentiment-specific instructions
    switch (sentiment) {
      case "positive":
        basePrompt += " Be encouraging, supportive, and uplifting."
        break
      case "negative":
        basePrompt += " Be constructively critical but respectful. Avoid being rude."
        break
      case "neutral":
        basePrompt += " Be balanced, informative, and objective."
        break
    }

    // Style-specific instructions
    switch (style) {
      case "engaging":
        basePrompt += " Ask questions or encourage interaction."
        break
      case "supportive":
        basePrompt += " Show empathy and encouragement."
        break
      case "question":
        basePrompt += " Ask a thoughtful question related to the content."
        break
      case "compliment":
        basePrompt += " Give genuine praise or appreciation."
        break
      case "casual":
        basePrompt += " Keep it friendly and natural, like talking to a friend."
        break
    }

    if (postContent) {
      basePrompt += `\n\nPost content: "${postContent}"`
      basePrompt += "\nMake your comment relevant to this specific content."
    }

    basePrompt += "\n\nRules:"
    basePrompt += "\n- Be authentic and human-like"
    basePrompt += "\n- Avoid generic responses"
    basePrompt += "\n- Don't use hashtags unless specifically for Instagram"
    basePrompt += "\n- Keep it natural and conversational"
    basePrompt += "\n- Return ONLY the comment text, no quotes or explanations"

    return basePrompt
  }

  private getFallbackComment(options: CommentGenerationOptions): CommentResponse {
    const fallbacks = this.getFallbackComments(options.platform, options.style, options.sentiment)
    const randomComment = fallbacks[Math.floor(Math.random() * fallbacks.length)]

    return {
      success: true,
      comment: randomComment,
      fallbackUsed: true,
      quality: 0.7,
    }
  }

  private getFallbackComments(platform: string, style: string, sentiment: string): string[] {
    const comments: { [key: string]: { [key: string]: { [key: string]: string[] } } } = {
      instagram: {
        positive: {
          engaging: [
            "Love this! 😍 What inspired you?",
            "Amazing content! 🔥 Keep it up!",
            "This is so cool! Tell us more! ✨",
          ],
          supportive: ["You're doing great! 💪", "Keep shining! ⭐", "So proud of you! 🙌"],
          question: ["How did you create this? 🤔", "What's your secret? 😊", "Where was this taken? 📍"],
          compliment: ["Absolutely beautiful! 😍", "You're so talented! 🎨", "Perfect shot! 📸"],
          casual: ["Nice! 👍", "Love it! ❤️", "So good! 🔥"],
        },
        negative: {
          engaging: [
            "Interesting perspective, but have you considered...?",
            "I see your point, though I think differently",
            "This raises some questions for me",
          ],
          supportive: [
            "Maybe try a different approach next time?",
            "There's room for improvement here",
            "Consider this feedback constructively",
          ],
          question: [
            "Why did you choose this approach?",
            "What was your reasoning behind this?",
            "Have you tried alternatives?",
          ],
          compliment: [
            "Good effort, though it could be refined",
            "Nice try, keep working on it",
            "Decent attempt, room to grow",
          ],
          casual: ["Not quite there yet", "Could be better", "Needs some work"],
        },
        neutral: {
          engaging: [
            "Interesting content. What's your take on this?",
            "Thanks for sharing. Any more details?",
            "Good post. What's next?",
          ],
          supportive: ["Thanks for the information", "Noted, appreciate the share", "Good to know"],
          question: ["Can you elaborate on this?", "What are your thoughts?", "How does this work?"],
          compliment: ["Well presented", "Clear and informative", "Good documentation"],
          casual: ["Thanks for sharing", "Noted", "Interesting"],
        },
      },
      facebook: {
        positive: {
          engaging: [
            "This is fantastic! I'd love to hear more about your experience with this.",
            "Great post! What got you started with this?",
            "Amazing work! How long did this take you?",
          ],
          supportive: [
            "You're absolutely crushing it! Keep up the excellent work!",
            "So inspiring to see your progress! You should be proud!",
            "This is exactly what I needed to see today. Thank you!",
          ],
          question: [
            "This looks incredible! What's your process for creating something like this?",
            "I'm curious about your approach here. Can you share more details?",
            "What advice would you give to someone just starting out?",
          ],
          compliment: [
            "Your creativity never ceases to amaze me! This is beautiful work.",
            "You have such a unique perspective. This is really well done!",
            "The attention to detail here is impressive. Great job!",
          ],
          casual: [
            "Love this! Thanks for sharing with us.",
            "This is really cool. Nice work!",
            "Great stuff as always!",
          ],
        },
        negative: {
          engaging: [
            "I appreciate you sharing this, though I have some concerns about this approach.",
            "Interesting perspective, but I wonder if there might be some issues with this method.",
            "Thanks for posting, though I think there are some points worth discussing further.",
          ],
          supportive: [
            "I can see the effort you put in, though there might be room for some adjustments.",
            "Good attempt, though perhaps consider some alternative approaches next time.",
            "I appreciate the work, but there are a few areas that could use improvement.",
          ],
          question: [
            "I'm curious about your reasoning behind this choice. Can you explain more?",
            "What led you to this particular approach? I'm having trouble understanding it.",
            "Have you considered the potential drawbacks of this method?",
          ],
          compliment: [
            "You clearly put effort into this, though the execution could be refined.",
            "I can see your passion for this topic, even if I don't fully agree with the approach.",
            "Good initiative, though there's definitely room for growth here.",
          ],
          casual: [
            "Not sure I agree with this one.",
            "This doesn't quite work for me.",
            "I think this needs some reconsideration.",
          ],
        },
        neutral: {
          engaging: [
            "Thanks for sharing this information. What are your thoughts on the implications?",
            "Interesting data. How do you think this will impact the industry?",
            "Good post. What's your prediction for how this develops?",
          ],
          supportive: [
            "Thanks for taking the time to share this with the community.",
            "Appreciate you bringing this to our attention.",
            "Good information to have. Thanks for posting.",
          ],
          question: [
            "Can you provide more context about this situation?",
            "What's your analysis of these findings?",
            "How reliable is this information source?",
          ],
          compliment: [
            "Well-researched and clearly presented. Thank you.",
            "Good documentation of the facts here.",
            "Comprehensive overview. Appreciate the thoroughness.",
          ],
          casual: ["Thanks for the update.", "Good to know.", "Noted, thanks for sharing."],
        },
      },
      twitter: {
        positive: {
          engaging: [
            "Love this! What's your next move? 🚀",
            "This is fire! 🔥 Tell us more!",
            "Amazing thread! What inspired this? ✨",
          ],
          supportive: [
            "You're killing it! Keep going! 💪",
            "So proud of your progress! 🙌",
            "This is inspiring! Thank you! ⭐",
          ],
          question: [
            "How did you figure this out? 🤔",
            "What's your secret? Share the wisdom! 🧠",
            "Where do you get these ideas? 💡",
          ],
          compliment: ["Brilliant work! 👏", "You're incredibly talented! 🎯", "This is perfection! 🔥"],
          casual: ["Nice! 👍", "Love it! ❤️", "So good! 🚀"],
        },
        negative: {
          engaging: [
            "Hmm, not sure I agree. What's your reasoning?",
            "Interesting take, but have you considered the downsides?",
            "I see your point, but there are some issues here.",
          ],
          supportive: [
            "Good effort, but maybe try a different approach?",
            "I can see what you're going for, needs refinement though.",
            "Nice try, but there's room for improvement.",
          ],
          question: [
            "Why this approach? Seems problematic.",
            "What made you think this was a good idea?",
            "Have you thought about the consequences?",
          ],
          compliment: [
            "Decent attempt, could be better executed.",
            "Good initiative, execution needs work.",
            "I see the effort, results are mixed.",
          ],
          casual: ["Not convinced by this.", "This doesn't work.", "Needs improvement."],
        },
        neutral: {
          engaging: [
            "Interesting perspective. What do others think?",
            "Good point. How does this play out long-term?",
            "Thanks for sharing. What's the next step?",
          ],
          supportive: [
            "Thanks for the information.",
            "Good to know, appreciate the update.",
            "Noted, thanks for sharing.",
          ],
          question: [
            "Can you elaborate on this point?",
            "What's the source for this data?",
            "How does this compare to alternatives?",
          ],
          compliment: ["Well stated.", "Clear and concise.", "Good documentation."],
          casual: ["Noted.", "Thanks.", "Interesting."],
        },
      },
      youtube: {
        positive: {
          engaging: [
            "Great video! What's your next topic going to be?",
            "Loved this content! Have you considered making a series about this?",
            "Fantastic explanation! Could you do a follow-up on the advanced techniques?",
          ],
          supportive: [
            "Your content keeps getting better! Keep up the amazing work!",
            "This was exactly what I needed to learn. Thank you so much!",
            "You explain things so clearly. This really helped me understand!",
          ],
          question: [
            "This was super helpful! What equipment do you recommend for beginners?",
            "Great tutorial! What would you say is the most common mistake people make?",
            "Awesome video! How long did it take you to master this skill?",
          ],
          compliment: [
            "Your editing skills are incredible! The quality of this video is top-notch.",
            "You have such a natural teaching ability. This was perfectly explained!",
            "The production value of your videos is amazing. Great work!",
          ],
          casual: ["Great video! Thanks for sharing this.", "Really enjoyed this content!", "Nice work on this one!"],
        },
        negative: {
          engaging: [
            "Interesting video, though I disagree with some of your points. What's your response to critics?",
            "Good effort, but I think there are some inaccuracies here that should be addressed.",
            "Thanks for the content, though I believe there are some better approaches to this topic.",
          ],
          supportive: [
            "I can see you put effort into this, though the information seems incomplete.",
            "Good attempt at explaining this, but there are some gaps in the explanation.",
            "I appreciate the video, though I think it could benefit from more research.",
          ],
          question: [
            "Why did you choose this particular method? There seem to be some issues with it.",
            "What's your source for this information? I'm having trouble verifying it.",
            "Have you considered the counterarguments to this approach?",
          ],
          compliment: [
            "Good video production, though the content could use some fact-checking.",
            "Nice editing work, even if I don't agree with all the points made.",
            "You clearly put time into this, though the conclusions seem questionable.",
          ],
          casual: [
            "Not sure I agree with this approach.",
            "This doesn't seem quite right to me.",
            "I think this needs more consideration.",
          ],
        },
        neutral: {
          engaging: [
            "Thanks for the video. What do you think about the recent developments in this field?",
            "Interesting content. How do you see this evolving in the future?",
            "Good overview. What's your take on the current industry trends?",
          ],
          supportive: [
            "Thanks for taking the time to create this content.",
            "Appreciate you sharing your knowledge on this topic.",
            "Good information. Thanks for the educational content.",
          ],
          question: [
            "Can you provide more details about the methodology you used?",
            "What are your sources for this information?",
            "How does this compare to other approaches in the field?",
          ],
          compliment: [
            "Well-structured video with good information.",
            "Clear presentation and good audio quality.",
            "Comprehensive coverage of the topic.",
          ],
          casual: ["Thanks for the video.", "Good content.", "Informative video."],
        },
      },
    }

    return comments[platform]?.[sentiment]?.[style] || ["Thanks for sharing!"]
  }

  private scoreComment(comment: string, options: CommentGenerationOptions): number {
    let score = 0.5 // Base score

    // Length check
    const maxLength = this.getMaxLength(options.platform)
    if (comment.length <= maxLength) score += 0.2
    if (comment.length < maxLength * 0.8) score += 0.1

    // Platform-specific checks
    if (options.platform === "instagram" && /[😀-🿿]/u.test(comment)) score += 0.1
    if (options.platform === "twitter" && comment.length <= 280) score += 0.1

    // Style relevance
    if (options.style === "question" && comment.includes("?")) score += 0.2
    if (options.style === "engaging" && (comment.includes("?") || comment.includes("!"))) score += 0.1

    // Avoid generic responses
    const genericPhrases = ["great post", "nice work", "good job", "thanks for sharing"]
    const isGeneric = genericPhrases.some((phrase) => comment.toLowerCase().includes(phrase))
    if (!isGeneric) score += 0.1

    return Math.min(score, 1.0)
  }

  private getMaxLength(platform: string): number {
    switch (platform) {
      case "instagram":
        return 150
      case "facebook":
        return 200
      case "twitter":
        return 280
      case "youtube":
        return 250
      default:
        return 200
    }
  }

  private cleanComment(comment: string): string {
    // Remove quotes if they wrap the entire comment
    if ((comment.startsWith('"') && comment.endsWith('"')) || (comment.startsWith("'") && comment.endsWith("'"))) {
      comment = comment.slice(1, -1)
    }

    // Remove any leading/trailing whitespace
    return comment.trim()
  }
}

export const geminiService = new GeminiService()
