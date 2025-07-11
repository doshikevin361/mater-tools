const { MongoClient } = require("mongodb")

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/brandbuzz"

async function setupCallingDatabase() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log("Connected to MongoDB")

    const db = client.db()

    // Create call_history collection with indexes
    const callHistoryCollection = db.collection("call_history")
    await callHistoryCollection.createIndex({ userId: 1, createdAt: -1 })
    await callHistoryCollection.createIndex({ callSid: 1 }, { unique: true })
    await callHistoryCollection.createIndex({ status: 1 })
    console.log("✅ call_history collection and indexes created")

    // Create transactions collection with indexes
    const transactionsCollection = db.collection("transactions")
    await transactionsCollection.createIndex({ userId: 1, createdAt: -1 })
    await transactionsCollection.createIndex({ type: 1 })
    await transactionsCollection.createIndex({ callSid: 1 })
    console.log("✅ transactions collection and indexes created")

    // Update users collection to include balance field
    const usersCollection = db.collection("users")
    await usersCollection.createIndex({ email: 1 }, { unique: true })

    // Add balance field to existing users if they don't have it
    await usersCollection.updateMany(
      { balance: { $exists: false } },
      { $set: { balance: 100.0 } }, // Give new users ₹100 starting balance
    )
    console.log("✅ users collection updated with balance field")

    // Create sample user for testing (if not exists)
    const existingUser = await usersCollection.findOne({ email: "test@brandbuzz.com" })
    if (!existingUser) {
      await usersCollection.insertOne({
        _id: "test_user_123",
        name: "Test User",
        email: "test@brandbuzz.com",
        phone: "+91 98765 43210",
        balance: 500.0,
        plan: "premium",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      console.log("✅ Test user created with ₹500 balance")
    }

    console.log("\n🎉 Calling database setup completed successfully!")
    console.log("\nNext steps:")
    console.log("1. Make sure your Twilio credentials are set in .env.local")
    console.log("2. Set NEXT_PUBLIC_BASE_URL to your domain")
    console.log("3. Configure Twilio webhooks to point to your domain")
    console.log("4. Test the calling functionality")
  } catch (error) {
    console.error("❌ Error setting up calling database:", error)
  } finally {
    await client.close()
  }
}

setupCallingDatabase()
