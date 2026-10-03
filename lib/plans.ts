export type Plan = {
  id: string;
  tag?: string;
  price: number;
  validityDays: number;
  totalIncome: number;
  dailyIncome: number;
};

/** Display-only catalogue. Plan purchasing is not wired to a backend yet. */
export const PLANS: Plan[] = [
  { id: "p500", price: 500, validityDays: 25, totalIncome: 4750, dailyIncome: 190 },
  { id: "p7100", price: 7100, validityDays: 25, totalIncome: 7500, dailyIncome: 300 },
  { id: "p15000", price: 15000, validityDays: 27, totalIncome: 12150, dailyIncome: 450 },
  { id: "p21000", price: 21000, validityDays: 30, totalIncome: 18750, dailyIncome: 625 },
  { id: "p50000", price: 50000, validityDays: 32, totalIncome: 51168, dailyIncome: 1599 },
  { id: "lp2", tag: "LIMITED TIME PLAN 2", price: 20000, validityDays: 20, totalIncome: 38000, dailyIncome: 1900 },
  { id: "lp1", tag: "LIMITED TIME PLAN 1", price: 10000, validityDays: 26, totalIncome: 15600, dailyIncome: 600 },
  { id: "p35000", price: 35000, validityDays: 30, totalIncome: 13500, dailyIncome: 450 },
];