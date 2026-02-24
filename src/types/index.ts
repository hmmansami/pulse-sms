// Shared types used across the application

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

// Campaign types
export type CampaignType = "sms" | "email";
export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "paused";

export type CampaignContent = {
  body: string;
  subject?: string;
  preheader?: string;
  imageUrl?: string;
  blocks?: EmailBlock[];
};

export type EmailBlock = {
  id: string;
  type: "text" | "image" | "button" | "divider" | "spacer";
  content: Record<string, unknown>;
};

// Journey types
export type JourneyNodeType = "trigger" | "delay" | "send_sms" | "send_email" | "condition" | "split";
export type JourneyStatus = "draft" | "active" | "paused";

export type JourneyNode = {
  id: string;
  type: JourneyNodeType;
  position: { x: number; y: number };
  data: Record<string, unknown>;
};

export type JourneyEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

export type JourneyTrigger = {
  type: "event";
  event: string; // cart_abandoned, product_viewed, subscriber_created, purchase, custom
  conditions?: SegmentCondition[];
};

// Segment types
export type SegmentLogic = "and" | "or";

export type SegmentCondition = {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "gt" | "lt" | "gte" | "lte" | "in" | "not_in" | "exists" | "not_exists";
  value: string | number | boolean | string[];
};

export type SegmentRules = {
  conditions: SegmentCondition[];
  logic: SegmentLogic;
};

// Sign-up unit types
export type SignupUnitType = "popup" | "flyout" | "fullscreen" | "banner" | "embedded" | "landing_page";

export type SignupUnitDesign = {
  headline: string;
  subheadline?: string;
  ctaText: string;
  backgroundColor: string;
  textColor: string;
  ctaColor: string;
  imageUrl?: string;
  logoUrl?: string;
  fields: Array<"email" | "phone" | "firstName" | "lastName">;
};

export type DisplayRules = {
  delay: number; // seconds
  scrollPercentage?: number;
  exitIntent: boolean;
  pages: string[]; // URL patterns, empty = all pages
  devices: ("mobile" | "desktop")[];
  frequencyCap: number; // days between shows
};

// Event types
export type EventType =
  | "page_view"
  | "product_view"
  | "cart_add"
  | "cart_abandon"
  | "purchase"
  | "signup"
  | "click"
  | "sms_reply"
  | "custom";

// Message types
export type MessageStatus = "queued" | "sent" | "delivered" | "failed" | "bounced";
export type MessageChannel = "sms" | "email";

// Analytics types
export type DateRange = {
  start: Date;
  end: Date;
};

export type OverviewStats = {
  totalSubscribers: number;
  smsSubscribers: number;
  emailSubscribers: number;
  messagesSent: number;
  totalRevenue: number;
  clickRate: number;
  subscriberGrowth: number; // percentage
  revenueGrowth: number; // percentage
};

export type TimeSeriesPoint = {
  date: string;
  value: number;
};
