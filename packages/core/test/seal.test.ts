import { beforeAll, describe, expect, it } from "vitest";
import { seal, verifyRecipientCard, type SealRecipient } from "@qorechain/qoreseal";
import {
  CHAIN_ID, SEAL_PURPOSE, bindingAad, demoRecord, identityFromMnemonic, makeCard, newMnemonic, newTransferId, openRecord, sealRecord,
  termsOf, transferIdFromMemo, transferMemo, type Identity, type TravelRecord,
} from "../src/index.js";

let sender: Identity, receiver: Identity, auditorQ4: Identity, auditorQ3: Identity;
let record: TravelRecord;
let envelope: Uint8Array;

const offlineRecipient = (id: Identity): SealRecipient =>
  verifyRecipientCard({ card: makeCard(id), chainId: CHAIN_ID, address: id.account.cosmos, pqPublicKey: id.account.pqc.publicKey, mlkemPublicKey: id.seal.mlkemPublicKey });

beforeAll(async () => {
  [sender, receiver, auditorQ3, auditorQ4] = (await Promise.all(
    (["vasp-mumbai", "vasp-singapore", "auditor-q3", "auditor-q4"] as const).map((r) => identityFromMnemonic(r, newMnemonic())),
  )) as [Identity, Identity, Identity, Identity];
  record = demoRecord({ transferId: newTransferId(), originatorAddress: sender.account.cosmos, beneficiaryAddress: receiver.account.cosmos });
  envelope = sealRecord(record, [offlineRecipient(receiver), offlineRecipient(auditorQ4)]);
});

describe("binding", () => {
  it("round-trips the transfer id through the memo", () => {
    expect(transferIdFromMemo(transferMemo(record.transferId))).toBe(record.transferId);
    expect(transferIdFromMemo("hello")).toBeUndefined();
  });

  it("refuses malformed terms instead of binding to them", () => {
    expect(() => bindingAad({ ...termsOf(record), amount: "05" })).toThrow(/bad amount/);
    expect(() => bindingAad({ ...termsOf(record), denom: "a|b" })).toThrow(/bad denom/);
  });
});

describe("sealed travel record", () => {
  it("opens for the receiver and the auditor when the observed transfer matches", () => {
    for (const who of [receiver, auditorQ4]) {
      const out = openRecord(envelope, who.seal, termsOf(record));
      expect(out).toEqual({ ok: true, record });
    }
  });

  it.each([
    ["amount", { amount: "4000000" }],
    ["beneficiary", "beneficiary"],
    ["originator", "originator"],
    ["denom", { denom: "uqor" }],
  ] as const)("fails to open when the landed transfer differs in %s", (_field, change) => {
    const t = termsOf(record);
    const observed =
      change === "beneficiary" ? { ...t, beneficiary: auditorQ3.account.cosmos }
      : change === "originator" ? { ...t, originator: auditorQ3.account.cosmos }
      : { ...t, ...change };
    expect(openRecord(envelope, receiver.seal, observed)).toEqual({ ok: false, reason: "DECRYPTION_FAILED" });
  });

  it("fails for a different transfer id", () => {
    expect(openRecord(envelope, receiver.seal, { ...termsOf(record), transferId: newTransferId() })).toEqual({ ok: false, reason: "DECRYPTION_FAILED" });
  });

  it("is closed to an auditor key from another quarter", () => {
    expect(openRecord(envelope, auditorQ3.seal, termsOf(record))).toEqual({ ok: false, reason: "NOT_A_RECIPIENT" });
  });

  it("stays closed to someone holding the receiver's X25519 secret but not its ML-KEM secret", () => {
    const eve = { ...auditorQ3.seal, x25519SecretKey: receiver.seal.x25519SecretKey, x25519PublicKey: receiver.seal.x25519PublicKey, mlkemPublicKey: receiver.seal.mlkemPublicKey };
    const out = openRecord(envelope, eve, termsOf(record));
    expect(out.ok).toBe(false);
  });

  it("reports sealed junk as a malformed record instead of throwing", () => {
    const junk = seal({ chainId: CHAIN_ID, purpose: SEAL_PURPOSE, recipients: [offlineRecipient(receiver)], plaintext: new TextEncoder().encode("{}"), aad: bindingAad(termsOf(record)), mode: "hybrid" });
    expect(openRecord(junk, receiver.seal, termsOf(record))).toEqual({ ok: false, reason: "MALFORMED_RECORD" });
  });
});
