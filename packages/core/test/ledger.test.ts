import { describe, expect, it } from "vitest";
import { messagePqSignBytes, pqVerify } from "@qorechain/qoresign";
import { hexToBytes, keccak256, toHex } from "viem";
import { CHAIN_ID, Decision, answerPayload, identityFromMnemonic, newMnemonic, periodOf, postPayload, pqSignPayload } from "../src/index.js";

const ledger = "0x1111111111111111111111111111111111111111" as const;
const args = {
  transferId: keccak256(toHex("t")),
  originator: "0x2222222222222222222222222222222222222222" as const,
  beneficiary: "0x3333333333333333333333333333333333333333" as const,
  period: 20264,
  envelopeHash: keccak256(toHex("envelope")),
};

describe("ledger signatures", () => {
  it("verify over the message-signing-v1 bytes the contract rebuilds", async () => {
    const id = await identityFromMnemonic("vasp-mumbai", newMnemonic());
    const payload = postPayload(ledger, args);
    const sig = hexToBytes(pqSignPayload(id.account, payload));
    expect(sig.length).toBe(4627);
    const contractMessage = new Uint8Array([...new TextEncoder().encode(`qorechain-msg-v1|${CHAIN_ID}|`), ...hexToBytes(payload)]);
    expect(messagePqSignBytes(CHAIN_ID, hexToBytes(payload))).toEqual(contractMessage);
    expect(pqVerify(id.account.pqc.publicKey, contractMessage, sig)).toBe(true);
  });

  it("separates post and answer payloads", () => {
    const post = postPayload(ledger, args);
    const answer = answerPayload(ledger, { transferId: args.transferId, originator: args.originator, envelopeHash: args.envelopeHash, decision: Decision.Accepted, reason: 0 });
    expect(post.slice(0, 66)).not.toBe(answer.slice(0, 66));
  });

  it("numbers periods by quarter", () => {
    expect(periodOf(new Date("2026-11-18T00:00:00Z"))).toBe(20264);
    expect(periodOf(new Date("2026-08-01T00:00:00Z"))).toBe(20263);
  });
});
