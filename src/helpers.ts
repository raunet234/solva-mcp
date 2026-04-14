import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDir, "..");

export interface Service {
  id: string;
  name: string;
  category: "news" | "search" | "summarize" | "weather";
  url: string;
  priceUSDC: number;
  uptimePct: number;
  totalPayments: number;
}

export interface Policy {
  maxPriceUSDC: number;
  minUptimePct: number;
  minTotalPayments: number;
  dailyBudgetUSDC: number;
  allowExplorer: boolean;
}

type Category = Service["category"];

const CATEGORY_KEYWORDS: Record<string, Category> = {
  news: "news",
  article: "news",
  latest: "news",
  headline: "news",
  search: "search",
  find: "search",
  research: "search",
  "look up": "search",
  summarize: "summarize",
  summary: "summarize",
  tldr: "summarize",
  brief: "summarize",
  weather: "weather",
  temperature: "weather",
  forecast: "weather",
  rain: "weather",
};

export function detectCategory(task: string): Category {
  const lower = task.toLowerCase();
  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lower.includes(keyword)) {
      return category;
    }
  }
  return "search";
}

export function loadRegistry(): Service[] {
  const raw = readFileSync(resolve(projectRoot, "registry.json"), "utf-8");
  return JSON.parse(raw) as Service[];
}

export function loadPolicy(): Policy {
  const raw = readFileSync(resolve(projectRoot, "policy.json"), "utf-8");
  return JSON.parse(raw) as Policy;
}

export function filterAndSort(services: Service[], category: Category, policy: Policy): Service[] {
  return services
    .filter(
      (s) =>
        s.category === category &&
        s.priceUSDC <= policy.maxPriceUSDC &&
        s.uptimePct >= policy.minUptimePct &&
        s.totalPayments >= policy.minTotalPayments,
    )
    .sort((a, b) => a.priceUSDC - b.priceUSDC);
}

export function getMockResult(category: Category, task: string): string {
  const topic = task.replace(/^(find|get|search|summarize|research|look up|tell me about)\s*/i, "").trim() || "the requested topic";

  switch (category) {
    case "news":
      return [
        `Top stories for "${topic}":`,
        `1. "Major Developments in ${topic} Reshape Industry Outlook" — Reuters, April 12 2026`,
        `2. "${topic}: New Breakthroughs Drive Record Investment" — Bloomberg, April 11 2026`,
        `3. "Experts Predict Transformative Year Ahead for ${topic}" — TechCrunch, April 10 2026`,
      ].join("\n");
    case "search":
      return [
        `Search results for "${topic}":`,
        `1. Comprehensive Guide to ${topic} — https://docs.example.com (overview, best practices, and case studies)`,
        `2. ${topic}: Industry Analysis 2026 — https://research.example.com (market trends and expert insights)`,
        `3. Getting Started with ${topic} — https://learn.example.com (tutorials and implementation guides)`,
      ].join("\n");
    case "summarize":
      return [
        `Summary of ${topic}:`,
        "",
        `Recent developments in ${topic} have shown significant momentum, with key players investing heavily in infrastructure and adoption. Industry analysts note a shift toward more accessible and scalable solutions, driven by growing demand from both enterprise and consumer markets.`,
        "",
        `Looking ahead, the convergence of ${topic} with emerging technologies like AI agents and blockchain-based micropayments is expected to unlock new use cases. Experts predict that autonomous systems capable of discovering and paying for services on demand will become a standard pattern within the next 12-18 months.`,
      ].join("\n");
    case "weather":
      return "Weather: Partly cloudy, 18°C, humidity 62%, wind 12km/h NW";
  }
}

export function formatResponse(
  task: string,
  category: Category,
  service: Service,
  txHash: string,
  result: string,
): string {
  return [
    `✓ Task: ${task}`,
    `✓ Category: ${category}`,
    `✓ Service: ${service.name}`,
    `✓ Price: $${service.priceUSDC} USDC`,
    `✓ Transaction: ${txHash}`,
    `✓ Explorer: https://stellar.expert/explorer/testnet/tx/${txHash}`,
    "",
    result,
  ].join("\n");
}
