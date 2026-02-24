import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

export function formatPercentage(num: number): string {
  return `${(num * 100).toFixed(1)}%`;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function smsSegmentCount(text: string): number {
  // GSM-7 encoding: 160 chars per segment, 153 for multi-segment
  // Unicode: 70 chars per segment, 67 for multi-segment
  const isGsm7 = /^[\x20-\x7E\n\r]*$/.test(text);
  const singleLimit = isGsm7 ? 160 : 70;
  const multiLimit = isGsm7 ? 153 : 67;

  if (text.length <= singleLimit) return 1;
  return Math.ceil(text.length / multiLimit);
}

export function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "pulse_";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
