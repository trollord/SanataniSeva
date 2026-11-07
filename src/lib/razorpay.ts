import Razorpay from "razorpay";
import crypto from "crypto";

let _razorpay: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!_razorpay) {
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return _razorpay;
}

/** @deprecated Use getRazorpay() instead - kept for backwards compatibility */
export const razorpay = {
  get orders() {
    return getRazorpay().orders;
  },
};

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}

export const PLATFORM_FEE_PAISE = 999900; // ₹9,999 in paise

export async function createRazorpayOrder(amount: number, receipt: string) {
  return getRazorpay().orders.create({ amount, currency: "INR", receipt });
}
