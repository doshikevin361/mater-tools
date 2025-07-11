const { MongoClient } = require("mongodb")

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/brandbuzz"

async function setupCallingDatabase() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log("Connected to MongoDB")

    const db = client.db()

    // Create calls collection with indexes
    await db.createCollection("calls")
    await db.collection("calls").createIndex({ userId: 1 })
    await db.collection("calls").createIndex({ callSid: 1 }, { unique: true })
    await db.collection("calls").createIndex({ createdAt: -1 })
    console.log("Created calls collection with indexes")

    // Create transactions collection with indexes
    await db.createCollection("transactions")
    await db.collection("transactions").createIndex({ userId: 1 })
    await db.collection("transactions").createIndex({ createdAt: -1 })
    console.log("Created transactions collection with indexes")

    // Ensure users collection has balance field
    await db.collection("users").updateMany(
      { balance: { $exists: false } },
      { $set: { balance: 25.0 } }, // Default balance of ₹25
    )
    console.log("Updated users with default balance")

    console.log("Database setup completed successfully!")
  } catch (error) {
    console.error("Error setting up database:", error)
  } finally {
    await client.close()
  }
}

setupCallingDatabase()
