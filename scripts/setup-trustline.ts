import * as StellarSdk from "@stellar/stellar-sdk";

const TESTNET_HORIZON = "https://horizon-testnet.stellar.org";
const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";
const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

async function setupTrustline() {
  const secretKey = process.env.STELLAR_SECRET_KEY?.trim();
  if (!secretKey) {
    console.error("Set STELLAR_SECRET_KEY env var first");
    process.exit(1);
  }

  const keypair = StellarSdk.Keypair.fromSecret(secretKey);
  const server = new StellarSdk.Horizon.Server(TESTNET_HORIZON);
  const account = await server.loadAccount(keypair.publicKey());

  const usdcAsset = new StellarSdk.Asset("USDC", USDC_ISSUER);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: TESTNET_PASSPHRASE,
  })
    .addOperation(StellarSdk.Operation.changeTrust({ asset: usdcAsset }))
    .setTimeout(30)
    .build();

  tx.sign(keypair);
  const result = await server.submitTransaction(tx);
  console.log("✓ USDC trustline added!");
  console.log(`  Tx hash: ${(result as { hash: string }).hash}`);
  console.log(`  Account: ${keypair.publicKey()}`);
  console.log("\nNow get testnet USDC:");
  console.log("  Visit https://laboratory.stellar.org/#account-creator?network=test");
  console.log("  Or use a testnet USDC faucet");
}

setupTrustline().catch((e) => {
  console.error("Failed:", e.message);
});
