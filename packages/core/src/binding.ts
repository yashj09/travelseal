import { bytesToHex, randomBytes, utf8ToBytes } from "@noble/hashes/utils.js";
import { CHAIN_ID } from "./config.js";

declare const brand: unique symbol;
export type TransferId = string & { readonly [brand]: "TransferId" };

const TRANSFER_ID = /^[0-9a-f]{64}$/;
const AMOUNT = /^[1-9][0-9]*$/;
const DENOM = /^[A-Za-z0-9/:._-]{2,128}$/;
const QOR1 = /^qor1[02-9ac-hj-np-z]{38,58}$/;
export const MEMO_PREFIX = "travelseal:";

export const newTransferId = (): TransferId => bytesToHex(randomBytes(32)) as TransferId;

export function parseTransferId(s: string): TransferId {
  if (!TRANSFER_ID.test(s)) throw new Error(`not a transfer id: ${s}`);
  return s as TransferId;
}

/** The on-chain facts a travel-rule record is bound to. The receiver rebuilds these from the transfer that actually landed. */
export interface TransferTerms {
  transferId: TransferId;
  originator: string;
  beneficiary: string;
  amount: string;
  denom: string;
}

export function validateTerms(t: TransferTerms): TransferTerms {
  parseTransferId(t.transferId);
  if (!QOR1.test(t.originator)) throw new Error(`bad originator address: ${t.originator}`);
  if (!QOR1.test(t.beneficiary)) throw new Error(`bad beneficiary address: ${t.beneficiary}`);
  if (!AMOUNT.test(t.amount)) throw new Error(`bad amount: ${t.amount}`);
  if (!DENOM.test(t.denom)) throw new Error(`bad denom: ${t.denom}`);
  return t;
}

/** Associated data for the envelope. Any difference in these fields makes the envelope fail to open. */
export function bindingAad(t: TransferTerms): Uint8Array {
  const v = validateTerms(t);
  return utf8ToBytes(["travelseal/v1", CHAIN_ID, v.transferId, v.originator, v.beneficiary, v.amount, v.denom].join("|"));
}

export const transferMemo = (id: TransferId) => MEMO_PREFIX + id;

export function transferIdFromMemo(memo: string): TransferId | undefined {
  if (!memo.startsWith(MEMO_PREFIX)) return undefined;
  const id = memo.slice(MEMO_PREFIX.length);
  return TRANSFER_ID.test(id) ? (id as TransferId) : undefined;
}
