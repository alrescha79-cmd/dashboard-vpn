import { describe, expect, it } from "bun:test";
import { verifyTripaySignature } from "../src/modules/payments/tripay";
import { verifyDuitkuCallbackSignature } from "../src/modules/payments/duitku";
import { verifyMidtransSignature } from "../src/modules/payments/midtrans";
import { createHmac, createHash } from "crypto";

describe("Payment Gateway Signature Verification", () => {
  it("verifies Tripay HMAC-SHA256 signature", () => {
    const rawBody = '{"merchant_ref":"ORDER-101","status":"PAID"}';
    const secret = "my_secret_key";
    const signature = createHmac("sha256", secret).update(rawBody).digest("hex");
    expect(verifyTripaySignature(rawBody, signature, secret)).toBe(true);
    expect(verifyTripaySignature(rawBody, "invalid", secret)).toBe(false);
  });

  it("verifies Duitku MD5 signature", () => {
    const code = "M123";
    const amount = "50000";
    const orderId = "ORDER-101";
    const key = "api_key";
    const sig = createHash("md5").update(`${code}${amount}${orderId}${key}`).digest("hex");
    expect(verifyDuitkuCallbackSignature({ merchantCode: code, amount, merchantOrderId: orderId, signature: sig, apiKey: key })).toBe(true);
  });

  it("verifies Midtrans SHA512 signature", () => {
    const orderId = "ORDER-101";
    const statusCode = "200";
    const grossAmount = "50000.00";
    const serverKey = "midtrans_key";
    const sig = createHash("sha512").update(`${orderId}${statusCode}${grossAmount}${serverKey}`).digest("hex");
    expect(verifyMidtransSignature({ orderId, statusCode, grossAmount, signature: sig, serverKey })).toBe(true);
  });
});
