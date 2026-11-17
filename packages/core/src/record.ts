import type { TransferId, TransferTerms } from "./binding.js";

/** A labelled subset of IVMS101 natural-person fields. All demo data is fictional. */
export interface IvmsPerson {
  name: { primaryIdentifier: string; secondaryIdentifier: string };
  geographicAddress: { townName: string; country: string };
  nationalIdentification?: { identifier: string; type: "PASSPORT" | "NATIONAL_ID" | "TAX_ID"; country: string };
  dateOfBirth?: string;
}

export interface Vasp {
  legalName: string;
  country: string;
  address: string;
}

/** What the originating exchange must send with the transfer. */
export interface TravelRecord {
  version: 1;
  transferId: TransferId;
  originator: { vasp: Vasp; customer: IvmsPerson; account: string };
  beneficiary: { vasp: Vasp; customer: IvmsPerson; account: string };
  transfer: { amount: string; denom: string };
  sentAt: string;
}

export const termsOf = (r: TravelRecord): TransferTerms => ({
  transferId: r.transferId,
  originator: r.originator.vasp.address,
  beneficiary: r.beneficiary.vasp.address,
  amount: r.transfer.amount,
  denom: r.transfer.denom,
});

export const encodeRecord = (r: TravelRecord) => new TextEncoder().encode(JSON.stringify(r));

export function decodeRecord(bytes: Uint8Array): TravelRecord {
  const r = JSON.parse(new TextDecoder().decode(bytes)) as TravelRecord;
  if (r.version !== 1) throw new Error(`unsupported record version ${String((r as { version?: unknown }).version)}`);
  return r;
}
