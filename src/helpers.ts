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

export function getMockResult(category: Category): string {
  switch (category) {
    case "news":
      return [
        "Top stories:",
        "1. \"Stellar Network Hits 10M Daily Transactions\" — CoinDesk, April 12 2026",
        "2. \"x402 Protocol Sees 300% Growth in Agent Micropayments\" — The Block, April 11 2026",
        "3. \"Soroban Smart Contracts Now Power 40% of DeFi Volume on Stellar\" — Decrypt, April 10 2026",
      ].join("\n");
    case "search":
      return [
        "Search results:",
        "1. x402 Payment Protocol Documentation — https://x402.org/docs (official spec and integration guides)",
        "2. Building AI Agents with Micropayments — https://stellar.org/blog/agents (case studies and architecture patterns)",
        "3. MCP Server Best Practices — https://modelcontextprotocol.io/guides (tool registration and transport patterns)",
      ].join("\n");
    case "summarize":
      return [
        "Summary:",
        "",
        "The x402 protocol enables autonomous AI agents to make micropayments for web services using HTTP status code 402. When an agent encounters a paywalled resource, it automatically signs a Soroban authorization entry and retries with a valid payment header, settling USDC on the Stellar network in seconds.",
        "",
        "This approach eliminates the need for API keys, subscriptions, or pre-negotiated contracts. Agents can discover, evaluate, and pay for services on demand, enabling a new economy of machine-to-machine commerce where trust is established through on-chain settlement rather than identity verification.",
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
    `✓ Service: ${service.name} (${service.url})`,
    `✓ Price: $${service.priceUSDC} USDC`,
    `✓ Transaction: ${txHash}`,
    `✓ Explorer: https://stellar.expert/explorer/testnet/tx/${txHash}`,
    "",
    result,
  ].join("\n");
}
