import { describe, expect, it, beforeEach } from "bun:test";
import { calculatePrice, calculateCommission, getResellerTier } from "../src/lib/pricing";
import { hashPassword, verifyPassword } from "../src/lib/auth";

describe("Pricing & Auth Utilities", () => {
  it("calculates accurate reseller discounts", () => {
    const silver = calculatePrice({ serverPrice: 1000, durationDays: 10, role: "reseller", resellerLevel: "silver", protocol: "ssh" });
    expect(silver.unitPrice).toBe(900);
    expect(silver.totalPrice).toBe(9000);

    const platinum = calculatePrice({ serverPrice: 1000, durationDays: 10, role: "reseller", resellerLevel: "platinum", protocol: "ssh" });
    expect(platinum.unitPrice).toBe(700);
    expect(platinum.totalPrice).toBe(7000);
  });

  it("calculates 3in1 protocol multiplier", () => {
    const res = calculatePrice({ serverPrice: 1000, durationDays: 10, role: "user", resellerLevel: "silver", protocol: "3in1" });
    expect(res.unitPrice).toBe(1500);
    expect(res.totalPrice).toBe(15000);
  });

  it("hashes and verifies passwords securely", async () => {
    const hash = await hashPassword("SecurePassword123!");
    expect(await verifyPassword("SecurePassword123!", hash)).toBe(true);
    expect(await verifyPassword("WrongPassword", hash)).toBe(false);
  });
});
