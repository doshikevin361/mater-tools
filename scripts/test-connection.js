const { MongoClient } = require("mongodb")

async function testConnection() {
  const uri =
    process.env.MONGODB_URI ||
    "mongodb+srv://ahdoshi1108:mzfMJvyetmqM49kU@cluster0.sjmsliu.mongodb.net/brandbuzz_ventures?retryWrites=true&w=majority&appName=Cluster0"

  console.log("🔄 Testing MongoDB connection...")
  console.log("URI:", uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@"))

  const client = new MongoClient(uri)

  try {
    await client.connect()
    console.log("✅ Connected to MongoDB successfully!")

    const db = client.db("brandbuzz_ventures")
    const collections = await db.listCollections().toArray()
    console.log(
      "📊 Available collections:",
      collections.map((c) => c.name),
    )

    return true
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message)
    return false
  } finally {
    await client.close()
  }
}

testConnection()
