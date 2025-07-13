// Database schema definitions for MongoDB collections

export interface User {
  _id?: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  businessType?: string
  password: string // hashed
  plan: "Free" | "Professional" | "Enterprise"
  balance: number
  avatar?: string
  status: "active" | "inactive" | "suspended"
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}

export interface Contact {
  _id?: string
  name: string
  email?: string
  phone?: string
  company?: string
  group: string
  tags: string[]
  status: "active" | "inactive" | "bounced" | "unsubscribed"
  userId: string
  customFields?: Record<string, any>
  createdAt: Date
  updatedAt: Date
  lastActivity?: Date
}

export interface Campaign {
  _id?: string
  name: string
  type: "WhatsApp" | "Email" | "SMS" | "Voice"
  status: "Draft" | "Processing" | "Sending" | "Completed" | "Failed" | "Paused"

  // Message content
  message?: string
  subject?: string // for email
  mediaUrl?: string // for WhatsApp/MMS
  audioFileUrl?: string // for voice

  // Recipients
  recipients: string // "all" or group name
  recipientCount: number

  // Delivery stats
  sent: number
  delivered: number
  read?: number
  opened?: number // email
  clicked?: number // email/SMS
  replied?: number // WhatsApp/SMS
  connected?: number // voice
  completed?: number // voice
  failed: number

  // Settings
  senderId?: string // SMS sender ID
  fromName?: string // email from name
  fromEmail?: string // email from address
  voiceSettings?: {
    voice: string
    speed: number
    language: string
  }

  // Scheduling
  scheduledAt?: Date
  startedAt?: Date
  completedAt?: Date
  failedAt?: Date

  // Cost tracking
  cost: number
  estimatedCost?: number

  // Metadata
  userId: string
  createdAt: Date
  updatedAt: Date

  // External service results
  msg91Results?: any[]
  emailResults?: any[]
  error?: string
}

export interface MessageLog {
  _id?: string
  campaignId: string
  contactId: string

  // Contact info (denormalized for performance)
  mobile?: string
  email?: string

  // Delivery status
  status: "pending" | "sent" | "delivered" | "failed" | "read" | "replied"

  // External service IDs
  messageId?: string
  callId?: string

  // Error tracking
  error?: string
  retryCount?: number

  // Timestamps
  timestamp: Date
  deliveredAt?: Date
  readAt?: Date
  repliedAt?: Date
}

export interface Template {
  _id?: string
  name: string
  platform: "WhatsApp" | "Email" | "SMS" | "Voice"
  category: string

  // Content
  content: string
  subject?: string // for email
  variables: string[]

  // Usage tracking
  usage: number
  lastUsed?: Date

  // Metadata
  userId: string
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserSettings {
  _id?: string
  userId: string
  settings: {
    notifications: {
      email: boolean
      sms: boolean
      push: boolean
      campaignUpdates: boolean
      deliveryReports: boolean
      billingAlerts: boolean
    }
    messaging: {
      defaultSenderId: string
      timezone: string
      language: string
      autoRetry: boolean
      retryAttempts: number
      deliveryReports: boolean
    }
    security: {
      twoFactorAuth: boolean
      sessionTimeout: number
      ipWhitelist: string[]
      apiKeyRotation: number
    }
    billing: {
      currency: string
      autoRecharge: boolean
      rechargeAmount: number
      lowBalanceAlert: number
      invoiceEmail: boolean
    }
    api: {
      webhookUrl: string
      webhookSecret: string
      rateLimitPerMinute: number
      enableWebhooks: boolean
    }
  }
  createdAt: Date
  updatedAt: Date
}

export interface Transaction {
  _id?: string
  userId: string
  type: "credit" | "debit"
  amount: number
  description: string

  // Payment details
  paymentMethod?: string
  paymentId?: string

  // Campaign reference
  campaignId?: string

  // Status
  status: "pending" | "completed" | "failed" | "refunded"

  // Timestamps
  createdAt: Date
  processedAt?: Date

  // Balance tracking
  balanceBefore: number
  balanceAfter: number
}

export interface ApiKey {
  _id?: string
  userId: string
  name: string
  key: string // hashed
  permissions: string[]
  lastUsed?: Date
  expiresAt?: Date
  isActive: boolean
  createdAt: Date
}

// Schema for temporary email accounts
export interface TempAccount {
  _id?: string
  accountNumber: number
  email: string
  profile: {
    firstName: string
    lastName: string
    birthYear: number
    birthMonth: number
    birthDay: number
    gender: string
    usernames: string[]
    password: string
  }
  userId: string
  status: "active" | "inactive" | "suspended"
  createdAt: Date
  updatedAt: Date
  lastChecked?: Date
  emailCount?: number
}

// Schema for social media accounts
export interface SocialAccount {
  _id?: string
  accountNumber: number
  platform: "instagram" | "facebook" | "twitter" | "youtube"
  email: string
  username?: string
  profile: {
    firstName: string
    lastName: string
    birthYear: number
    birthMonth: number
    birthDay: number
    gender: string
    usernames: string[]
    password: string
  }
  status: "created" | "failed" | "suspended" | "active"
  creationResult: {
    success: boolean
    message?: string
    error?: string
  }
  userId: string
  createdAt: Date
  updatedAt: Date
  lastActivity?: Date
}

// Schema for Facebook accounts
export interface FacebookAccount {
  _id?: string
  accountNumber: number
  platform: "facebook"
  email: string
  username?: string
  password: string
  profile: {
    firstName: string
    lastName: string
    fullName: string
    birthDate: string
    gender: string
  }
  status: "active" | "failed" | "suspended"
  verified: boolean
  emailVerificationRequired?: boolean
  challengeType?: string
  challengeBypassed?: boolean
  enhancedStealth: boolean
  noProxy: boolean
  bypassStrategies: boolean
  otpIntegration: boolean
  ipEvasion?: any
  userId: string
  createdAt: Date
  updatedAt: Date
}

// Schema for Instagram accounts
export interface InstagramAccount {
  _id?: string
  accountNumber: number
  platform: "instagram"
  email: string
  username?: string
  password: string
  profile: {
    firstName: string
    lastName: string
    fullName: string
    birthDate: string
    gender: string
  }
  status: "active" | "failed" | "suspended"
  verified: boolean
  emailVerified?: boolean
  phoneVerificationRequired?: boolean
  birthdayCompleted?: boolean
  passwordDialogHandled?: boolean
  indianProfile?: boolean
  deviceProfile?: string
  realAccount: boolean
  browserAutomation: boolean
  emailOnly: boolean
  enhanced: boolean
  maxStealth: boolean
  noProxy: boolean
  stealthStrategy: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

// Schema for Twitter accounts
export interface TwitterAccount {
  _id?: string
  accountNumber: number
  platform: "twitter"
  email: string
  username?: string
  password: string
  profile: {
    firstName: string
    lastName: string
    fullName: string
    birthDate: string
    gender: string
  }
  status: "active" | "failed" | "suspended"
  verified: boolean
  emailVerified?: boolean
  birthdayCompleted?: boolean
  passwordCompleted?: boolean
  usernameCompleted?: boolean
  indianProfile?: boolean
  deviceProfile?: string
  realAccount: boolean
  browserAutomation: boolean
  emailOnly: boolean
  enhanced: boolean
  maxStealth: boolean
  noProxy: boolean
  stealthStrategy: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

// Schema for YouTube accounts (similar structure)
export interface YouTubeAccount {
  _id?: string
  accountNumber: number
  platform: "youtube"
  email: string
  username?: string
  password: string
  profile: {
    firstName: string
    lastName: string
    fullName: string
    birthDate: string
    gender: string
  }
  status: "active" | "failed" | "suspended"
  verified: boolean
  emailVerified?: boolean
  realAccount: boolean
  browserAutomation: boolean
  enhanced: boolean
  maxStealth: boolean
  noProxy: boolean
  userId: string
  createdAt: Date
  updatedAt: Date
}

// Schema for Comment Campaigns
export interface CommentCampaign {
  _id?: string
  userId: string
  platform: "facebook" | "instagram" | "twitter" | "youtube"
  name: string
  targetUrl: string
  sentiment: "positive" | "negative"
  totalComments: number
  completedComments: number
  failedComments: number
  status: "pending" | "running" | "completed" | "failed" | "paused"
  comments: string[]
  accountsUsed: string[] // Account IDs used for commenting
  results: {
    accountId: string
    username: string
    comment: string
    status: "success" | "failed"
    error?: string
    timestamp: Date
  }[]
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

// Database indexes for optimal performance
export const DatabaseIndexes = {
  users: [
    { email: 1 }, // unique
    { createdAt: -1 },
  ],
  contacts: [
    { userId: 1, email: 1 },
    { userId: 1, phone: 1 },
    { userId: 1, group: 1 },
    { userId: 1, createdAt: -1 },
    { status: 1 },
  ],
  campaigns: [
    { userId: 1, createdAt: -1 },
    { userId: 1, status: 1 },
    { userId: 1, type: 1 },
    { status: 1, scheduledAt: 1 },
  ],
  message_logs: [
    { campaignId: 1, timestamp: -1 },
    { contactId: 1, timestamp: -1 },
    { status: 1, timestamp: -1 },
    { campaignId: 1, status: 1 },
  ],
  templates: [{ userId: 1, platform: 1 }, { userId: 1, category: 1 }, { isPublic: 1, platform: 1 }, { usage: -1 }],
  transactions: [{ userId: 1, createdAt: -1 }, { userId: 1, type: 1, createdAt: -1 }, { campaignId: 1 }],
  temp_accounts: [
    { userId: 1, createdAt: -1 },
    { userId: 1, status: 1 },
    { email: 1 }, // unique
    { userId: 1, accountNumber: 1 },
  ],
  social_accounts: [
    { userId: 1, createdAt: -1 },
    { userId: 1, platform: 1 },
    { userId: 1, status: 1 },
    { email: 1 },
    { platform: 1, status: 1 },
  ],
  facebook_accounts: [{ userId: 1, createdAt: -1 }, { userId: 1, status: 1 }, { email: 1 }, { status: 1 }],
  instagram_accounts: [{ userId: 1, createdAt: -1 }, { userId: 1, status: 1 }, { email: 1 }, { status: 1 }],
  twitter_accounts: [{ userId: 1, createdAt: -1 }, { userId: 1, status: 1 }, { email: 1 }, { status: 1 }],
  youtube_accounts: [{ userId: 1, createdAt: -1 }, { userId: 1, status: 1 }, { email: 1 }, { status: 1 }],
  comment_campaigns: [
    { userId: 1, createdAt: -1 },
    { userId: 1, platform: 1 },
    { userId: 1, status: 1 },
    { platform: 1, status: 1 },
  ],
}
