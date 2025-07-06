const { MongoClient } = require("mongodb")

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/brandbuzz"

async function setupDatabase() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log("Connected to MongoDB")

    const db = client.db()

    // Create collections
    const collections = [
      "users",
      "contacts",
      "campaigns",
      "message_logs",
      "templates",
      "user_settings",
      "transactions",
      "api_keys",
    ]

    for (const collectionName of collections) {
      try {
        await db.createCollection(collectionName)
        console.log(`✅ Created collection: ${collectionName}`)
      } catch (error) {
        if (error.code === 48) {
          console.log(`⚠️  Collection ${collectionName} already exists`)
        } else {
          console.error(`❌ Error creating ${collectionName}:`, error.message)
        }
      }
    }

    // Create indexes
    console.log("\n📊 Creating database indexes...")

    // Users indexes
    await db.collection("users").createIndex({ email: 1 }, { unique: true })
    await db.collection("users").createIndex({ createdAt: -1 })

    // Contacts indexes
    await db.collection("contacts").createIndex({ userId: 1, email: 1 })
    await db.collection("contacts").createIndex({ userId: 1, phone: 1 })
    await db.collection("contacts").createIndex({ userId: 1, group: 1 })
    await db.collection("contacts").createIndex({ userId: 1, createdAt: -1 })
    await db.collection("contacts").createIndex({ status: 1 })

    // Campaigns indexes
    await db.collection("campaigns").createIndex({ userId: 1, createdAt: -1 })
    await db.collection("campaigns").createIndex({ userId: 1, status: 1 })
    await db.collection("campaigns").createIndex({ userId: 1, type: 1 })
    await db.collection("campaigns").createIndex({ status: 1, scheduledAt: 1 })

    // Message logs indexes
    await db.collection("message_logs").createIndex({ campaignId: 1, timestamp: -1 })
    await db.collection("message_logs").createIndex({ contactId: 1, timestamp: -1 })
    await db.collection("message_logs").createIndex({ status: 1, timestamp: -1 })
    await db.collection("message_logs").createIndex({ campaignId: 1, status: 1 })

    // Templates indexes
    await db.collection("templates").createIndex({ userId: 1, platform: 1 })
    await db.collection("templates").createIndex({ userId: 1, category: 1 })
    await db.collection("templates").createIndex({ isPublic: 1, platform: 1 })
    await db.collection("templates").createIndex({ usage: -1 })

    // Transactions indexes
    await db.collection("transactions").createIndex({ userId: 1, createdAt: -1 })
    await db.collection("transactions").createIndex({ userId: 1, type: 1, createdAt: -1 })
    await db.collection("transactions").createIndex({ campaignId: 1 })

    console.log("✅ All indexes created successfully")

    // Insert demo data
    console.log("\n📝 Inserting demo data...")

    // Demo user
    const demoUser = {
      firstName: "Demo",
      lastName: "User",
      email: "demo@brandbuzzventures.com",
      phone: "+91 9876543210",
      company: "BrandBuzz Ventures",
      businessType: "services",
      password: "$2b$10$rQZ9QmjytWIHq8fJvXrqHuQqJ5Z8QmjytWIHq8fJvXrqHu", // demo123
      plan: "Professional",
      balance: 12450,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.collection("users").updateOne({ email: demoUser.email }, { $setOnInsert: demoUser }, { upsert: true })

    // Demo contacts
    const demoContacts = [
      {
        name: "John Smith",
        email: "john@example.com",
        phone: "+91 9876543211",
        company: "Tech Corp",
        group: "customers",
        tags: ["premium", "tech"],
        status: "active",
        userId: "demo-user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Sarah Johnson",
        email: "sarah@example.com",
        phone: "+91 9876543212",
        company: "Design Studio",
        group: "prospects",
        tags: ["design", "creative"],
        status: "active",
        userId: "demo-user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Mike Wilson",
        email: "mike@example.com",
        phone: "+91 9876543213",
        company: "Marketing Inc",
        group: "customers",
        tags: ["marketing", "vip"],
        status: "active",
        userId: "demo-user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    for (const contact of demoContacts) {
      await db
        .collection("contacts")
        .updateOne({ email: contact.email, userId: contact.userId }, { $setOnInsert: contact }, { upsert: true })
    }

    // Demo templates
    const demoTemplates = [
      {
        name: "Welcome Message",
        platform: "WhatsApp",
        category: "onboarding",
        content: "Welcome to {company}! Thanks for joining us. Use code WELCOME10 for 10% off your first order.",
        variables: ["company"],
        usage: 245,
        userId: "demo-user",
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Order Confirmation",
        platform: "SMS",
        category: "transactional",
        content: "Hi {name}, your order #{orderId} has been confirmed and will be delivered by {date}. Track: {link}",
        variables: ["name", "orderId", "date", "link"],
        usage: 1234,
        userId: "demo-user",
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Newsletter Template",
        platform: "Email",
        category: "marketing",
        subject: "Weekly Updates from {company}",
        content: "<h1>Hello {name}!</h1><p>Here are this week's highlights...</p>",
        variables: ["company", "name"],
        usage: 567,
        userId: "demo-user",
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    for (const template of demoTemplates) {
      await db
        .collection("templates")
        .updateOne({ name: template.name, userId: template.userId }, { $setOnInsert: template }, { upsert: true })
    }

    // Demo user settings
    const demoSettings = {
      userId: "demo-user",
      settings: {
        notifications: {
          email: true,
          sms: false,
          push: true,
          campaignUpdates: true,
          deliveryReports: true,
          billingAlerts: true,
        },
        messaging: {
          defaultSenderId: "BRDBUZ",
          timezone: "Asia/Kolkata",
          language: "en",
          autoRetry: true,
          retryAttempts: 2,
          deliveryReports: true,
        },
        security: {
          twoFactorAuth: false,
          sessionTimeout: 30,
          ipWhitelist: [],
          apiKeyRotation: 90,
        },
        billing: {
          currency: "INR",
          autoRecharge: false,
          rechargeAmount: 1000,
          lowBalanceAlert: 500,
          invoiceEmail: true,
        },
        api: {
          webhookUrl: "",
          webhookSecret: "",
          rateLimitPerMinute: 100,
          enableWebhooks: false,
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db
      .collection("user_settings")
      .updateOne({ userId: demoSettings.userId }, { $setOnInsert: demoSettings }, { upsert: true })

    console.log("✅ Demo data inserted successfully")

    console.log("\n🎉 Database setup completed successfully!")
    console.log("\n📋 Summary:")
    console.log("- Created 8 collections")
    console.log("- Created optimized indexes")
    console.log("- Inserted demo user, contacts, templates, and settings")
    console.log("\n🔐 Demo Login Credentials:")
    console.log("Email: demo@brandbuzzventures.com")
    console.log("Password: demo123")
  } catch (error) {
    console.error("❌ Database setup failed:", error)
  } finally {
    await client.close()
    console.log("\n🔌 Database connection closed")
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase()
}

module.exports = { setupDatabase }
