export const USER_ME = process.env.NEXT_PUBLIC_USER_ME ?? "Me";
export const USER_PARTNER = process.env.NEXT_PUBLIC_USER_PARTNER ?? "Partner";

export const SPLIT_RATIOS = [
  { label: "50 : 50", value: "50:50" },
  { label: "60 : 40", value: "60:40" },
  { label: "40 : 60", value: "40:60" },
  { label: "70 : 30", value: "70:30" },
  { label: "30 : 70", value: "30:70" },
  { label: "100 : 0 (Me only)", value: "100:0" },
  { label: "0 : 100 (Partner only)", value: "0:100" },
] as const;

export const CURRENCIES = ["AUD", "JPY", "KRW"] as const;
