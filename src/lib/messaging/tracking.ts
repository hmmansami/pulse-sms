import crypto from "crypto";

export type TrackingPayload = {
  url: string;
  workspaceId?: string;
  campaignId?: string;
  messageId?: string;
  subscriberId?: string;
  createdAt: number;
};

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function sign(payloadBase64: string): string {
  const secret = process.env.TRACKING_SECRET ?? "pulse-dev-tracking-secret";
  return crypto.createHmac("sha256", secret).update(payloadBase64).digest("base64url");
}

export function createTrackingId(payload: Omit<TrackingPayload, "createdAt">): string {
  const fullPayload: TrackingPayload = {
    ...payload,
    createdAt: Date.now(),
  };

  const encoded = Buffer.from(JSON.stringify(fullPayload), "utf8").toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function decodeTrackingId(trackingId: string): TrackingPayload | null {
  const [payloadBase64, signature] = trackingId.split(".");

  if (!payloadBase64 || !signature) {
    return null;
  }

  if (sign(payloadBase64) !== signature) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8")) as TrackingPayload;
  } catch {
    return null;
  }
}

export function wrapTrackingUrls(
  message: string,
  context: Omit<TrackingPayload, "url" | "createdAt">,
  baseUrl = process.env.APP_URL,
): string {
  if (!baseUrl) {
    return message;
  }

  return message.replace(URL_REGEX, (match) => {
    if (match.includes("/api/track/c/")) {
      return match;
    }

    const trackingId = createTrackingId({
      ...context,
      url: match,
    });

    return `${baseUrl}/api/track/c/${trackingId}`;
  });
}
