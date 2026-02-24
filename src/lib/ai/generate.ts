import OpenAI from "openai";

type BrandVoice = {
  tone?: string;
  audience?: string;
  mustInclude?: string;
  avoid?: string;
};

type SmsInput = {
  product: string;
  offer: string;
  goal?: string;
  brandVoice?: BrandVoice;
  apiKey?: string;
};

type EmailInput = {
  product: string;
  offer: string;
  audience?: string;
  brandVoice?: BrandVoice;
  apiKey?: string;
};

function buildVoice(voice?: BrandVoice) {
  if (!voice) return "";
  return [
    voice.tone ? `Tone: ${voice.tone}` : null,
    voice.audience ? `Audience: ${voice.audience}` : null,
    voice.mustInclude ? `Must include: ${voice.mustInclude}` : null,
    voice.avoid ? `Avoid: ${voice.avoid}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function fallbackSms(input: SmsInput) {
  return [
    `${input.offer} on ${input.product}. Tap to shop now.`,
    `${input.product} just got better: ${input.offer}. Shop in one tap.`,
    `Limited time: ${input.offer} for ${input.product}. Grab it today.`,
  ];
}

function fallbackEmail(input: EmailInput) {
  return [
    `${input.offer} on ${input.product}, today only`,
    `Your ${input.product} deal is here`,
    `New offer: ${input.offer}`,
  ];
}

async function askForList(params: {
  prompt: string;
  apiKey?: string;
  fallback: string[];
}) {
  const key = params.apiKey ?? process.env.OPENAI_API_KEY;
  if (!key) return params.fallback;

  try {
    const client = new OpenAI({ apiKey: key });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content:
            "Return only 3 lines, one variant per line, no numbering, no extra commentary.",
        },
        {
          role: "user",
          content: params.prompt,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";
    const lines = text
      .split("\n")
      .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 3);

    return lines.length >= 3 ? lines : params.fallback;
  } catch {
    return params.fallback;
  }
}

export async function generateSmsVariants(input: SmsInput) {
  const voice = buildVoice(input.brandVoice);
  const prompt = `Generate 3 high-converting SMS variants for this campaign.\nProduct: ${input.product}\nOffer: ${input.offer}\nGoal: ${input.goal ?? "Drive clicks and purchases"}\n${voice}\nKeep each message concise and compliant with marketing SMS best practices.`;

  return askForList({ prompt, apiKey: input.apiKey, fallback: fallbackSms(input) });
}

export async function generateEmailSubjectLines(input: EmailInput) {
  const voice = buildVoice(input.brandVoice);
  const prompt = `Generate 3 email subject lines.\nProduct: ${input.product}\nOffer: ${input.offer}\nAudience: ${input.audience ?? "Ecommerce subscribers"}\n${voice}\nKeep each subject line under 60 characters.`;

  return askForList({ prompt, apiKey: input.apiKey, fallback: fallbackEmail(input) });
}
