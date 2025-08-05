const { MongoClient } = require("mongodb")

async function testMessageLogs() {
  const uri =
    process.env.MONGODB_URI ||
    "mongodb+srv://ahdoshi1108:mzfMJvyetmqM49kU@cluster0.sjmsliu.mongodb.net/brandbuzz_ventures?retryWrites=true&w=majority&appName=Cluster0"

  console.log("🔄 Testing message logs...")

  const client = new MongoClient(uri)

  try {
    await client.connect()
    console.log("✅ Connected to MongoDB successfully!")

    const db = client.db("brandbuzz_ventures")

    // Check campaigns
    const campaigns = await db.collection("campaigns").find({}).limit(5).toArray()
    console.log(`📊 Found ${campaigns.length} campaigns:`)
    campaigns.forEach(campaign => {
      console.log(`  - ${campaign.name} (${campaign.type}): ${campaign.recipientCount} recipients, ${campaign.sent} sent`)
    })

    // Check message logs
    const messageLogs = await db.collection("message_logs").find({}).limit(10).toArray()
    console.log(`📊 Found ${messageLogs.length} message logs:`)
    messageLogs.forEach(log => {
      console.log(`  - ${log.contactName} (${log.contactPhone || log.contactEmail}): ${log.status}`)
    })

    // Check if campaigns have corresponding message logs
    for (const campaign of campaigns) {
      const logs = await db.collection("message_logs").find({ 
        campaignId: campaign._id.toString() 
      }).toArray()
      console.log(`📋 Campaign "${campaign.name}" has ${logs.length} message logs`)
    }

    return true
  } catch (error) {
    console.error("❌ Test failed:", error.message)
    return false
  } finally {
    await client.close()
  }
}

testMessageLogs() 