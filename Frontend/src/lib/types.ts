/**
 * Shared domain types — mirrors the shapes returned by the Express API
 * (server/) and used across the frontend.
 */

export type UserRole = "user" | "superadmin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  hasSeenOnboarding?: boolean;
  createdAt?: string;
}

export interface Property {
  id: string;
  name: string;
  city: string;
  type: string;
  description?: string;
  totalValue: number;
  pricePerShare: number;
  totalShares: number;
  soldShares: number;
  yieldPct: number;
  imageUrl?: string;
  featured?: boolean;
  investingOpen?: boolean;
  status?: string;
  hue: number;
  initials?: string;
  createdAt?: string;
}

export interface UserRef {
  id: string;
  name: string;
  email: string;
}

export interface Transaction {
  id: string;
  propertyId: string;
  propertyName?: string;
  name?: string;
  shares: number;
  pricePerShare: number;
  total: number;
  teamFee?: number;
  teamFeePct?: number;
  teamFeeAmount?: number;
  date?: string;
  time?: string;
  createdAt?: string;
  user?: UserRef;
}

export interface PurchaseRequest {
  id: string;
  propertyId: string;
  propertyName: string;
  shares: number;
  pricePerShare?: number;
  totalCost: number;
  teamFeeAmount?: number;
  teamFeePct?: number;
  status: string;
  date?: string;
  createdAt?: string;
  user?: UserRef;
}

export interface Token {
  id: string;
  tokenId: string;
  symbol?: string;
  propertyName: string;
  propertyId?: string;
  shares: number;
  totalValue: number;
  pricePerShare: number;
  ownerName?: string;
  owner?: { id?: string; name?: string };
  timestamp?: string;
  txHash?: string;
  blockNumber?: number;
  previousHash?: string;
  hash?: string;
  nonce?: number;
  kind?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  read?: boolean;
  audience?: string;
  channel?: string;
  createdAt?: string;
}

export interface Activity {
  id: string;
  message: string;
  type: string;
  createdAt?: string;
  actor?: { id?: string; name?: string };
  user?: { id?: string; name?: string };
}

export interface ErrorLog {
  id: string;
  message: string;
  type: string;
  path?: string;
  method?: string;
  stack?: string;
  createdAt?: string;
}

export interface StatItem {
  label: string;
  value: string;
}

export interface FeatureItem {
  title: string;
  text: string;
}

export interface TestimonialItem {
  quote: string;
  name: string;
  role: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface BlogItem {
  title: string;
  excerpt: string;
  date: string;
  tag: string;
}

export interface SiteContent {
  hero: {
    badge: string;
    title: string;
    highlight: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
  };
  stats: StatItem[];
  features: FeatureItem[];
  testimonials: TestimonialItem[];
  faqs: FaqItem[];
  blog: BlogItem[];
  cta: {
    title: string;
    subtitle: string;
    button: string;
  };
}

export interface PlatformSettings {
  platformName?: string;
  supportEmail?: string;
  tagline?: string;
  minInvestment?: string;
  sessionTimeout?: string;
  passwordMinLength?: string;
  allowRegistration?: boolean;
  requireApproval?: boolean;
}

export interface AdminSettingsState {
  teamFee: number;
  teamEarnings: number;
  termsVersion?: string;
}

export interface Holding {
  propertyId: string;
  name: string;
  shares: number;
  invested: number;
}

export interface PortfolioTotals {
  invested: number;
  shares: number;
  count: number;
}

// NOTE: type aliases (not interfaces) so the chart components' index-signature
// data prop accepts them (interfaces don't get implicit index signatures).
export type PortfolioPoint = {
  label: string;
  invested: number;
};

export type FinancialSeriesPoint = {
  month: string;
  invested: number;
  fees: number;
  count: number;
};
