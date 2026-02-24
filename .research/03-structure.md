# Pulse SMS — Full Structure (Attentive Clone)

## Outcome
Pulse is an AI-powered SMS and email marketing platform for ecommerce brands. It lets brands grow their subscriber lists with embeddable sign-up units, send personalized campaigns, automate triggered journeys (abandoned cart, welcome series, etc.), and track revenue attribution — all from a single dashboard. The goal: make SMS the highest-ROI marketing channel for every ecommerce brand.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                     │
│  Dashboard │ Campaigns │ Journeys │ Subscribers │ Analytics│
└──────────────────────┬──────────────────────────────────┘
                       │ tRPC / API Routes
┌──────────────────────▼──────────────────────────────────┐
│                   Backend (Next.js API)                   │
│  Auth │ Campaign Engine │ Journey Engine │ Segment Engine │
└───┬──────────┬────────────┬──────────────┬──────────────┘
    │          │            │              │
┌───▼───┐ ┌───▼────┐ ┌────▼─────┐ ┌─────▼──────┐
│Postgres│ │ Redis  │ │ Twilio   │ │  Resend    │
│(Prisma)│ │(Queue) │ │(SMS/MMS) │ │  (Email)   │
└────────┘ └────────┘ └──────────┘ └────────────┘
```

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 14 (App Router) | Full-stack, SSR, API routes |
| Language | TypeScript | Type safety across frontend + backend |
| Styling | Tailwind CSS + shadcn/ui | Rapid, consistent UI |
| Database | PostgreSQL + Prisma | Relational data, JSON attributes, proven at scale |
| Auth | NextAuth.js (Auth.js v5) | Multi-provider, session management |
| Job Queue | BullMQ + Redis | Scheduled sends, journey step execution, retries |
| SMS | Twilio Programmable Messaging | Industry standard SMS API |
| Email | Resend | Modern email API, React email templates |
| AI | OpenAI API (GPT-4) | Content generation, send time optimization |
| File Storage | Cloudinary / S3 | MMS images, email assets |
| Charts | Recharts | React-native charting for dashboards |
| State | Zustand | Lightweight client state for builders |
| Drag-and-Drop | @dnd-kit | Journey builder node interactions |
| Monorepo | Turborepo (optional) | If splitting packages |

## Database Schema

```prisma
// ========================
// AUTH & WORKSPACE
// ========================

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  workspaces    WorkspaceMember[]
  accounts      Account[]
  sessions      Session[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Workspace {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  plan        String   @default("free") // free, starter, pro, enterprise
  twilioSid   String?
  twilioToken String?
  twilioPhone String?
  resendKey   String?
  openaiKey   String?
  timezone    String   @default("America/New_York")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  members     WorkspaceMember[]
  subscribers Subscriber[]
  segments    Segment[]
  campaigns   Campaign[]
  journeys    Journey[]
  signupUnits SignupUnit[]
  messages    Message[]
  events      Event[]
  webhooks    Webhook[]
  apiKeys     ApiKey[]
}

model WorkspaceMember {
  id          String   @id @default(cuid())
  userId      String
  workspaceId String
  role        String   @default("member") // owner, admin, member
  user        User     @relation(fields: [userId], references: [id])
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  @@unique([userId, workspaceId])
}

model ApiKey {
  id          String   @id @default(cuid())
  workspaceId String
  name        String
  key         String   @unique
  lastUsed    DateTime?
  createdAt   DateTime @default(now())
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
}

// ========================
// SUBSCRIBERS
// ========================

model Subscriber {
  id            String    @id @default(cuid())
  workspaceId   String
  phone         String?
  email         String?
  firstName     String?
  lastName      String?
  smsConsent    Boolean   @default(false)
  emailConsent  Boolean   @default(false)
  smsOptInAt    DateTime?
  emailOptInAt  DateTime?
  smsOptOutAt   DateTime?
  emailOptOutAt DateTime?
  source        String?   // signup_unit, import, api, shopify
  customAttrs   Json?     @default("{}")
  timezone      String?
  country       String?
  city          String?
  tags          String[]  @default([])
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  workspace     Workspace @relation(fields: [workspaceId], references: [id])
  events        Event[]
  messages      Message[]
  segmentMemberships SegmentMembership[]
  journeyStates JourneySubscriberState[]
  consentLog    ConsentLog[]
  @@unique([workspaceId, phone])
  @@unique([workspaceId, email])
  @@index([workspaceId, smsConsent])
  @@index([workspaceId, emailConsent])
}

model ConsentLog {
  id           String   @id @default(cuid())
  subscriberId String
  channel      String   // sms, email
  action       String   // opt_in, opt_out
  method       String   // two_tap, form, keyword, import, api
  ipAddress    String?
  userAgent    String?
  metadata     Json?
  createdAt    DateTime @default(now())
  subscriber   Subscriber @relation(fields: [subscriberId], references: [id])
}

// ========================
// SEGMENTS
// ========================

model Segment {
  id          String   @id @default(cuid())
  workspaceId String
  name        String
  description String?
  rules       Json     // { conditions: [{ field, operator, value }], logic: "and" | "or" }
  subscriberCount Int  @default(0)
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  memberships SegmentMembership[]
}

model SegmentMembership {
  id           String   @id @default(cuid())
  segmentId    String
  subscriberId String
  addedAt      DateTime @default(now())
  segment      Segment    @relation(fields: [segmentId], references: [id])
  subscriber   Subscriber @relation(fields: [subscriberId], references: [id])
  @@unique([segmentId, subscriberId])
}

// ========================
// CAMPAIGNS
// ========================

model Campaign {
  id          String    @id @default(cuid())
  workspaceId String
  name        String
  type        String    // sms, email
  status      String    @default("draft") // draft, scheduled, sending, sent, paused
  content     Json      // { body, subject?, preheader?, imageUrl?, blocks? }
  segmentIds  String[]  @default([])
  scheduledAt DateTime?
  sentAt      DateTime?
  sendCount   Int       @default(0)
  abTest      Json?     // { variants: [{ content, weight }], winnerMetric, duration }
  aiGenerated Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  messages    Message[]
}

// ========================
// JOURNEYS (Automations)
// ========================

model Journey {
  id          String   @id @default(cuid())
  workspaceId String
  name        String
  status      String   @default("draft") // draft, active, paused
  trigger     Json     // { type: "event", event: "cart_abandoned", conditions?: [...] }
  nodes       Json     // Array of journey nodes (steps)
  edges       Json     // Array of connections between nodes
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  states      JourneySubscriberState[]
}

// Tracks each subscriber's position in a journey
model JourneySubscriberState {
  id            String    @id @default(cuid())
  journeyId     String
  subscriberId  String
  currentNodeId String?
  status        String    @default("active") // active, completed, exited
  enteredAt     DateTime  @default(now())
  completedAt   DateTime?
  journey       Journey    @relation(fields: [journeyId], references: [id])
  subscriber    Subscriber @relation(fields: [subscriberId], references: [id])
  @@unique([journeyId, subscriberId])
}

// ========================
// SIGN-UP UNITS
// ========================

model SignupUnit {
  id          String   @id @default(cuid())
  workspaceId String
  name        String
  type        String   // popup, flyout, fullscreen, banner, embedded, landing_page
  status      String   @default("draft") // draft, active, paused
  design      Json     // { theme, colors, text, images, fields, cta }
  displayRules Json    // { delay, scroll, exitIntent, pages, devices, frequency }
  collectEmail Boolean @default(true)
  collectSms   Boolean @default(true)
  offerType   String?  // percentage, fixed, freeShipping, none
  offerValue  String?
  views       Int      @default(0)
  submissions Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
}

// ========================
// MESSAGES (sent messages log)
// ========================

model Message {
  id           String    @id @default(cuid())
  workspaceId  String
  subscriberId String
  campaignId   String?
  journeyId    String?
  channel      String    // sms, email
  content      Json      // { body, subject?, imageUrl? }
  status       String    @default("queued") // queued, sent, delivered, failed, bounced
  sentAt       DateTime?
  deliveredAt  DateTime?
  clickedAt    DateTime?
  revenue      Float     @default(0)
  externalId   String?   // Twilio SID or Resend ID
  createdAt    DateTime  @default(now())
  workspace    Workspace  @relation(fields: [workspaceId], references: [id])
  subscriber   Subscriber @relation(fields: [subscriberId], references: [id])
  campaign     Campaign?  @relation(fields: [campaignId], references: [id])
  @@index([workspaceId, channel, sentAt])
  @@index([campaignId])
}

// ========================
// EVENTS (subscriber activity)
// ========================

model Event {
  id           String   @id @default(cuid())
  workspaceId  String
  subscriberId String?
  type         String   // page_view, product_view, cart_add, cart_abandon, purchase, signup, click, sms_reply
  properties   Json?    // { productId, productName, price, url, orderId, revenue, ... }
  createdAt    DateTime @default(now())
  workspace    Workspace  @relation(fields: [workspaceId], references: [id])
  subscriber   Subscriber? @relation(fields: [subscriberId], references: [id])
  @@index([workspaceId, type, createdAt])
  @@index([subscriberId, type])
}

// ========================
// WEBHOOKS & INTEGRATIONS
// ========================

model Webhook {
  id          String   @id @default(cuid())
  workspaceId String
  url         String
  events      String[] // ["subscriber.opted_in", "message.sent", "message.clicked"]
  secret      String
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
}
```

## Features Breakdown

### Feature 1: Authentication & Workspace Management
- **Outcome it delivers:** Secure multi-tenant access with team collaboration
- **How it works:** NextAuth.js with email/password + Google OAuth. Each user belongs to one or more workspaces. Workspace holds all platform config (Twilio keys, etc).
- **Components:** Login page, Register page, Workspace selector, Settings page, Team management, Billing placeholder
- **API endpoints:**
  - `POST /api/auth/[...nextauth]` — Auth handlers
  - `GET/PUT /api/workspace` — Get/update workspace settings
  - `GET/POST/DELETE /api/workspace/members` — Team management
  - `POST/DELETE /api/workspace/api-keys` — API key management
- **Database models:** User, Account, Session, Workspace, WorkspaceMember, ApiKey
- **Connects to:** Everything (auth context required everywhere)
- **Inputs:** None (foundation layer)
- **Outputs:** Auth session, workspace context, user info to all features

### Feature 2: Subscriber Management
- **Outcome it delivers:** Centralized database of all SMS/email subscribers with rich profiles
- **How it works:** CRUD operations on subscribers. Import via CSV. Assign tags. View activity history. Custom attributes stored as JSON.
- **Components:** Subscriber list table (sortable, filterable, paginated), Subscriber detail view, Import modal (CSV), Tag manager, Attribute editor
- **API endpoints:**
  - `GET /api/subscribers` — List with filters, pagination, search
  - `GET /api/subscribers/:id` — Subscriber detail with events
  - `POST /api/subscribers` — Create subscriber
  - `PUT /api/subscribers/:id` — Update subscriber
  - `DELETE /api/subscribers/:id` — Delete subscriber
  - `POST /api/subscribers/import` — CSV import
  - `POST /api/subscribers/export` — CSV export
- **Database models:** Subscriber, ConsentLog, Event
- **Connects to:** Segments, Campaigns, Journeys, Sign-up Units, Analytics
- **Inputs:** Events from Sign-up Units, Shopify webhooks, API, CSV imports
- **Outputs:** Subscriber data to Campaigns (send targets), Journeys (trigger evaluation), Segments (membership), Analytics (subscriber growth)

### Feature 3: Segmentation Engine
- **Outcome it delivers:** Dynamic audience groups based on attributes and behavior for targeted messaging
- **How it works:** Visual rule builder with AND/OR logic. Conditions on subscriber fields (location, tags, custom attrs) and behavioral events (purchased, clicked, viewed). Segments recalculate on subscriber data changes.
- **Components:** Segment list page, Segment builder (rule editor with conditions), Segment detail (member list), Condition row component (field selector, operator, value)
- **API endpoints:**
  - `GET /api/segments` — List all segments
  - `POST /api/segments` — Create segment with rules
  - `PUT /api/segments/:id` — Update rules
  - `DELETE /api/segments/:id` — Delete segment
  - `GET /api/segments/:id/subscribers` — Get segment members
  - `POST /api/segments/:id/evaluate` — Recalculate membership
- **Database models:** Segment, SegmentMembership
- **Connects to:** Campaigns (target audience), Journeys (entry conditions), Subscribers
- **Inputs:** Subscriber data changes, Event data
- **Outputs:** Subscriber lists to Campaigns and Journeys

### Feature 4: Campaign Builder & Messaging Engine
- **Outcome it delivers:** Create, schedule, and send SMS/email campaigns with tracking
- **How it works:**
  - SMS: Text editor with merge tags, character counter, MMS image upload
  - Email: Block-based email editor with drag-and-drop sections
  - Schedule or send immediately to selected segments
  - A/B testing with auto-winner selection
  - BullMQ job queue processes sends in batches via Twilio (SMS) and Resend (email)
  - Click tracking via redirect URLs
- **Components:** Campaign list page, SMS composer (text + merge tags + char count), Email builder (block editor), Audience selector (segment picker), Schedule picker, A/B test configurator, Campaign detail/results page, Preview (phone mockup + email preview)
- **API endpoints:**
  - `GET /api/campaigns` — List campaigns
  - `POST /api/campaigns` — Create campaign
  - `PUT /api/campaigns/:id` — Update campaign
  - `DELETE /api/campaigns/:id` — Delete campaign
  - `POST /api/campaigns/:id/send` — Queue campaign for sending
  - `POST /api/campaigns/:id/schedule` — Schedule campaign
  - `GET /api/campaigns/:id/results` — Get campaign analytics
  - `POST /api/campaigns/:id/test` — Send test message
  - `GET /api/track/c/:trackingId` — Click tracking redirect
- **Database models:** Campaign, Message
- **Connects to:** Subscribers (recipients), Segments (targeting), Analytics (results), Queue (BullMQ)
- **Inputs:** Segment subscriber lists, Subscriber data for merge tags
- **Outputs:** Messages to SMS/Email providers, Message records, Click/delivery events to Analytics

### Feature 5: Journey Builder (Automations)
- **Outcome it delivers:** Visual automation flows that trigger personalized messages based on customer behavior
- **How it works:**
  - Visual canvas with drag-and-drop nodes: Trigger, Delay, Send SMS, Send Email, Condition (if/else), Split
  - Triggers: subscriber events (signup, cart_abandon, purchase, browse_abandon, custom)
  - When an event fires, subscribers matching the trigger enter the journey
  - BullMQ processes delayed steps (e.g., "wait 30 minutes then send")
  - JourneySubscriberState tracks each subscriber's position
- **Components:** Journey list page, Visual canvas (React Flow / custom with dnd-kit), Node palette (draggable node types), Node config panels (trigger config, message editor, delay picker, condition builder), Journey toolbar (activate, pause, stats)
- **API endpoints:**
  - `GET /api/journeys` — List journeys
  - `POST /api/journeys` — Create journey
  - `PUT /api/journeys/:id` — Update journey (nodes/edges)
  - `DELETE /api/journeys/:id` — Delete journey
  - `PUT /api/journeys/:id/status` — Activate/pause journey
  - `GET /api/journeys/:id/stats` — Journey performance stats
- **Database models:** Journey, JourneySubscriberState
- **Connects to:** Events (triggers), Subscribers, Campaign/Messaging engine (send), Segments (conditions), Analytics
- **Inputs:** Events (trigger journey entry), Subscriber data (conditions/personalization)
- **Outputs:** Queued messages to Messaging engine, Journey analytics to Analytics

### Feature 6: Sign-Up Unit Builder
- **Outcome it delivers:** Embeddable popups and forms that grow subscriber lists on any website
- **How it works:**
  - Visual builder to design popup/banner/flyout sign-up forms
  - Display rules: delay, scroll percentage, exit intent, page targeting, device targeting, frequency caps
  - Two-tap flow: collect email → open native SMS app with pre-filled opt-in text
  - Generates embeddable JavaScript snippet
  - Tracks views, submissions, conversion rate
- **Components:** Sign-up unit list page, Visual designer (drag fields, style editor), Display rules configurator, Preview (mobile + desktop), Embed code generator, A/B test for sign-up units
- **API endpoints:**
  - `GET /api/signup-units` — List sign-up units
  - `POST /api/signup-units` — Create sign-up unit
  - `PUT /api/signup-units/:id` — Update sign-up unit
  - `DELETE /api/signup-units/:id` — Delete sign-up unit
  - `POST /api/signup-units/:id/submit` — Public endpoint: handle form submission
  - `POST /api/signup-units/:id/view` — Public endpoint: track view
  - `GET /api/embed/:workspaceId` — Serve embeddable JS snippet
- **Database models:** SignupUnit, Subscriber (created on submit), ConsentLog
- **Connects to:** Subscribers (creates new), Consent Log, Analytics
- **Inputs:** Website visitor interactions
- **Outputs:** New subscribers, Consent records, View/submission events to Analytics

### Feature 7: Analytics Dashboard
- **Outcome it delivers:** Real-time performance tracking with revenue attribution
- **How it works:**
  - Aggregate message data: sent, delivered, clicked, revenue generated
  - Subscriber growth over time
  - Campaign comparison charts
  - Journey performance funnels
  - Revenue attribution: track purchases within attribution window after message click
  - Date range filters, channel filters
- **Components:** Overview dashboard (KPI cards + charts), Subscriber growth chart, Campaign performance table, Journey performance view, Revenue attribution panel, Date range picker, Export reports
- **API endpoints:**
  - `GET /api/analytics/overview` — KPI summary (total subs, messages sent, revenue, etc.)
  - `GET /api/analytics/subscribers` — Subscriber growth over time
  - `GET /api/analytics/campaigns` — Campaign performance data
  - `GET /api/analytics/journeys` — Journey performance data
  - `GET /api/analytics/revenue` — Revenue attribution data
  - `GET /api/analytics/messages` — Message delivery/engagement stats
- **Database models:** Reads from Message, Event, Subscriber, Campaign, Journey
- **Connects to:** All features (reads their data)
- **Inputs:** Message events, Subscriber events, Purchase events
- **Outputs:** Charts and KPIs displayed in dashboard

### Feature 8: AI Content Assistant
- **Outcome it delivers:** AI-generated SMS/email copy that matches brand voice and optimizes performance
- **How it works:**
  - User provides product/offer context and brand voice settings
  - AI generates multiple SMS/email copy variants
  - Performance prediction based on historical data patterns
  - Send time optimization suggestion
  - Integrates into Campaign and Journey message editors
- **Components:** AI generation panel (sidebar in campaign editor), Brand voice settings, Copy variant selector, Performance prediction display
- **API endpoints:**
  - `POST /api/ai/generate-sms` — Generate SMS copy variants
  - `POST /api/ai/generate-email` — Generate email copy
  - `POST /api/ai/suggest-subject` — Generate email subject lines
  - `POST /api/ai/optimize-time` — Suggest best send time
- **Database models:** None (stateless, uses Campaign + Message data for context)
- **Connects to:** Campaign Builder, Journey Builder
- **Inputs:** Brand context, product info, campaign goal
- **Outputs:** Generated copy variants to Campaign/Journey editors

## Shared Systems

### Auth
- NextAuth.js v5 with credentials (email/password) + Google OAuth
- JWT sessions stored in cookie
- Workspace context loaded via middleware
- Role-based access: owner > admin > member

### Database
- PostgreSQL via Prisma ORM
- All models scoped by `workspaceId` for multi-tenancy
- JSON fields for flexible schemas (subscriber attrs, journey nodes, campaign content)
- Indexes on high-query columns (workspaceId, type, dates)

### API Structure
- Next.js App Router API routes under `/app/api/`
- Middleware: auth check + workspace resolution
- Standard response format: `{ success: boolean, data?: T, error?: string }`
- Pagination: `{ items: T[], total: number, page: number, pageSize: number }`

### Design System
- **Colors:**
  - Primary: `#6366F1` (Indigo-500) — main actions, active states
  - Secondary: `#8B5CF6` (Violet-500) — accents
  - Success: `#22C55E` — positive metrics, active status
  - Warning: `#F59E0B` — attention states
  - Danger: `#EF4444` — destructive actions, errors
  - Background: `#FAFAFA` — page background
  - Surface: `#FFFFFF` — cards, panels
  - Text Primary: `#111827` — headings
  - Text Secondary: `#6B7280` — body text
  - Border: `#E5E7EB`
- **Font:** Inter (sans-serif)
- **Radius:** `rounded-lg` (8px) for cards, `rounded-md` (6px) for inputs/buttons
- **Shadows:** `shadow-sm` for cards, `shadow-lg` for modals/dropdowns
- **Component Library:** shadcn/ui (Button, Input, Dialog, Select, Table, Tabs, Card, Badge, DropdownMenu, etc.)
- **Icons:** Lucide React
- **Layout:** Sidebar navigation (left) + main content area. Sidebar: 256px wide, dark theme (#111827). Main: light background.

### State Management
- Server state: React Query (TanStack Query) for API data
- Client state: Zustand for UI state (journey builder canvas, campaign editor state)
- Form state: React Hook Form + Zod validation

### Job Queue
- BullMQ with Redis
- Queues: `campaign-send`, `journey-step`, `segment-evaluate`, `webhook-deliver`, `analytics-aggregate`
- Workers process jobs in background
- Dashboard to monitor queue health (Bull Board)

---

## Agent Task Cards

### Task 1: Foundation + Auth + Layout
- **Agent assignment:** Agent 1
- **What to build:** Project scaffolding, database schema, auth system, app shell with navigation
- **Files to create:**
  - `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.js`
  - `prisma/schema.prisma` (FULL schema from above)
  - `src/app/layout.tsx` (root layout)
  - `src/app/(auth)/login/page.tsx`
  - `src/app/(auth)/register/page.tsx`
  - `src/app/(dashboard)/layout.tsx` (sidebar + main area)
  - `src/components/layout/sidebar.tsx`
  - `src/components/layout/header.tsx`
  - `src/components/layout/sidebar-nav.tsx`
  - `src/lib/auth.ts` (NextAuth config)
  - `src/lib/db.ts` (Prisma client)
  - `src/lib/utils.ts` (shared utilities)
  - `src/middleware.ts` (auth + workspace middleware)
  - `src/app/api/auth/[...nextauth]/route.ts`
  - `src/app/api/workspace/route.ts`
  - `src/app/(dashboard)/settings/page.tsx` (workspace settings)
  - `src/app/(dashboard)/settings/team/page.tsx`
  - `src/types/index.ts` (shared TypeScript types)
  - `src/components/ui/` (install shadcn components)
- **Dependencies on other tasks:** None (foundation)
- **Interfaces:** Provides auth session, Prisma client, layout shell, workspace context
- **Success criteria:**
  - Can register, login, logout
  - Sidebar navigation renders with links to all sections
  - Prisma schema migrated successfully
  - Protected routes redirect to login
  - Workspace settings page shows/updates config

### Task 2: Subscriber Management + Segments
- **Agent assignment:** Agent 2
- **What to build:** Subscriber list, detail view, import, segments with rule builder
- **Files to create:**
  - `src/app/(dashboard)/subscribers/page.tsx` (subscriber list)
  - `src/app/(dashboard)/subscribers/[id]/page.tsx` (subscriber detail)
  - `src/app/(dashboard)/subscribers/import/page.tsx`
  - `src/app/(dashboard)/segments/page.tsx` (segment list)
  - `src/app/(dashboard)/segments/[id]/page.tsx` (segment detail)
  - `src/app/(dashboard)/segments/new/page.tsx` (segment builder)
  - `src/components/subscribers/subscriber-table.tsx`
  - `src/components/subscribers/subscriber-detail.tsx`
  - `src/components/subscribers/import-modal.tsx`
  - `src/components/segments/segment-builder.tsx`
  - `src/components/segments/condition-row.tsx`
  - `src/app/api/subscribers/route.ts`
  - `src/app/api/subscribers/[id]/route.ts`
  - `src/app/api/subscribers/import/route.ts`
  - `src/app/api/segments/route.ts`
  - `src/app/api/segments/[id]/route.ts`
  - `src/app/api/segments/[id]/evaluate/route.ts`
  - `src/lib/segments.ts` (segment evaluation logic)
- **Dependencies on other tasks:** Task 1 (auth, db, layout)
- **Interfaces:**
  - Exports: Subscriber type, segment evaluation function
  - API: Standard CRUD endpoints for subscribers and segments
  - Used by: Campaign Builder (select segments), Journey Builder (trigger conditions)
- **Success criteria:**
  - Subscriber list with search, filter, pagination
  - Can create/edit/delete subscribers
  - CSV import creates subscribers with consent log
  - Segment builder with AND/OR conditions
  - Segment evaluation correctly filters subscribers

### Task 3: Campaign Builder + Messaging Engine
- **Agent assignment:** Agent 3
- **What to build:** SMS/Email campaign creation, scheduling, sending via Twilio/Resend, click tracking
- **Files to create:**
  - `src/app/(dashboard)/campaigns/page.tsx` (campaign list)
  - `src/app/(dashboard)/campaigns/new/page.tsx` (campaign creator)
  - `src/app/(dashboard)/campaigns/[id]/page.tsx` (campaign detail/results)
  - `src/components/campaigns/campaign-list.tsx`
  - `src/components/campaigns/sms-composer.tsx`
  - `src/components/campaigns/email-builder.tsx`
  - `src/components/campaigns/audience-selector.tsx`
  - `src/components/campaigns/schedule-picker.tsx`
  - `src/components/campaigns/phone-preview.tsx`
  - `src/components/campaigns/campaign-results.tsx`
  - `src/app/api/campaigns/route.ts`
  - `src/app/api/campaigns/[id]/route.ts`
  - `src/app/api/campaigns/[id]/send/route.ts`
  - `src/app/api/campaigns/[id]/schedule/route.ts`
  - `src/app/api/campaigns/[id]/test/route.ts`
  - `src/app/api/track/c/[trackingId]/route.ts` (click tracking redirect)
  - `src/lib/messaging/sms.ts` (Twilio integration)
  - `src/lib/messaging/email.ts` (Resend integration)
  - `src/lib/messaging/tracking.ts` (click tracking, link wrapping)
  - `src/lib/queue/campaign-worker.ts` (BullMQ campaign send worker)
  - `src/lib/queue/setup.ts` (BullMQ queue initialization)
- **Dependencies on other tasks:** Task 1 (auth, db), Task 2 (segments for audience selection)
- **Interfaces:**
  - Exports: `sendSMS()`, `sendEmail()`, `trackClick()` functions
  - API: Campaign CRUD + send/schedule endpoints
  - Used by: Journey Builder (sends messages), Analytics (message data)
  - Reads: Segment subscriber lists for targeting
- **Success criteria:**
  - Can create SMS campaign with merge tags and character count
  - Can create email campaign with block editor
  - Can select target segments
  - Can schedule or send immediately
  - Messages tracked in Message table with delivery status
  - Click tracking redirects work and record clicks

### Task 4: Journey Builder (Automations)
- **Agent assignment:** Agent 4
- **What to build:** Visual flow builder with drag-and-drop nodes, journey execution engine
- **Files to create:**
  - `src/app/(dashboard)/journeys/page.tsx` (journey list)
  - `src/app/(dashboard)/journeys/[id]/page.tsx` (journey canvas)
  - `src/components/journeys/journey-canvas.tsx` (main visual editor)
  - `src/components/journeys/node-palette.tsx` (draggable node types)
  - `src/components/journeys/nodes/trigger-node.tsx`
  - `src/components/journeys/nodes/delay-node.tsx`
  - `src/components/journeys/nodes/send-sms-node.tsx`
  - `src/components/journeys/nodes/send-email-node.tsx`
  - `src/components/journeys/nodes/condition-node.tsx`
  - `src/components/journeys/node-config-panel.tsx`
  - `src/components/journeys/journey-toolbar.tsx`
  - `src/app/api/journeys/route.ts`
  - `src/app/api/journeys/[id]/route.ts`
  - `src/app/api/journeys/[id]/status/route.ts`
  - `src/app/api/journeys/[id]/stats/route.ts`
  - `src/app/api/events/route.ts` (receive events that trigger journeys)
  - `src/lib/journeys/engine.ts` (journey execution logic)
  - `src/lib/journeys/evaluator.ts` (condition evaluation)
  - `src/lib/queue/journey-worker.ts` (BullMQ journey step worker)
- **Dependencies on other tasks:** Task 1 (auth, db), Task 3 (messaging functions)
- **Interfaces:**
  - Exports: Journey types, event handler for triggering journeys
  - API: Journey CRUD + status + stats endpoints
  - Reads: Subscriber data for conditions, uses sendSMS/sendEmail from Task 3
  - Events API: receives events from external sources (Shopify webhooks, sign-up units, etc.)
- **Success criteria:**
  - Visual canvas with draggable nodes
  - Can create journeys with trigger → delay → send message flow
  - Can add if/else conditions
  - Journey activates and processes events
  - Subscribers tracked through journey states

### Task 5: Sign-Up Units + Analytics + AI
- **Agent assignment:** Agent 5
- **What to build:** Sign-up unit builder, embeddable snippet, analytics dashboard, AI content generation
- **Files to create:**
  - `src/app/(dashboard)/signup-units/page.tsx`
  - `src/app/(dashboard)/signup-units/new/page.tsx`
  - `src/app/(dashboard)/signup-units/[id]/page.tsx`
  - `src/components/signup-units/unit-designer.tsx`
  - `src/components/signup-units/display-rules.tsx`
  - `src/components/signup-units/preview.tsx`
  - `src/components/signup-units/embed-code.tsx`
  - `src/app/api/signup-units/route.ts`
  - `src/app/api/signup-units/[id]/route.ts`
  - `src/app/api/signup-units/[id]/submit/route.ts`
  - `src/app/api/signup-units/[id]/view/route.ts`
  - `src/app/api/embed/[workspaceId]/route.ts` (serves JS snippet)
  - `src/app/(dashboard)/analytics/page.tsx`
  - `src/components/analytics/overview-cards.tsx`
  - `src/components/analytics/subscriber-chart.tsx`
  - `src/components/analytics/campaign-table.tsx`
  - `src/components/analytics/revenue-chart.tsx`
  - `src/app/api/analytics/overview/route.ts`
  - `src/app/api/analytics/subscribers/route.ts`
  - `src/app/api/analytics/campaigns/route.ts`
  - `src/app/api/analytics/revenue/route.ts`
  - `src/components/ai/generate-panel.tsx`
  - `src/app/api/ai/generate-sms/route.ts`
  - `src/app/api/ai/generate-email/route.ts`
  - `src/lib/ai/generate.ts` (OpenAI integration)
- **Dependencies on other tasks:** Task 1 (auth, db, layout), Task 2 (subscribers), Task 3 (messages data)
- **Interfaces:**
  - Exports: Analytics query functions, AI generation functions
  - API: Sign-up unit CRUD + public submission, Analytics endpoints, AI endpoints
  - Reads: Message, Event, Subscriber, Campaign data for analytics
  - Creates: New Subscribers via sign-up form submissions
- **Success criteria:**
  - Sign-up unit designer with visual preview
  - Embeddable JS snippet that renders popup on external site
  - Analytics dashboard with KPI cards and charts
  - Subscriber growth, campaign performance, revenue charts
  - AI generates SMS/email copy variants via OpenAI
