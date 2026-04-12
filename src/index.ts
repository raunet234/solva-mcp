import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { wrapFetchWithPayment, x402Client, x402HTTPClient } from "@x402/fetch";
import { z } from "zod";

import { STELLAR_TESTNET_CAIP2 } from "./stellar/constants.js";
import { ExactStellarScheme } from "./stellar/exact/client/scheme.js";
import { createEd25519Signer } from "./stellar/signer.js";
import { sendTestnetPayment } from "./payment.js";
import {
  detectCategory,
  filterAndSort,
  formatResponse,
  getMockResult,
  loadPolicy,
  loadRegistry,
} from "./helpers.js";

const currentDir = dirname(fileURLToPath(import.meta.url));
const projectEnvPath = resolve(currentDir, "..", ".env");
loadEnv({ path: projectEnvPath });

function isMockUrl(url: string): boolean {
  return url.includes("mock") || url.includes("agentpay.dev");
}

async function main(): Promise<void> {
  const secretKey = process.env.STELLAR_SECRET_KEY?.trim();
  if (!secretKey) {
    console.error("Error: STELLAR_SECRET_KEY not set in environment. See .env.example");
    process.exit(1);
  }

  const network = STELLAR_TESTNET_CAIP2;
  const signer = createEd25519Signer(secretKey, network);
  const paymentClient = new x402Client().register(
    "stellar:*",
    new ExactStellarScheme(signer),
  );
  const httpClient = new x402HTTPClient(paymentClient);
  const fetchWithPayment = wrapFetchWithPayment(fetch, httpClient);

  const server = new McpServer({
    name: "solva-mcp",
    version: "1.0.0",
  });

  server.tool(
    "solva_discover_and_pay",
    "Discover a policy-compliant x402 service for a task, pay with Stellar USDC, and return the result",
    {
      task: z.string().describe("Natural language task description, e.g. 'find latest news about Notion'"),
    },
    async ({ task }) => {
      try {
        // Step 1 — Category detection
        const category = detectCategory(task);

        // Step 2 — Discovery & filtering
        const registry = loadRegistry();
        const policy = loadPolicy();
        const candidates = filterAndSort(registry, category, policy);

        if (candidates.length === 0) {
          return {
            content: [{ type: "text", text: `Error: No policy-compliant service found for: ${task}` }],
          };
        }

        const service = candidates[0];

        // Step 3 — Payment on Stellar testnet
        let txHash: string;
        try {
          if (isMockUrl(service.url)) {
            // Mock URLs have no server — send a real USDC tx on testnet directly
            txHash = await sendTestnetPayment(secretKey, service.priceUSDC);
          } else {
            // Real x402 endpoint — use full payment negotiation flow
            const response = await fetchWithPayment(service.url);
            const receipt = httpClient.getPaymentSettleResponse(
              (headerName) => response.headers.get(headerName),
            );
            txHash = (receipt as Record<string, unknown>)?.txHash as string ?? "pending";
          }
        } catch (paymentError: unknown) {
          const errMsg = paymentError instanceof Error ? paymentError.message : String(paymentError);
          return {
            content: [{ type: "text", text: `Error: Payment failed — ${errMsg}` }],
          };
        }

        // Step 4 — Service call (mock or real)
        let result: string;
        if (isMockUrl(service.url)) {
          result = getMockResult(category);
        } else {
          const serviceResponse = await fetch(service.url);
          result = await serviceResponse.text();
        }

        // Step 5 — Return formatted response
        const output = formatResponse(task, category, service, txHash, result);
        return { content: [{ type: "text", text: output }] };
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text", text: `Error: ${errMsg}` }],
        };
      }
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("solva-mcp server running over stdio");
  console.error(`wallet: ${signer.address}`);
  console.error(`network: ${network}`);
}

main().catch((error) => {
  console.error("Fatal error starting MCP server:", error);
  process.exit(1);
});
