const { MongoClient } = require("mongodb")

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/brandbuzz"

async function seedDemoData() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()

    const db = client.db("brandbuzz")

    await db.collection("users").deleteMany({})
    await db.collection("contacts").deleteMany({})
    await db.collection("campaigns").deleteMany({})

    // Create demo user
    const demoUser = {
      _id: "demo-user-123",
      firstName: "Kevin",
      lastName: "Doshi",
      email: "doshikevin36@gmail.com",
      phone: "+91-9876543210",
      company: "BrandBuzz Ventures",
      businessType: "Marketing Agency",
      plan: "Professional",
      balance: 1000.0,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.collection("users").insertOne(demoUser)

    // Create demo contacts with your email and proper phone formatting
    const demoContacts = [
      {
        name: "Kevin Doshi",
        email: "doshikevin36@gmail.com",
        phone: "+91-9876543210",
        company: "BrandBuzz Ventures",
        group: "VIP Clients",
        tags: ["founder", "vip"],
        status: "active",
        userId: "demo-user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Rahul Sharma",
        email: "rahul.sharma@example.com",
        phone: "+91-9123456789",
        company: "Tech Solutions",
        group: "Clients",
        tags: ["client", "tech"],
        status: "active",
        userId: "demo-user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Priya Patel",
        email: "priya.patel@example.com",
        phone: "+91-9234567890",
        company: "Design Studio",
        group: "Prospects",
        tags: ["prospect", "design"],
        status: "active",
        userId: "demo-user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Amit Kumar",
        email: "amit.kumar@example.com",
        phone: "+91-9345678901",
        company: "Marketing Pro",
        group: "Clients",
        tags: ["client", "marketing"],
        status: "active",
        userId: "demo-user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Sneha Gupta",
        email: "sneha.gupta@example.com",
        phone: "+91-9456789012",
        company: "E-commerce Plus",
        group: "VIP Clients",
        tags: ["vip", "ecommerce"],
        status: "active",
        userId: "demo-user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Vikram Singh",
        email: "vikram.singh@example.com",
        phone: "+91-9567890123",
        company: "Startup Hub",
        group: "Prospects",
        tags: ["prospect", "startup"],
        status: "active",
        userId: "demo-user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Anita Desai",
        email: "anita.desai@example.com",
        phone: "+91-9678901234",
        company: "Fashion Forward",
        group: "Clients",
        tags: ["client", "fashion"],
        status: "active",
        userId: "demo-user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Rajesh Mehta",
        email: "rajesh.mehta@example.com",
        phone: "+91-9789012345",
        company: "Finance First",
        group: "VIP Clients",
        tags: ["vip", "finance"],
        status: "active",
        userId: "demo-user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Kavya Nair",
        email: "kavya.nair@example.com",
        phone: "+91-9890123456",
        company: "Health Plus",
        group: "Prospects",
        tags: ["prospect", "health"],
        status: "active",
        userId: "demo-user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Arjun Reddy",
        email: "arjun.reddy@example.com",
        phone: "+91-9901234567",
        company: "Real Estate Pro",
        group: "Clients",
        tags: ["client", "realestate"],
        status: "active",
        userId: "demo-user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    await db.collection("contacts").insertMany(demoContacts)

    // Create some demo campaigns
    const demoCampaigns = [
      {
        name: "Welcome Email Campaign",
        type: "Email",
        subject: "Welcome to BrandBuzz Ventures!",
        content: "Thank you for joining us. We are excited to help you grow your business!",
        recipients: ["all"],
        recipientCount: 10,
        status: "Completed",
        sent: 10,
        delivered: 9,
        failed: 1,
        cost: 1.0,
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        completedAt: new Date(Date.now() - 86400000 + 3600000), // 1 day ago + 1 hour
        userId: "demo-user-123",
      },
      {
        name: "Product Launch WhatsApp",
        type: "WhatsApp",
        content: "🚀 Exciting news! Our new product is now live. Check it out!",
        recipients: ["VIP Clients"],
        recipientCount: 3,
        status: "Completed",
        sent: 3,
        delivered: 3,
        failed: 0,
        cost: 0.75,
        createdAt: new Date(Date.now() - 172800000), // 2 days ago
        completedAt: new Date(Date.now() - 172800000 + 1800000), // 2 days ago + 30 min
        userId: "demo-user-123",
      },
    ]

    await db.collection("campaigns").insertMany(demoCampaigns)
  } catch (error) {
    console.error("Error seeding demo data:", error)
  } finally {
    await client.close()
  }
}

seedDemoData()
