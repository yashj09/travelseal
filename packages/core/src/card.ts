import { signRecipientCard, verifyRecipientCard, type RecipientCard, type SealRecipient } from "@qorechain/qoreseal";
import type { Chain } from "./chain.js";
import { CHAIN_ID } from "./config.js";
import type { Identity } from "./identity.js";

export type { RecipientCard };

export const makeCard = (id: Identity, issuedAt?: Date): RecipientCard =>
  signRecipientCard({
    chainId: CHAIN_ID,
    address: id.account.cosmos,
    keys: id.seal,
    classicalKey: id.classical,
    pqKey: id.account.pqc,
    ...(issuedAt ? { issuedAt } : {}),
  });

export class RecipientRejected extends Error {}

/**
 * Turn a published card into a sealing target, trusting only the chain: the ML-DSA-87 key must be registered with
 * proof of possession, and the card must be signed by it and name the ML-KEM key in the on-chain registry.
 */
export async function resolveRecipient(chain: Chain, address: string, card: RecipientCard): Promise<SealRecipient> {
  const [pqc, kem] = await Promise.all([chain.pqcAccount(address), chain.kemKey(address)]);
  if (!pqc.found || !pqc.publicKey) throw new RecipientRejected(`${address} has no ML-DSA-87 key registered`);
  if (pqc.algorithmId !== 1) throw new RecipientRejected(`${address} key is not ML-DSA-87 (algorithm ${pqc.algorithmId})`);
  if (!pqc.possessionProven) throw new RecipientRejected(`${address} registered its key without proof of possession`);
  if (!kem.found || !kem.publicKey) throw new RecipientRejected(`${address} has no ML-KEM-1024 key in the registry`);
  try {
    return verifyRecipientCard({ card, chainId: CHAIN_ID, address, pqPublicKey: pqc.publicKey, mlkemPublicKey: kem.publicKey });
  } catch (e) {
    throw new RecipientRejected(`${address} card does not verify against its on-chain keys: ${(e as Error).message}`);
  }
}
