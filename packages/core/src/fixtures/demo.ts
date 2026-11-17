import type { TransferId } from "../binding.js";
import { FUSD_DENOM } from "../config.js";
import type { TravelRecord } from "../record.js";

/** Fictional people and exchanges. Nothing here describes a real person or business. */
export function demoRecord(args: { transferId: TransferId; originatorAddress: string; beneficiaryAddress: string; amount?: string }): TravelRecord {
  return {
    version: 1,
    transferId: args.transferId,
    originator: {
      vasp: { legalName: "Arabian Sea Digital Exchange (fictional)", country: "IN", address: args.originatorAddress },
      customer: {
        name: { primaryIdentifier: "Kulkarni", secondaryIdentifier: "Meera" },
        geographicAddress: { townName: "Mumbai", country: "IN" },
        nationalIdentification: { identifier: "Z0000000", type: "PASSPORT", country: "IN" },
        dateOfBirth: "1990-01-01",
      },
      account: "cust-0001",
    },
    beneficiary: {
      vasp: { legalName: "Straits Ledger Exchange (fictional)", country: "SG", address: args.beneficiaryAddress },
      customer: { name: { primaryIdentifier: "Tan", secondaryIdentifier: "Wei Ling" }, geographicAddress: { townName: "Singapore", country: "SG" } },
      account: "cust-9001",
    },
    transfer: { amount: args.amount ?? "5000000", denom: FUSD_DENOM },
    sentAt: "2026-11-24T10:00:00Z",
  };
}
