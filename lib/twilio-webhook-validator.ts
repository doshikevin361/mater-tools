import crypto from "crypto"

export function validateTwilioWebhook(
  twilioSignature: string,
  url: string,
  params: Record<string, string>,
  authToken: string,
): boolean {
  try {
    // Create the signature
    const data = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        return acc + key + params[key]
      }, url)

    const expectedSignature = crypto.createHmac("sha1", authToken).update(Buffer.from(data, "utf-8")).digest("base64")

    return crypto.timingSafeEqual(Buffer.from(twilioSignature), Buffer.from(expectedSignature))
  } catch (error) {
    console.error("Webhook validation error:", error)
    return false
  }
}

export function extractFormDataAsObject(formData: FormData): Record<string, string> {
  const params: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    params[key] = value.toString()
  }
  return params
}
