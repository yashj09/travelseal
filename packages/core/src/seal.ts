import { envelopeFromText, envelopeToText, isQoreSealError, open, seal, type SealKeyPair, type SealRecipient } from "@qorechain/qoreseal";
import { bindingAad, type TransferTerms } from "./binding.js";
import { CHAIN_ID, SEAL_PURPOSE } from "./config.js";
import { decodeRecord, encodeRecord, termsOf, type TravelRecord } from "./record.js";

export { envelopeFromText, envelopeToText };

/** Seal a record to its recipients (receiving exchange, auditor quarter), bound to the transfer terms it describes. */
export function sealRecord(record: TravelRecord, recipients: SealRecipient[]): Uint8Array {
  return seal({ chainId: CHAIN_ID, purpose: SEAL_PURPOSE, recipients, plaintext: encodeRecord(record), aad: bindingAad(termsOf(record)), mode: "hybrid" });
}

export type OpenResult =
  | { ok: true; record: TravelRecord }
  | { ok: false; reason: "DECRYPTION_FAILED" | "NOT_A_RECIPIENT" | "MALFORMED_ENVELOPE" | "TERMS_MISMATCH" };

/**
 * Open with terms rebuilt from the chain. A changed amount, denom, sender, beneficiary or transfer id fails AES-GCM
 * authentication, so the binding check is the decryption itself.
 */
export function openRecord(envelope: Uint8Array, keys: SealKeyPair, observed: TransferTerms): OpenResult {
  let bytes: Uint8Array;
  try {
    bytes = open({ chainId: CHAIN_ID, purpose: SEAL_PURPOSE, envelope, keys, aad: bindingAad(observed) });
  } catch (e) {
    for (const code of ["DECRYPTION_FAILED", "NOT_A_RECIPIENT", "MALFORMED_ENVELOPE"] as const)
      if (isQoreSealError(e, code)) return { ok: false, reason: code };
    throw e;
  }
  const record = decodeRecord(bytes);
  const t = termsOf(record);
  const same = (Object.keys(t) as (keyof TransferTerms)[]).every((k) => t[k] === observed[k]);
  return same ? { ok: true, record } : { ok: false, reason: "TERMS_MISMATCH" };
}
