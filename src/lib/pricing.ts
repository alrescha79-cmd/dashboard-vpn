export type UserRole = "user" | "reseller" | "admin";
export type ResellerLevel = "silver" | "gold" | "platinum";

export interface PriceCalculationParams {
  serverPrice: number;
  durationDays: number;
  role: UserRole;
  resellerLevel: ResellerLevel;
  protocol: string;
}

export interface PriceCalculationResult {
  unitPrice: number;
  totalPrice: number;
  discountRate: number;
  multiplier: number;
}

export function calculatePrice(params: PriceCalculationParams): PriceCalculationResult {
  const { serverPrice, durationDays, role, resellerLevel, protocol } = params;

  if (role === "admin") {
    return { unitPrice: 0, totalPrice: 0, discountRate: 1, multiplier: 1 };
  }

  let discountRate = 0;
  if (role === "reseller") {
    if (resellerLevel === "platinum") discountRate = 0.3;
    else if (resellerLevel === "gold") discountRate = 0.2;
    else discountRate = 0.1;
  }

  const multiplier = protocol.toLowerCase() === "3in1" ? 1.5 : 1;
  const unitPrice = Math.floor(serverPrice * (1 - discountRate) * multiplier);
  const totalPrice = unitPrice * durationDays;

  return { unitPrice, totalPrice, discountRate, multiplier };
}

export function calculateCommission(params: { serverPrice: number; durationDays: number; role: UserRole }): number {
  if (params.role !== "reseller") return 0;
  return Math.floor(params.serverPrice * params.durationDays * 0.1);
}

export function getResellerTier(totalCommission: number): ResellerLevel {
  if (totalCommission >= 80000) return "platinum";
  if (totalCommission >= 50000) return "gold";
  return "silver";
}
