import nodemailer from "nodemailer"

export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "vincitore.kevin01@gmail.com",
        pass: "prwkkxjvoicdddpj",
      },
    })
  }

  async sendEmail(to: string[], subject: string, htmlContent: string, textContent?: string) {
    try {
      console.log("Sending email to:", to)
      console.log("Subject:", subject)

      const mailOptions = {
        from: '"BrandBuzz Ventures" <vincitore.kevin01@gmail.com>',
        to: to.join(", "),
        subject: subject,
        html: htmlContent,
        text: textContent || this.htmlToText(htmlContent),
      }

      const result = await this.transporter.sendMail(mailOptions)

      console.log("Email sent successfully:", result.messageId)

      return {
        success: true,
        messageId: result.messageId,
        data: result,
      }
    } catch (error) {
      console.error("Email sending error:", error)
      throw error
    }
  }

  async verifyConnection() {
    try {
      await this.transporter.verify()
      console.log("Email service connection verified")
      return true
    } catch (error) {
      console.error("Email service verification failed:", error)
      return false
    }
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim()
  }
}

export const emailService = new EmailService()
