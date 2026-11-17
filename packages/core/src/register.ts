import { buildRegisterPqcKeyMsg, msg, signProofOfPossession } from "@qorechain/sdk";
import { equalBytes } from "./bytes.js";
import type { Chain, TxResult } from "./chain.js";
import { CHAIN_ID } from "./config.js";
import type { Identity } from "./identity.js";

export type StepOutcome = { kind: "done"; tx: TxResult } | { kind: "already" };

/**
 * Register the account's ML-DSA-87 key with proof of possession. Idempotent: the chain charges the fee even when it
 * refuses a second registration, so we read first and only send when nothing is registered.
 */
export async function registerPqcKey(chain: Chain, id: Identity): Promise<StepOutcome> {
  const status = await chain.pqcAccount(id.account.cosmos);
  if (status.found) {
    if (!status.publicKey || !equalBytes(status.publicKey, id.account.pqc.publicKey))
      throw new Error(`${id.role}: a different PQC key is already registered for ${id.account.cosmos}`);
    return { kind: "already" };
  }
  const proofOfPossession = signProofOfPossession({ chainId: CHAIN_ID, account: id.account.cosmos, keypair: id.account.pqc });
  const message = buildRegisterPqcKeyMsg(id.account.cosmos, { pqcKeypair: id.account.pqc, proofOfPossession });
  // The first registration is the one message the chain accepts classical-only.
  return { kind: "done", tx: await chain.send(id.account, [message], { gas: 900_000, mode: "classical" }) };
}

/** Publish the QoreSeal ML-KEM-1024 key in the on-chain registry. Idempotent. Must be hybrid-signed. */
export async function registerKemKey(chain: Chain, id: Identity): Promise<StepOutcome> {
  const current = await chain.kemKey(id.account.cosmos);
  if (current.found && current.publicKey && equalBytes(current.publicKey, id.seal.mlkemPublicKey)) return { kind: "already" };
  const message = msg.pqc.registerKemKey({ sender: id.account.cosmos, algorithmId: 2, publicKey: id.seal.mlkemPublicKey });
  return { kind: "done", tx: await chain.send(id.account, [message], { gas: 400_000 }) };
}
