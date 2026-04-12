import * as StellarSdk from "@stellar/stellar-sdk";

const TESTNET_HORIZON = "https://horizon-testnet.stellar.org";
const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";
const USDC_TESTNET_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

/**
 * Send a real USDC payment on Stellar testnet.
 * Used for mock service URLs where x402 flow can't work (no server to return 402).
 * Returns the transaction hash.
 */
export async function sendTestnetPayment(
  secretKey: string,
  amountUSDC: number,
): Promise<string> {
  const keypair = StellarSdk.Keypair.fromSecret(secretKey);
  const publicKey = keypair.publicKey();

  const server = new StellarSdk.Horizon.Server(TESTNET_HORIZON);
  const account = await server.loadAccount(publicKey);

  const usdcAsset = new StellarSdk.Asset("USDC", USDC_TESTNET_ISSUER);

  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: TESTNET_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: publicKey,
        asset: usdcAsset,
        amount: amountUSDC.toFixed(7),
      }),
    )
    .setTimeout(30)
    .build();

  transaction.sign(keypair);

  const result = await server.submitTransaction(transaction);
  return (result as { hash: string }).hash;
}
