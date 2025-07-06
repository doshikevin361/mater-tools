import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

// Pre-built email templates
const EMAIL_TEMPLATES = [
  {
    id: "welcome-email",
    name: "Welcome Email",
    platform: "Email",
    category: "Welcome",
    subject: "Welcome to BrandBuzz Ventures! 🎉",
    content: `<h2>Welcome to BrandBuzz Ventures!</h2>
<p>Dear {{name}},</p>
<p>We're thrilled to have you join our community! At BrandBuzz Ventures, we're committed to helping you grow your business through effective marketing campaigns.</p>
<h3>What's Next?</h3>
<ul>
<li>✅ Explore our campaign tools</li>
<li>✅ Upload your contacts</li>
<li>✅ Create your first campaign</li>
</ul>
<p>If you have any questions, our support team is here to help!</p>
<p>Best regards,<br><strong>The BrandBuzz Team</strong></p>`,
    variables: ["name"],
    isPublic: true,
  },
  {
    id: "newsletter-template",
    name: "Monthly Newsletter",
    platform: "Email",
    category: "Newsletter",
    subject: "Your Monthly Update from {{company}}",
    content: `<h2>📧 Monthly Newsletter</h2>
<p>Hi {{name}},</p>
<p>Here's what's been happening this month:</p>
<h3>🚀 New Features</h3>
<p>We've added some exciting new features to help you grow your business.</p>
<h3>📊 Your Stats</h3>
<p>Your campaigns have been performing great! Keep up the good work.</p>
<h3>💡 Tips & Tricks</h3>
<p>Here are some tips to improve your campaign performance...</p>
<p>Thanks for being part of our community!</p>
<p>Best,<br><strong>{{company}} Team</strong></p>`,
    variables: ["name", "company"],
    isPublic: true,
  },
  {
    id: "promotion-email",
    name: "Special Promotion",
    platform: "Email",
    category: "Promotion",
    subject: "🔥 Special Offer Just for You!",
    content: `<h2>🎯 Special Promotion!</h2>
<p>Hi {{name}},</p>
<p>We have an exclusive offer just for you!</p>
<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
<h3>🎯 Get 50% Off Your Next Campaign</h3>
<p><strong>Promo Code:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px;">SAVE50</code></p>
<p><strong>Valid until:</strong> {{expiry_date}}</p>
</div>
<p>Don't miss out on this limited-time offer!</p>
<p><a href="{{cta_link}}" class="btn">Claim Your Discount</a></p>
<p>Happy marketing!<br><strong>The BrandBuzz Team</strong></p>`,
    variables: ["name", "expiry_date", "cta_link"],
    isPublic: true,
  },
  {
    id: "event-invitation",
    name: "Event Invitation",
    platform: "Email",
    category: "Event",
    subject: "You're Invited: {{event_name}}",
    content: `<h2>🎉 You're Invited!</h2>
<p>Dear {{name}},</p>
<p>We're excited to invite you to our upcoming event:</p>
<div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
<h3>{{event_name}}</h3>
<p><strong>📅 Date:</strong> {{event_date}}</p>
<p><strong>🕐 Time:</strong> {{event_time}}</p>
<p><strong>📍 Location:</strong> {{event_location}}</p>
</div>
<p>This event will cover:</p>
<ul>
<li>📈 Latest marketing trends</li>
<li>🎯 Campaign optimization strategies</li>
<li>🤝 Networking opportunities</li>
</ul>
<p><a href="{{rsvp_link}}" class="btn">RSVP Now</a></p>
<p>We look forward to seeing you there!</p>
<p>Best regards,<br><strong>Event Team</strong></p>`,
    variables: ["name", "event_name", "event_date", "event_time", "event_location", "rsvp_link"],
    isPublic: true,
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const platform = searchParams.get("platform")
    const category = searchParams.get("category")
    const userId = searchParams.get("userId")

    const db = await getDatabase()

    let templates = []

    // Get public templates
    if (platform) {
      templates = EMAIL_TEMPLATES.filter((t) => t.platform.toLowerCase() === platform.toLowerCase())
    } else {
      templates = EMAIL_TEMPLATES
    }

    // Get user's custom templates
    if (userId) {
      const customTemplates = await db
        .collection("templates")
        .find({
          userId,
          ...(platform && { platform: { $regex: new RegExp(platform, "i") } }),
          ...(category && { category: { $regex: new RegExp(category, "i") } }),
        })
        .toArray()

      templates = [...templates, ...customTemplates]
    }

    // Filter by category if specified
    if (category) {
      templates = templates.filter((t) => t.category.toLowerCase() === category.toLowerCase())
    }

    return NextResponse.json({
      success: true,
      templates,
      total: templates.length,
    })
  } catch (error) {
    console.error("Templates fetch error:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch templates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, platform, category, content, subject, variables, userId } = body

    if (!name || !platform || !content || !userId) {
      return NextResponse.json(
        { success: false, message: "Name, platform, content, and userId are required" },
        { status: 400 },
      )
    }

    const db = await getDatabase()

    const template = {
      name,
      platform,
      category: category || "Custom",
      content,
      subject: subject || null,
      variables: variables || [],
      userId,
      isPublic: false,
      usage: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("templates").insertOne(template)

    return NextResponse.json({
      success: true,
      message: "Template created successfully",
      template: { ...template, _id: result.insertedId },
    })
  } catch (error) {
    console.error("Template creation error:", error)
    return NextResponse.json({ success: false, message: "Failed to create template" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get("id")
    const userId = searchParams.get("userId")

    if (!templateId || !userId) {
      return NextResponse.json({ success: false, message: "Template ID and User ID are required" }, { status: 400 })
    }

    const db = await getDatabase()

    const result = await db.collection("templates").deleteOne({
      _id: new (require("mongodb").ObjectId)(templateId),
      userId,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: "Template not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Template deleted successfully",
    })
  } catch (error) {
    console.error("Template deletion error:", error)
    return NextResponse.json({ success: false, message: "Failed to delete template" }, { status: 500 })
  }
}
