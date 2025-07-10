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
  platform: "instagram" | "facebook"
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

// Two-way call logs
export interface TwoWayCall {
  _id?: string
  callSid: string
  toNumber: string
  fromNumber: string
  userId: string
  status: "initiated" | "ringing" | "answered" | "completed" | "failed"
  record: boolean
  transcribe: boolean
  duration?: number
  recordingSid?: string
  recordingUrl?: string
  transcriptionText?: string
  createdAt: Date
  answeredAt?: Date
  completedAt?: Date
}

// Incoming call logs
export interface IncomingCall {
  _id?: string
  callSid: string
  from: string
  to: string
  callStatus: string
  direction: string
  receivedAt: Date
  status: "received" | "recorded" | "transcribed"
  recordingSid?: string
  recordingUrl?: string
  recordingDuration?: number
  transcriptionText?: string
  transcriptionStatus?: string
  updatedAt?: Date
}

// Call recordings
export interface CallRecording {
  _id?: string
  callSid: string
  recordingSid: string
  recordingUrl: string
  recordingDuration: number
  from: string
  to: string
  createdAt: Date
  status: "completed" | "failed"
  transcriptionStatus?: "pending" | "completed" | "failed"
  transcriptionSid?: string
  transcriptionText?: string
  transcriptionUrl?: string
  transcriptionCompletedAt?: Date
}

// Call transcriptions
export interface CallTranscription {
  _id?: string
  callSid: string
  transcriptionSid: string
  transcriptionText: string
  transcriptionStatus: string
  transcriptionUrl?: string
  confidence: "low" | "medium" | "high"
  createdAt: Date
}

// Conference calls
export interface ConferenceCall {
  _id?: string
  conferenceSid: string
  conferenceName: string
  moderatorNumber?: string
  participants: string[]
  status: "initiated" | "active" | "completed"
  record: boolean
  transcribe: boolean
  userId: string
  createdAt: Date
  startedAt?: Date
  endedAt?: Date
  duration?: number
  recordingUrl?: string
  transcriptionText?: string
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
  two_way_calls: [{ userId: 1, createdAt: -1 }, { callSid: 1 }, { status: 1, createdAt: -1 }],
  incoming_calls: [{ receivedAt: -1 }, { callSid: 1 }, { status: 1, receivedAt: -1 }, { from: 1, receivedAt: -1 }],
  call_recordings: [{ callSid: 1 }, { createdAt: -1 }, { status: 1 }, { transcriptionStatus: 1 }],
  call_transcriptions: [{ callSid: 1 }, { createdAt: -1 }, { transcriptionStatus: 1 }],
  conference_calls: [{ userId: 1, createdAt: -1 }, { conferenceSid: 1 }, { status: 1, createdAt: -1 }],
}
