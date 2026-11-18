import { describe, expect, it } from "vitest";
import { FUSD_DENOM, observeTransfer, transferMemo, type TransferId } from "../src/index.js";

const id = "ab".repeat(32) as TransferId;
const A = "qor1ywtz48pch687hqup4up5ahsdvy93su3s5zk75k", B = "qor1ketaxqdhxccmt92gx8dygqpp0m88csna4mgfws";
const tx = (over: { code?: number; memo?: string; messages?: any[] } = {}) => ({
  tx_response: { txhash: "H", code: over.code ?? 0, height: "10" },
  tx: { body: { memo: over.memo ?? transferMemo(id), messages: over.messages ?? [{ "@type": "/cosmos.bank.v1beta1.MsgSend", from_address: A, to_address: B, amount: [{ denom: FUSD_DENOM, amount: "250000" }] }] } },
});

describe("observeTransfer", () => {
  it("reads the terms from the landed transaction", () => {
    expect(observeTransfer(tx(), B)).toEqual({ ok: true, hash: "H", height: 10, terms: { transferId: id, originator: A, beneficiary: B, amount: "250000", denom: FUSD_DENOM } });
  });
  it.each([
    ["TX_FAILED", tx({ code: 5 }), B],
    ["NOT_TO_THIS_RECEIVER", tx(), A],
    ["NO_TRAVELSEAL_MEMO", tx({ memo: "hello" }), B],
    ["NOT_A_SINGLE_SEND", tx({ messages: [] }), B],
    ["MULTI_DENOM", tx({ messages: [{ "@type": "/cosmos.bank.v1beta1.MsgSend", from_address: A, to_address: B, amount: [{ denom: "uqor", amount: "1" }, { denom: FUSD_DENOM, amount: "1" }] }] }), B],
  ] as const)("refuses %s", (error, t, receiver) => {
    expect(observeTransfer(t, receiver)).toMatchObject({ ok: false, error });
  });
});
