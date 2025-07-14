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

// Sentiment-based comment templates
const SENTIMENT_STYLES = {
  positive: {
    instagram: {
      engaging: "Create an enthusiastic, uplifting Instagram comment that celebrates the content with positive energy",
      supportive: "Write an encouraging Instagram comment that shows genuine support and positivity",
      question: "Ask an excited, positive question that shows interest and enthusiasm",
      compliment: "Give an enthusiastic compliment that highlights what's amazing about this post",
      casual: "Write a casual, positive comment that shows you genuinely enjoyed this content",
    },
    facebook: {
      engaging: "Create a positive, engaging Facebook comment that spreads good vibes and encourages interaction",
      supportive: "Write a supportive Facebook comment that uplifts and encourages the poster",
      question: "Ask a positive, curious question that shows genuine interest in their success",
      compliment: "Give a detailed, positive compliment about their achievement or content",
      casual: "Write a casual, positive Facebook comment that shows appreciation",
    },
    twitter: {
      engaging: "Create a positive, engaging Twitter reply that celebrates and amplifies the good vibes",
      supportive: "Write a brief but powerful supportive reply that encourages and uplifts",
      question: "Ask a positive, curious question that shows enthusiasm for their content",
      compliment: "Give a concise but genuine compliment that highlights their success",
      casual: "Write a casual, positive reply that shows you enjoyed their tweet",
    },
    youtube: {
      engaging: "Create a positive YouTube comment that celebrates the video and encourages the creator",
      supportive: "Write an encouraging comment that supports the creator's work and effort",
      question: "Ask a positive question about their process or future content plans",
      compliment: "Give a detailed compliment about the video quality, content, or presentation",
      casual: "Write a casual, positive comment showing appreciation for the video",
    },
  },
  negative: {
    instagram: {
      engaging: "Create a constructive Instagram comment that offers a different perspective respectfully",
      supportive: "Write a comment that acknowledges concerns while remaining respectful and constructive",
      question: "Ask a thoughtful question that encourages reflection or clarification",
      compliment: "Find something positive to highlight while addressing concerns constructively",
      casual: "Write a casual comment that expresses disagreement respectfully",
    },
    facebook: {
      engaging: "Create a respectful Facebook comment that presents an alternative viewpoint constructively",
      supportive: "Write a comment that shows understanding while offering a different perspective",
      question: "Ask a respectful question that encourages deeper discussion of the issues",
      compliment: "Acknowledge their effort while respectfully presenting concerns",
      casual: "Write a casual comment that disagrees respectfully without being confrontational",
    },
    twitter: {
      engaging: "Create a respectful Twitter reply that offers constructive criticism or alternative view",
      supportive: "Write a brief reply that shows understanding while expressing concerns",
      question: "Ask a respectful question that encourages them to consider other perspectives",
      compliment: "Acknowledge something positive while respectfully disagreeing",
      casual: "Write a casual reply that expresses disagreement without being harsh",
    },
    youtube: {
      engaging: "Create a constructive YouTube comment that offers feedback or alternative perspective",
      supportive: "Write a comment that acknowledges their effort while providing constructive feedback",
      question: "Ask a thoughtful question that encourages them to address concerns or clarify",
      compliment: "Highlight positive aspects while providing constructive criticism",
      casual: "Write a casual comment that expresses concerns respectfully",
    },
  },
}

// Fallback comments organized by sentiment
const FALLBACK_COMMENTS = {
  positive: {
    instagram: {
      engaging: [
        "This is absolutely amazing! 🔥 What inspired you to create this?",
        "Love this energy! 💯 Keep shining!",
        "This made my day! ✨ More content like this please!",
      ],
      supportive: [
        "You're absolutely crushing it! 💪 So proud of your progress!",
        "This is incredible! 🌟 Keep following your dreams!",
        "Your positivity is contagious! ❤️ Thank you for sharing!",
      ],
      question: [
        "This is so cool! 😍 How did you learn to do this?",
        "Amazing work! 🎨 What's your creative process like?",
        "Love this! ✨ Any tips for beginners?",
      ],
      compliment: [
        "Pure talent right here! 🎯",
        "This is absolutely stunning! 😍",
        "Your creativity never fails to amaze me! 🎨",
      ],
      casual: ["This is so good! 🔥", "Love it! ❤️", "Amazing! 🙌"],
    },
    facebook: {
      engaging: [
        "This is fantastic! I love seeing positive content like this. What motivated you to share this?",
        "Such an inspiring post! This really brightened my day. Thank you for sharing!",
        "This is exactly what I needed to see today! Your positivity is infectious!",
      ],
      supportive: [
        "You're doing such amazing work! I'm so proud of how far you've come!",
        "This is incredible! Your dedication and hard work really show. Keep it up!",
        "Thank you for sharing this! Your journey is so inspiring to follow!",
      ],
      question: [
        "This is wonderful! I'm curious about your experience with this - how did you get started?",
        "Love this perspective! What advice would you give to someone just beginning this journey?",
        "This is so interesting! What has been the most rewarding part of this experience?",
      ],
      compliment: [
        "Your insights are always so thoughtful and well-articulated! This is excellent!",
        "The way you explain things is so clear and inspiring! Great work!",
        "I always learn something valuable from your posts. This is no exception!",
      ],
      casual: [
        "This is great! Thanks for sharing such positive content!",
        "Love seeing posts like this! Keep up the good work!",
        "This made me smile! Thank you for the positivity!",
      ],
    },
    twitter: {
      engaging: [
        "This is so true! 🔥 Love this perspective!",
        "💯 This needs more visibility!",
        "This! 🙌 Thank you for sharing this wisdom!",
      ],
      supportive: [
        "💪 Keep speaking truth!",
        "This is so important! ✨ Thank you for your voice!",
        "Yes! 🎯 Your insights are always on point!",
      ],
      question: [
        "This is brilliant! 🤔 What inspired this realization?",
        "Love this! 💭 Any book recommendations on this topic?",
        "So true! ✨ How did you learn this lesson?",
      ],
      compliment: [
        "Pure wisdom! 🧠 Your tweets always inspire me!",
        "This is it! 👏 You always know what to say!",
        "Brilliant as always! 🌟 Thank you for this!",
      ],
      casual: ["This! 💯", "So true! 🔥", "Love this! ✨"],
    },
    youtube: {
      engaging: [
        "This video is absolutely incredible! Your content quality keeps getting better and better. What's your secret?",
        "Amazing work as always! I love how you explain complex topics so clearly. This was so helpful!",
        "This is exactly what I was looking for! Your videos always deliver such great value. Thank you!",
      ],
      supportive: [
        "Thank you for putting so much effort into your content! Your hard work really shows and it's so appreciated!",
        "Your dedication to creating quality content is inspiring! Keep up the fantastic work!",
        "I always look forward to your videos! Your passion for this topic really comes through!",
      ],
      question: [
        "This was so informative! I'm curious about your editing process - what software do you recommend for beginners?",
        "Great video! What inspired you to start creating content about this topic?",
        "This was excellent! Do you have any plans for a follow-up video on this subject?",
      ],
      compliment: [
        "The production quality of your videos is outstanding! Your presentation style is so engaging!",
        "Your ability to break down complex topics is remarkable! This was so well explained!",
        "The research you put into your videos is impressive! This was incredibly thorough!",
      ],
      casual: [
        "Great video! This was really helpful, thank you!",
        "Love your content! Keep up the awesome work!",
        "This was exactly what I needed! Thanks for sharing!",
      ],
    },
  },
  negative: {
    instagram: {
      engaging: [
        "I appreciate you sharing this, though I have a different perspective on this topic. Would love to discuss!",
        "Interesting post! I see this differently based on my experience. Thanks for opening the conversation!",
        "Thanks for sharing your view! I've had different experiences with this. Always good to hear various perspectives!",
      ],
      supportive: [
        "I understand where you're coming from, though I've experienced this differently. Appreciate you sharing your thoughts!",
        "Thanks for being open about this! While I see it differently, I respect your perspective!",
        "I hear you on this! My experience has been different, but I appreciate the honest conversation!",
      ],
      question: [
        "I'm curious about your experience with this - have you considered alternative approaches?",
        "Interesting perspective! What led you to this conclusion?",
        "Thanks for sharing! I'm wondering if you've encountered different viewpoints on this?",
      ],
      compliment: [
        "I appreciate your honesty in sharing this, even though I see things differently!",
        "Thanks for being open about your experience! I respect your perspective even though mine differs!",
        "I admire your willingness to share your thoughts, though I have a different take on this!",
      ],
      casual: [
        "I see this differently, but thanks for sharing your perspective!",
        "Interesting take! I've had different experiences with this!",
        "Thanks for the post! I have a different view on this topic!",
      ],
    },
    facebook: {
      engaging: [
        "I appreciate you sharing this perspective, though I have to respectfully disagree based on my experience. Would love to hear more about what led you to this conclusion!",
        "Thanks for opening this discussion! I see this topic quite differently, but I think it's important we talk about these things!",
        "Interesting post! While I don't share the same view, I appreciate you bringing up this topic for discussion!",
      ],
      supportive: [
        "I understand this is your experience, and I respect that, though mine has been quite different. Thanks for sharing your thoughts!",
        "I hear where you're coming from, even though I see this differently. It's good that we can have these conversations!",
        "Thanks for being open about this! While I disagree, I appreciate your willingness to share your perspective!",
      ],
      question: [
        "I'm curious about what experiences led you to this viewpoint? I've found quite the opposite in my situation!",
        "Interesting perspective! Have you considered looking at this from a different angle?",
        "Thanks for sharing! I'm wondering if there might be other factors to consider here?",
      ],
      compliment: [
        "I respect your willingness to share your thoughts, even though I see this topic differently!",
        "I appreciate your honesty, though my experience has led me to different conclusions!",
        "Thanks for being open about your views! I admire that even though I disagree!",
      ],
      casual: [
        "I see this differently, but I appreciate you sharing your thoughts!",
        "Thanks for the post! I have a different perspective on this topic!",
        "Interesting take! My experience has been quite different!",
      ],
    },
    twitter: {
      engaging: [
        "I respectfully disagree with this take. Happy to discuss why! 🤔",
        "Interesting perspective, though I see this differently based on my experience! 💭",
        "Thanks for sharing! I have a different view on this topic! 🧵",
      ],
      supportive: [
        "I hear you, though my experience has been different! Appreciate the conversation! 🤝",
        "I understand your point, even though I disagree! Thanks for sharing! 💬",
        "Respect your view, though I see it differently! Good discussion! 🗣️",
      ],
      question: [
        "What led you to this conclusion? I've found the opposite! 🤔",
        "Interesting! Have you considered alternative perspectives? 💭",
        "Curious about your experience with this! Mine's been different! 🧐",
      ],
      compliment: [
        "Appreciate your honesty, though I disagree! Respect! 🤝",
        "Thanks for sharing your view, even though mine differs! 💬",
        "I admire your openness, though I see it differently! 🗣️",
      ],
      casual: ["I see this differently! 🤷‍♂️", "Different experience here! 💭", "Respectfully disagree! 🤝"],
    },
    youtube: {
      engaging: [
        "Thanks for the video! I have to respectfully disagree with some of the points made here. I'd love to see a follow-up addressing alternative viewpoints!",
        "Interesting content! While I appreciate the effort, I have different experiences with this topic that lead me to different conclusions!",
        "I appreciate you making this video, though I see this topic quite differently based on my research and experience!",
      ],
      supportive: [
        "I can see you put effort into this video, and I respect that, though I have to disagree with some of the conclusions based on my experience!",
        "Thanks for sharing your perspective! While I see things differently, I appreciate the work you put into this content!",
        "I understand this is your viewpoint, and I respect the effort, though my experience has led me to different conclusions!",
      ],
      question: [
        "Interesting video! I'm curious if you've considered alternative research on this topic that might lead to different conclusions?",
        "Thanks for the content! Have you looked into other perspectives on this subject?",
        "Good effort on the video! I'm wondering if you've encountered different viewpoints in your research?",
      ],
      compliment: [
        "I appreciate the production quality of this video, even though I disagree with some of the content!",
        "Thanks for the clear presentation, though I have different views on this topic!",
        "I respect the work you put into this, even though my experience leads me to different conclusions!",
      ],
      casual: [
        "Thanks for the video! I see this topic differently based on my experience!",
        "Interesting content! I have a different perspective on this subject!",
        "Good video! My experience with this has been quite different though!",
      ],
    },
  },
}

// Generate AI comment with sentiment
export async function generateComment(
  postContent: string,
  platform: string,
  style = "engaging",
  sentiment = "positive",
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const constraints = PLATFORM_CONSTRAINTS[platform as keyof typeof PLATFORM_CONSTRAINTS]
    const sentimentPrompts = SENTIMENT_STYLES[sentiment as keyof typeof SENTIMENT_STYLES]

    if (!constraints || !sentimentPrompts) {
      throw new Error("Invalid platform or sentiment")
    }

    const platformPrompts = sentimentPrompts[platform as keyof typeof sentimentPrompts]
    if (!platformPrompts) {
      throw new Error("Invalid platform for sentiment")
    }

    const specificPrompt = platformPrompts[style as keyof typeof platformPrompts]
    if (!specificPrompt) {
      throw new Error("Invalid style for platform and sentiment")
    }

    const prompt = `
You are an AI assistant that generates natural, human-like social media comments with specific sentiment.

PLATFORM: ${platform.toUpperCase()}
STYLE: ${style}
SENTIMENT: ${sentiment.toUpperCase()}
MAX LENGTH: ${constraints.maxLength} characters
PLATFORM STYLE: ${constraints.style}
TONE: ${constraints.tone}

TASK: ${specificPrompt}

POST CONTENT TO COMMENT ON:
"${postContent}"

SENTIMENT GUIDELINES:
${
  sentiment === "positive"
    ? `- Express genuine enthusiasm, support, or appreciation
     - Use uplifting language and positive emotions
     - Celebrate achievements or good content
     - Spread good vibes and encouragement
     - Be authentically excited or supportive`
    : `- Be respectful and constructive in disagreement
     - Offer alternative perspectives thoughtfully
     - Ask questions that encourage reflection
     - Avoid harsh criticism or negativity
     - Maintain civility while expressing concerns
     - Focus on constructive feedback rather than attacks`
}

REQUIREMENTS:
1. Write a ${sentiment} ${style} comment that feels natural and human
2. Keep it under ${constraints.maxLength} characters
3. Match the ${platform} platform style: ${constraints.style}
4. Use a ${constraints.tone} tone
5. Be relevant to the post content
6. Avoid generic responses
7. ${platform === "instagram" ? "Include 1-2 relevant emojis" : ""}
8. ${platform === "twitter" ? "Be concise and impactful" : ""}
9. ${platform === "youtube" ? "Reference the video content specifically" : ""}
10. ${platform === "facebook" ? "Encourage discussion" : ""}
11. ${sentiment === "positive" ? "Express genuine positivity and enthusiasm" : "Be respectful and constructive in any disagreement"}

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

    // Return fallback comment based on sentiment
    const fallbacks = FALLBACK_COMMENTS[sentiment as keyof typeof FALLBACK_COMMENTS]
    if (fallbacks && fallbacks[platform as keyof typeof fallbacks]) {
      const platformFallbacks = fallbacks[platform as keyof typeof fallbacks]
      const styleFallbacks = platformFallbacks[style as keyof typeof platformFallbacks]
      if (styleFallbacks && styleFallbacks.length > 0) {
        return styleFallbacks[Math.floor(Math.random() * styleFallbacks.length)]
      }
    }

    // Ultimate fallback based on sentiment
    return sentiment === "positive" ? "Great content! 👍" : "Thanks for sharing your perspective!"
  }
}

// Validate and score comment quality
export function scoreComment(comment: string, platform: string, sentiment: string): number {
  let score = 0

  // Length check
  const constraints = PLATFORM_CONSTRAINTS[platform as keyof typeof PLATFORM_CONSTRAINTS]
  if (comment.length >= 10 && comment.length <= constraints.maxLength) {
    score += 30
  }

  // Sentiment appropriateness
  if (sentiment === "positive") {
    const positiveWords = ["great", "amazing", "love", "awesome", "fantastic", "incredible", "wonderful"]
    if (positiveWords.some((word) => comment.toLowerCase().includes(word))) {
      score += 20
    }
  } else {
    const respectfulWords = ["respectfully", "understand", "appreciate", "perspective", "different", "consider"]
    if (respectfulWords.some((word) => comment.toLowerCase().includes(word))) {
      score += 20
    }
  }

  // Engagement indicators
  if (comment.includes("?")) score += 15 // Questions encourage engagement
  if (comment.match(/[!]{1,2}/)) score += 10 // Enthusiasm (but not excessive)

  // Platform-specific scoring
  if (
    platform === "instagram" &&
    comment.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u)
  ) {
    score += 15 // Emojis for Instagram
  }

  // Avoid generic responses
  const genericPhrases = ["nice", "good", "ok", "cool"]
  const isGeneric = genericPhrases.some((phrase) => comment.toLowerCase() === phrase)
  if (!isGeneric) score += 25

  return Math.min(score, 100)
}

// Get platform-specific comment suggestions based on sentiment
export function getCommentSuggestions(platform: string, style: string, sentiment: string): string[] {
  const fallbacks = FALLBACK_COMMENTS[sentiment as keyof typeof FALLBACK_COMMENTS]
  if (fallbacks && fallbacks[platform as keyof typeof fallbacks]) {
    const platformFallbacks = fallbacks[platform as keyof typeof fallbacks]
    const styleFallbacks = platformFallbacks[style as keyof typeof platformFallbacks]
    if (styleFallbacks) {
      return styleFallbacks
    }
  }

  // Default suggestions based on sentiment
  return sentiment === "positive"
    ? ["Great content!", "Thanks for sharing!", "Love this!"]
    : ["Thanks for sharing your perspective!", "I see this differently!", "Interesting viewpoint!"]
}
