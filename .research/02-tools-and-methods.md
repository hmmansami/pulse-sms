# Attentive — Tools & Methods Research

## 1. SMS Delivery Infrastructure
**What**: Sending/receiving SMS and MMS messages at scale
**How it works**: Uses telecom carrier APIs (like Twilio) as the infrastructure layer. Messages route through SMS gateways that handle carrier negotiation, delivery receipts, and throughput management.
**Key tech**:
- Twilio Programmable Messaging API (or similar) for SMS/MMS delivery
- Short codes and toll-free numbers for high-throughput sending
- Message queuing systems for scheduled/bulk sends
- Delivery status webhooks for tracking
**What makes it effective**: Dedicated short codes ($500/mo) get higher throughput and deliverability than shared numbers.

## 2. Two-Tap Sign-Up Technology (Patented)
**What**: Frictionless mobile SMS opt-in
**How it works**:
1. User taps a CTA on a website/ad/social post
2. Device's native SMS app opens automatically with a pre-filled opt-in message
3. User taps "Send" — that's the second tap
4. No email confirmation, no app download, no typing required
**Key tech**:
- `sms:` URI scheme on mobile browsers (`sms:+1234567890&body=YES`)
- JavaScript popup/overlay with display rules (timer, scroll, exit intent)
- Progressive form: collects email first, then SMS number
**What makes it effective**: Reduces opt-in friction from 30+ seconds to 2 taps. Conversion rates 2x higher than traditional forms.

## 3. Journey/Flow Builder
**What**: Visual automation builder for triggered message sequences
**How it works**:
- Event-driven architecture: customer actions (page view, cart add, purchase) trigger journey entry
- Visual node-based editor: drag-and-drop nodes (triggers, delays, conditions, messages)
- Branching logic: if/else based on customer attributes, behavior, or segment membership
**Journey types**:
- Welcome Series (trigger: new subscriber)
- Abandoned Cart (trigger: cart_add + no purchase within 15-60 min)
- Browse Abandonment (trigger: product_view + no cart_add within 60 min)
- Post-Purchase (trigger: order_confirmed)
- Winback (trigger: no purchase in X days)
- Price Drop (trigger: price change on viewed product)
**Key tech**:
- Event streaming (e.g., Redis pub/sub, Kafka)
- Job scheduling (e.g., Bull/BullMQ with Redis)
- State machine per subscriber-journey pair
- eCommerce platform webhooks for real-time event ingestion

## 4. Audience Segmentation
**What**: Dynamic grouping of subscribers based on attributes and behavior
**How it works**:
- Rule-based segment builder: combine conditions (AND/OR) on subscriber attributes
- Behavioral segments: based on actions (clicked, purchased, viewed)
- Predictive segments (AI): likelihood to purchase, churn risk
- Real-time evaluation: segments update as subscriber data changes
**Key tech**:
- PostgreSQL with JSONB for flexible attribute storage
- Pre-computed segment membership tables for fast querying
- Background jobs to re-evaluate segments on data changes

## 5. Campaign Builder & Scheduler
**What**: Create, preview, schedule, and send one-time or recurring campaigns
**How it works**:
- Template editor with merge tags ({{first_name}}, {{product.name}})
- SMS character counter with segment tracking (160 chars per segment)
- MMS support with image/GIF uploads
- Email builder with drag-and-drop blocks
- Schedule for future send or send immediately
- A/B testing: split audience, test different copy/offers, auto-select winner
**Key tech**:
- Rich text/block editor (e.g., TipTap, Editor.js for emails)
- Image upload to S3/Cloudinary
- Cron-based scheduler with job queue
- Statistical significance calculator for A/B tests

## 6. AI Content Generation
**What**: Auto-generate high-performing SMS and email copy
**How it works**:
- Trained on billions of messages across 70+ verticals
- Generates on-brand copy matching the brand's voice/tone
- Suggests subject lines, SMS copy, CTAs
- Predicts performance (open rate, CTR) before sending
**Key tech**:
- LLM API (OpenAI/Anthropic) with fine-tuned prompts per vertical
- Brand voice profile: examples of past messages, tone settings
- Performance prediction model based on historical campaign data

## 7. Analytics & Revenue Attribution
**What**: Track message performance and attribute revenue to specific messages
**How it works**:
- UTM parameters + click tracking links for every message
- Conversion window: track purchases within X hours of message click
- Revenue per message, per campaign, per journey
- Real-time dashboard with live metrics during sends
**Key tech**:
- Click tracking via redirect URLs (e.g., `track.pulse.com/c/abc123`)
- Cookie/fingerprint matching for attribution
- Time-series data storage for real-time dashboards
- Aggregation pipelines for reporting

## 8. Compliance Engine
**What**: Automated TCPA/GDPR compliance for SMS marketing
**How it works**:
- Double opt-in enforcement
- Automatic STOP/HELP keyword handling
- Quiet hours enforcement (no messages before 8am or after 9pm local time)
- Consent audit trail: store proof of every opt-in
- Automatic unsubscribe on carrier complaints
**Key tech**:
- Keyword detection on inbound messages
- Timezone-aware scheduling with subscriber location data
- Immutable consent log table
- Rate limiting per number

## 9. Integration System
**What**: Connect with eCommerce platforms, CRMs, and marketing tools
**How it works**:
- Pre-built connectors for Shopify, BigCommerce, Salesforce, etc.
- Webhook system: send/receive events
- REST API for custom integrations
- OAuth 2.0 for third-party app authorization
**Key tech**:
- Shopify webhooks (orders, customers, products)
- OAuth 2.0 provider for app marketplace
- Webhook delivery with retry logic and signing
- SFTP for bulk data imports

## 10. Subscriber Identity & Data
**What**: Unified customer profile across channels
**How it works**:
- Phone number as primary identifier
- Email as secondary identifier
- Merge profiles when phone+email are linked
- Track: custom attributes, purchase history, page views, click history
- Zero-party data collection via sign-up unit questions
**Key tech**:
- Customer data platform (CDP) lite
- Event sourcing for activity history
- JSONB attributes for flexible schema
- Identity resolution: merge duplicate profiles
