export const BRAND = {
  name: "ZetaGrow",
  tagline: "Learn. Work. Grow.",
  supportEmail: "support@zetagrow.com",
  defaultCurrency: "INR",
  currencySymbol: "₹",
};

export const THEME_COLORS = {
  primary: "#176B4D",
  primaryHover: "#13573E",
  background: "#FAFAF7",
  surface: "#FFFFFF",
  textMain: "#202522",
  textMuted: "#69736D",
  border: "#E4E8E5",
  success: "#15803D",
  warning: "#B45309",
  error: "#B91C1C",
  info: "#1D4ED8",
};

export const DEFAULT_PROGRAMS = [
  {
    name: "Starter Digital Skills",
    slug: "starter-digital-skills",
    price: 2000,
    shortDescription: "Essential modern workplace and foundational digital productivity skills.",
    duration: "4 Weeks",
  },
  {
    name: "Growth Professional",
    slug: "growth-professional",
    price: 4000,
    shortDescription: "Intermediate technical workflows, content operations, and client project management.",
    duration: "8 Weeks",
  },
  {
    name: "Advanced Pro Specialist",
    slug: "advanced-pro-specialist",
    price: 8000,
    shortDescription: "Advanced specialized workflows, high-ticket work delivery, and team leadership.",
    duration: "12 Weeks",
  },
  {
    name: "Premium Master Program",
    slug: "premium-master-program",
    price: 14000,
    shortDescription: "Complete full-stack mastery, direct job matchmaking priority, and premium resources.",
    duration: "24 Weeks",
  },
];

export const DEFAULT_AFFILIATE_SETTINGS = {
  enabled: true,
  commissionMethod: "lower_program_rule", // 50% of lower priced program
  defaultPercentage: 50,
  holdingPeriodDays: 7,
  minimumPurchaseAmount: 2000,
};

export const DEFAULT_WITHDRAWAL_SETTINGS = {
  minimumWithdrawal: 1000,
  maximumWithdrawal: 100000,
  dailyLimit: 25000,
  monthlyLimit: 200000,
  feePercentage: 2,
  fixedFee: 0,
  allowedMethods: ["bank_transfer", "upi"] as const,
};
