/**
 * Notifications Integration Stub
 *
 * Covers: Email (SendGrid), SMS (Twilio), Push (Firebase FCM).
 * In production: replace stub calls with real SDK calls.
 */

export interface EmailPayload {
  to: string;
  toName: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  templateId?: string;
  dynamicData?: Record<string, unknown>;
}

export interface SmsPayload {
  to: string;        // E.164 format
  from: string;
  body: string;
}

export interface PushPayload {
  fcmToken: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

/**
 * Stub: Send an email.
 * In production: POST https://api.sendgrid.com/v3/mail/send
 */
export async function sendEmail(payload: EmailPayload): Promise<{ messageId: string }> {
  console.log("[Email Stub] Sending email to:", payload.to, "subject:", payload.subject);
  // In production:
  // const sg = require('@sendgrid/mail');
  // sg.setApiKey(process.env.SENDGRID_API_KEY);
  // await sg.send({ to: payload.to, from: ..., subject: ..., html: payload.htmlBody });
  return { messageId: `stub-email-${Date.now()}` };
}

/**
 * Stub: Send SMS.
 * In production: Twilio REST API
 */
export async function sendSms(payload: SmsPayload): Promise<{ sid: string }> {
  console.log("[SMS Stub] Sending SMS to:", payload.to, "body:", payload.body.slice(0, 30));
  // In production:
  // const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  // await twilio.messages.create({ to: payload.to, from: payload.from, body: payload.body });
  return { sid: `stub-sms-${Date.now()}` };
}

/**
 * Stub: Send OTP via SMS.
 */
export async function sendOtp(phone: string): Promise<{ otp: string; expiresAt: Date }> {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  console.log("[OTP Stub] Sending OTP to:", phone, "OTP:", otp);
  await sendSms({ to: phone, from: process.env.TWILIO_FROM_NUMBER || "+15551234567", body: `Your NovaPay verification code is: ${otp}` });
  return { otp, expiresAt };
}

/**
 * Stub: Send push notification via Firebase FCM.
 */
export async function sendPushNotification(payload: PushPayload): Promise<{ messageId: string }> {
  console.log("[Push Stub] Sending push to FCM token:", payload.fcmToken.slice(0, 10) + "...", "title:", payload.title);
  // In production:
  // const admin = require('firebase-admin');
  // await admin.messaging().send({ token: payload.fcmToken, notification: { title: payload.title, body: payload.body }, data: payload.data });
  return { messageId: `stub-push-${Date.now()}` };
}

/**
 * Standard notification templates.
 */
export const templates = {
  paymentReceived: (amount: number, currency: string, sender: string): EmailPayload & { push: Omit<PushPayload, "fcmToken"> } => ({
    to: "",
    toName: "",
    subject: `You received ${currency} ${amount.toFixed(2)}`,
    htmlBody: `<p>You received <strong>${currency} ${amount.toFixed(2)}</strong> from ${sender}.</p>`,
    textBody: `You received ${currency} ${amount.toFixed(2)} from ${sender}.`,
    push: {
      title: "Payment received",
      body: `${currency} ${amount.toFixed(2)} from ${sender}`,
      data: { type: "payment_received" },
    },
  }),

  kycApproved: (): EmailPayload & { push: Omit<PushPayload, "fcmToken"> } => ({
    to: "",
    toName: "",
    subject: "Your identity has been verified",
    htmlBody: "<p>Your identity verification is complete. Your NovaPay account is now fully active.</p>",
    textBody: "Your identity verification is complete. Your NovaPay account is now fully active.",
    push: {
      title: "Identity verified",
      body: "Your account is now fully activated.",
      data: { type: "kyc_update", status: "approved" },
    },
  }),
};
