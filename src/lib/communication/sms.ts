const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER;

export async function sendSMS(params: {
  to: string;
  body: string;
}): Promise<{ success: boolean; message_id?: string }> {
  if (!TWILIO_SID || TWILIO_SID.startsWith("REPLACE") || !TWILIO_FROM) {
    console.log(`[SMS MOCK] To: ${params.to}\n${params.body}`);
    return { success: true, message_id: `mock-sms-${Date.now()}` };
  }

  const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64");

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: TWILIO_FROM,
          To: params.to,
          Body: params.body,
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      console.error("Twilio error:", data.message);
      return { success: false };
    }

    return { success: true, message_id: data.sid };
  } catch (e) {
    console.error("SMS send failed:", e);
    return { success: false };
  }
}

export function buildNegotiationSMS(
  make: string,
  model: string,
  year: number,
  round: number,
  message: string
): string {
  // SMS messages should be short
  if (round === 0) {
    return `Hi, I'm inquiring about your ${year} ${make} ${model}. I represent a buyer shopping multiple dealers. What's your best out-the-door price? -Alex (AutoFair)`;
  }
  // Truncate for SMS
  return message.length > 300 ? message.slice(0, 297) + "..." : message;
}
