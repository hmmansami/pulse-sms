import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const db = new PrismaClient();

async function main() {
  // Clean existing data (order matters for foreign keys)
  await db.event.deleteMany();
  await db.message.deleteMany();
  await db.journeySubscriberState.deleteMany();
  await db.segmentMembership.deleteMany();
  await db.signupUnit.deleteMany();
  await db.journey.deleteMany();
  await db.campaign.deleteMany();
  await db.segment.deleteMany();
  await db.subscriber.deleteMany();
  await db.workspaceMember.deleteMany();
  await db.workspace.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.user.deleteMany();

  // Create demo user
  const password = await hash("demo1234", 12);
  const user = await db.user.upsert({
    where: { email: "demo@pulse-sms.com" },
    update: {},
    create: {
      email: "demo@pulse-sms.com",
      name: "Demo User",
      password,
      emailVerified: new Date(),
    },
  });

  // Create workspace
  const workspace = await db.workspace.upsert({
    where: { slug: "demo-workspace" },
    update: {},
    create: {
      name: "Demo Store",
      slug: "demo-workspace",
      plan: "pro",
      timezone: "America/New_York",
    },
  });

  // Link user to workspace
  await db.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } },
    update: {},
    create: { userId: user.id, workspaceId: workspace.id, role: "owner" },
  });

  // Create subscribers
  const subscribers = [];
  const firstNames = ["Emma", "Liam", "Olivia", "Noah", "Ava", "James", "Sophia", "Oliver", "Isabella", "Lucas", "Mia", "Mason", "Charlotte", "Ethan", "Amelia", "Logan", "Harper", "Aiden", "Evelyn", "Jackson"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Wilson", "Anderson", "Taylor", "Thomas", "Moore", "Martin", "Lee", "Clark", "Hall", "Allen", "Young", "King"];
  const cities = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "San Antonio", "San Diego", "Dallas", "Austin", "Miami"];
  const sources = ["signup_unit", "import", "api", "shopify"];
  const tags = [["vip"], ["new"], ["engaged"], ["at-risk"], ["vip", "engaged"], ["new", "high-value"], [], ["churned"], ["repeat-buyer"], ["subscriber"]];

  for (let i = 0; i < 50; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[i % lastNames.length];
    const sub = await db.subscriber.create({
      data: {
        workspaceId: workspace.id,
        phone: `+1555${String(1000 + i).padStart(4, "0")}`,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@example.com`,
        firstName: fn,
        lastName: ln,
        smsConsent: Math.random() > 0.15,
        emailConsent: Math.random() > 0.1,
        smsOptInAt: new Date(Date.now() - Math.random() * 90 * 86400000),
        emailOptInAt: new Date(Date.now() - Math.random() * 90 * 86400000),
        source: sources[i % sources.length],
        city: cities[i % cities.length],
        country: "US",
        timezone: "America/New_York",
        tags: tags[i % tags.length],
        customAttrs: { lifetime_value: Math.floor(Math.random() * 500) + 20, order_count: Math.floor(Math.random() * 10) + 1 },
      },
    });
    subscribers.push(sub);
  }

  // Create segments
  const segVip = await db.segment.create({
    data: {
      workspaceId: workspace.id,
      name: "VIP Customers",
      description: "High-value repeat buyers",
      rules: { conditions: [{ field: "tags", operator: "contains", value: "vip" }], logic: "and" },
      subscriberCount: 10,
    },
  });

  const segEngaged = await db.segment.create({
    data: {
      workspaceId: workspace.id,
      name: "Engaged Subscribers",
      description: "Subscribers who clicked in last 30 days",
      rules: { conditions: [{ field: "smsConsent", operator: "equals", value: true }], logic: "and" },
      subscriberCount: 42,
    },
  });

  const segNew = await db.segment.create({
    data: {
      workspaceId: workspace.id,
      name: "New Subscribers",
      description: "Joined in last 7 days",
      rules: { conditions: [{ field: "tags", operator: "contains", value: "new" }], logic: "and" },
      subscriberCount: 8,
    },
  });

  // Add segment memberships
  for (let i = 0; i < 10; i++) {
    await db.segmentMembership.create({ data: { segmentId: segVip.id, subscriberId: subscribers[i].id } });
  }
  for (let i = 0; i < 42; i++) {
    await db.segmentMembership.create({ data: { segmentId: segEngaged.id, subscriberId: subscribers[i].id } });
  }
  for (let i = 40; i < 48; i++) {
    await db.segmentMembership.create({ data: { segmentId: segNew.id, subscriberId: subscribers[i].id } });
  }

  // Create campaigns
  const campaign1 = await db.campaign.create({
    data: {
      workspaceId: workspace.id,
      name: "Flash Sale - 30% Off",
      type: "sms",
      status: "sent",
      content: { body: "FLASH SALE! 30% off everything today only. Use code FLASH30 at checkout. Shop now: https://demo-store.com/sale" },
      segmentIds: [segEngaged.id],
      sentAt: new Date(Date.now() - 3 * 86400000),
      sendCount: 42,
    },
  });

  const campaign2 = await db.campaign.create({
    data: {
      workspaceId: workspace.id,
      name: "New Arrivals Alert",
      type: "sms",
      status: "sent",
      content: { body: "New arrivals just dropped! Be the first to shop our latest collection. Tap here: https://demo-store.com/new" },
      segmentIds: [segVip.id],
      sentAt: new Date(Date.now() - 7 * 86400000),
      sendCount: 10,
    },
  });

  await db.campaign.create({
    data: {
      workspaceId: workspace.id,
      name: "Weekend Special - Free Shipping",
      type: "email",
      status: "scheduled",
      content: { subject: "Free Shipping This Weekend Only!", body: "Enjoy free shipping on all orders this weekend. No minimum purchase required.", preheader: "Free shipping - no minimum!" },
      segmentIds: [segEngaged.id],
      scheduledAt: new Date(Date.now() + 2 * 86400000),
    },
  });

  await db.campaign.create({
    data: {
      workspaceId: workspace.id,
      name: "Welcome Back Offer",
      type: "sms",
      status: "draft",
      content: { body: "We miss you! Come back and enjoy 20% off your next order. Code: WELCOME20" },
      segmentIds: [],
    },
  });

  // Create messages for campaigns
  for (let i = 0; i < 42; i++) {
    const clicked = Math.random() > 0.67;
    const revenue = clicked && Math.random() > 0.5 ? Math.floor(Math.random() * 150) + 25 : 0;
    await db.message.create({
      data: {
        workspaceId: workspace.id,
        subscriberId: subscribers[i].id,
        campaignId: campaign1.id,
        channel: "sms",
        content: { body: "FLASH SALE! 30% off everything today only." },
        status: "delivered",
        sentAt: new Date(Date.now() - 3 * 86400000),
        deliveredAt: new Date(Date.now() - 3 * 86400000 + 5000),
        clickedAt: clicked ? new Date(Date.now() - 3 * 86400000 + Math.random() * 3600000) : null,
        revenue,
      },
    });
  }

  for (let i = 0; i < 10; i++) {
    const clicked = Math.random() > 0.5;
    const revenue = clicked ? Math.floor(Math.random() * 200) + 50 : 0;
    await db.message.create({
      data: {
        workspaceId: workspace.id,
        subscriberId: subscribers[i].id,
        campaignId: campaign2.id,
        channel: "sms",
        content: { body: "New arrivals just dropped!" },
        status: "delivered",
        sentAt: new Date(Date.now() - 7 * 86400000),
        deliveredAt: new Date(Date.now() - 7 * 86400000 + 3000),
        clickedAt: clicked ? new Date(Date.now() - 7 * 86400000 + Math.random() * 7200000) : null,
        revenue,
      },
    });
  }

  // Create journeys
  await db.journey.create({
    data: {
      workspaceId: workspace.id,
      name: "Welcome Series",
      status: "active",
      trigger: { type: "event", event: "subscriber_created" },
      nodes: [
        { id: "trigger-1", type: "trigger", position: { x: 250, y: 50 }, data: { event: "subscriber_created" } },
        { id: "delay-1", type: "delay", position: { x: 250, y: 180 }, data: { duration: 5, unit: "minutes" } },
        { id: "sms-1", type: "send_sms", position: { x: 250, y: 310 }, data: { body: "Welcome to our store! Here is 15% off your first order: WELCOME15" } },
        { id: "delay-2", type: "delay", position: { x: 250, y: 440 }, data: { duration: 24, unit: "hours" } },
        { id: "sms-2", type: "send_sms", position: { x: 250, y: 570 }, data: { body: "Did you check out our bestsellers yet? Shop now!" } },
      ],
      edges: [
        { id: "e1", source: "trigger-1", target: "delay-1" },
        { id: "e2", source: "delay-1", target: "sms-1" },
        { id: "e3", source: "sms-1", target: "delay-2" },
        { id: "e4", source: "delay-2", target: "sms-2" },
      ],
    },
  });

  await db.journey.create({
    data: {
      workspaceId: workspace.id,
      name: "Abandoned Cart Recovery",
      status: "active",
      trigger: { type: "event", event: "cart_abandoned" },
      nodes: [
        { id: "trigger-1", type: "trigger", position: { x: 250, y: 50 }, data: { event: "cart_abandoned" } },
        { id: "delay-1", type: "delay", position: { x: 250, y: 180 }, data: { duration: 30, unit: "minutes" } },
        { id: "sms-1", type: "send_sms", position: { x: 250, y: 310 }, data: { body: "You left something in your cart! Complete your order now and get free shipping." } },
        { id: "cond-1", type: "condition", position: { x: 250, y: 440 }, data: { field: "tags", operator: "contains", value: "vip" } },
        { id: "sms-2", type: "send_sms", position: { x: 100, y: 570 }, data: { body: "As a VIP, enjoy an extra 10% off! Code: VIP10" } },
        { id: "sms-3", type: "send_sms", position: { x: 400, y: 570 }, data: { body: "Your cart is waiting! Don't miss out." } },
      ],
      edges: [
        { id: "e1", source: "trigger-1", target: "delay-1" },
        { id: "e2", source: "delay-1", target: "sms-1" },
        { id: "e3", source: "sms-1", target: "cond-1" },
        { id: "e4", source: "cond-1", target: "sms-2", label: "Yes" },
        { id: "e5", source: "cond-1", target: "sms-3", label: "No" },
      ],
    },
  });

  await db.journey.create({
    data: {
      workspaceId: workspace.id,
      name: "Post-Purchase Thank You",
      status: "draft",
      trigger: { type: "event", event: "purchase" },
      nodes: [
        { id: "trigger-1", type: "trigger", position: { x: 250, y: 50 }, data: { event: "purchase" } },
        { id: "delay-1", type: "delay", position: { x: 250, y: 180 }, data: { duration: 2, unit: "hours" } },
        { id: "email-1", type: "send_email", position: { x: 250, y: 310 }, data: { subject: "Thank you for your order!", body: "Your order is on its way. We appreciate your business!" } },
      ],
      edges: [
        { id: "e1", source: "trigger-1", target: "delay-1" },
        { id: "e2", source: "delay-1", target: "email-1" },
      ],
    },
  });

  // Create sign-up units
  await db.signupUnit.create({
    data: {
      workspaceId: workspace.id,
      name: "Homepage Popup - 15% Off",
      type: "popup",
      status: "active",
      design: { headline: "Get 15% Off Your First Order", subheadline: "Join our SMS list for exclusive deals", ctaText: "Claim My Discount", backgroundColor: "#ffffff", textColor: "#111827", ctaColor: "#6366f1", fields: ["email", "phone"] },
      displayRules: { delay: 5, scrollPercentage: 30, exitIntent: true, pages: [], devices: ["mobile", "desktop"], frequencyCap: 7 },
      views: 12450,
      submissions: 1867,
    },
  });

  await db.signupUnit.create({
    data: {
      workspaceId: workspace.id,
      name: "Exit Intent - Free Shipping",
      type: "flyout",
      status: "active",
      design: { headline: "Wait! Free Shipping on Your Order", subheadline: "Enter your number to unlock free shipping", ctaText: "Get Free Shipping", backgroundColor: "#f0f0ff", textColor: "#111827", ctaColor: "#8b5cf6", fields: ["phone"] },
      displayRules: { delay: 0, exitIntent: true, pages: [], devices: ["desktop"], frequencyCap: 14 },
      views: 5230,
      submissions: 892,
    },
  });

  await db.signupUnit.create({
    data: {
      workspaceId: workspace.id,
      name: "Footer Email Capture",
      type: "embedded",
      status: "active",
      design: { headline: "Stay in the Loop", subheadline: "Get the latest news and offers", ctaText: "Subscribe", backgroundColor: "#111827", textColor: "#ffffff", ctaColor: "#6366f1", fields: ["email"] },
      displayRules: { delay: 0, exitIntent: false, pages: [], devices: ["mobile", "desktop"], frequencyCap: 30 },
      views: 45200,
      submissions: 3210,
    },
  });

  // Create events
  const eventTypes = ["page_view", "product_view", "cart_add", "purchase", "cart_abandon"];
  for (let i = 0; i < 200; i++) {
    await db.event.create({
      data: {
        workspaceId: workspace.id,
        subscriberId: subscribers[Math.floor(Math.random() * subscribers.length)].id,
        type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        properties: { url: "https://demo-store.com/product/" + Math.floor(Math.random() * 100), revenue: Math.random() > 0.7 ? Math.floor(Math.random() * 200) + 20 : undefined },
        createdAt: new Date(Date.now() - Math.random() * 30 * 86400000),
      },
    });
  }

  console.log("Seed complete!");
  console.log("Login: demo@pulse-sms.com / demo1234");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
