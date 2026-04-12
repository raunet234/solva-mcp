# Solva MCP

Solva MCP is an MCP server for Claude Code that gives AI agents the ability to discover and autonomously pay for services using x402 on Stellar testnet. Type a task in Claude Code — Solva MCP finds the right service, pays with real USDC micropayments, and returns the result.

## Setup

1. Clone this repo:
   ```bash
   git clone https://github.com/your-username/solva-mcp.git
   cd solva-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your environment file:
   ```bash
   cp .env.example .env
   ```

4. Add your Stellar testnet secret key to `.env`:
   ```
   STELLAR_SECRET_KEY=S...your_testnet_secret_key...
   ```

5. Fund your testnet wallet:
   Visit [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test) to create and fund a testnet account.

6. Add to your Claude Code MCP config (see section below).

## MCP Configuration

Add this to your Claude Code MCP config file:

```json
{
  "mcpServers": {
    "solva": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/solva-mcp/src/index.ts"],
      "env": {
        "STELLAR_SECRET_KEY": "your_key_here"
      }
    }
  }
}
```

## Example Claude Code Prompts

- "Find me latest news about Notion"
- "Research AI payment trends in 2025"
- "What's the weather like in London?"
- "Summarize recent developments in blockchain payments"

## How x402 Works

- **402 Challenge**: Agent hits a paywalled endpoint → receives HTTP 402 with payment requirements
- **Automatic Payment**: Agent signs a Soroban auth entry and retries the request with a valid payment header
- **Instant Settlement**: Stellar settles the USDC micropayment on-chain in seconds

## Testnet Explorer

View transactions on the Stellar testnet explorer: [https://stellar.expert/explorer/testnet](https://stellar.expert/explorer/testnet)
