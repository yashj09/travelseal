import { hexToBytes, keccak256, toHex, type Abi, type Address, type Hex } from "viem";
import { evmToQor, msg } from "@qorechain/sdk";
import type { Chain } from "./chain.js";
import { FUSD_DENOM } from "./config.js";
import { resolveRecipient, type RecipientCard } from "./card.js";
import { newTransferId, transferMemo, type TransferId } from "./binding.js";
import { demoRecord } from "./fixtures/demo.js";
import type { Identity } from "./identity.js";
import {
  Decision, RejectReason, answerPayload, closeWindow, ledgerAbi, openWindow, periodOf, postPayload, pqSignPayload,
  publicClient, walletClient, windowBudgetUqor,
} from "./ledger.js";
import { findTransfer, observeTransfer, type ObserveError } from "./observe.js";
import type { TravelRecord } from "./record.js";
import { envelopeToText, openRecord, sealRecord } from "./seal.js";

/** One visible step of a flow. The CLI writes these to docs/EVIDENCE.md; the app shows them in the "under the hood" panel. */
export interface Step {
  label: string;
  detail: string;
  hash?: string;
  lane: "native" | "evm" | "local";
}

export interface FlowContext {
  chain: Chain;
  deployment: { ledger: Address; block: number };
  /** Published recipient cards, by qor1 address. Cards are public; trust comes from checking them against chain state. */
  cardFor: (address: string) => RecipientCard | undefined;
  log: (step: Step) => void;
  evmRpc?: string;
}

export interface PostedRecord {
  transferId: TransferId;
  envelope: Uint8Array;
  envelopeHash: Hex;
  period: number;
  record: TravelRecord;
  postTx: Hex;
}

export interface PostedEvent {
  transferId: TransferId;
  originator: Address;
  beneficiary: Address;
  period: number;
  envelope: Uint8Array;
  block: bigint;
  txHash: Hex;
}

export type Outcome = { decision: "accepted"; record: TravelRecord } | { decision: "rejected"; reason: Exclude<keyof typeof RejectReason, "None"> };

export type AuditEntry =
  | { status: "opened"; event: PostedEvent; record: TravelRecord; transferTx: string }
  | { status: "flagged"; event: PostedEvent; reason: string; transferTx: string }
  | { status: "noTransfer"; event: PostedEvent };

const asBytes32 = (id: TransferId) => `0x${id}` as Hex;
const short = (s: string) => `${s.slice(0, 12)}…`;

export function createFlows(ctx: FlowContext) {
  const pub = publicClient(ctx.evmRpc);
  const { ledger } = ctx.deployment;

  /**
   * Send one ledger call from `id` inside a window scoped to the ledger that admits exactly that call, then close it.
   * The ML-DSA-87 signature inside the call is what authorises it; the window only bounds what this account's classical key can do.
   */
  async function ledgerTx(id: Identity, label: string, functionName: "postRecord" | "answer", args: readonly unknown[]): Promise<Hex> {
    const wallet = walletClient(id.account, ctx.evmRpc);
    const call = { address: ledger, abi: ledgerAbi as Abi, functionName, args } as const;
    const gas = ((await pub.estimateContractGas({ ...call, account: wallet.account })) * 13n) / 10n;
    const fees = await pub.estimateFeesPerGas();
    const opened = await openWindow(ctx.chain, id.account, { targets: [ledger], txs: 1, maxValueUqor: windowBudgetUqor(gas, fees.maxFeePerGas, 1) + 1n });
    ctx.log({ label: `${label}: open EVM window`, detail: `${id.role}, scoped to the ledger, 1 tx (hybrid-signed)`, hash: opened.hash, lane: "native" });
    try {
      // Opening the window advanced the sequence, which is also the EVM nonce: read it now.
      const nonce = await pub.getTransactionCount({ address: wallet.account.address, blockTag: "pending" });
      const hash = await wallet.writeContract({ ...call, gas, maxFeePerGas: fees.maxFeePerGas, maxPriorityFeePerGas: fees.maxPriorityFeePerGas, nonce } as any);
      const receipt = await pub.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error(`${functionName} reverted: ${hash}`);
      ctx.log({ label, detail: `${functionName}: ML-DSA-87 signature checked on chain by pqcVerify, gas ${receipt.gasUsed}`, hash, lane: "evm" });
      return hash;
    } finally {
      const closed = await closeWindow(ctx.chain, id.account);
      if (closed) ctx.log({ label: `${label}: close EVM window`, detail: id.role, hash: closed.hash, lane: "native" });
    }
  }

  /** Originator: seal the record to the beneficiary and the period's auditor, sign it with ML-DSA-87, post it. */
  async function postRecord(a: { sender: Identity; receiver: Identity; auditor: Identity; amount: string; period?: number; record?: TravelRecord }): Promise<PostedRecord> {
    const recipients = [];
    for (const id of [a.receiver, a.auditor]) {
      const card = ctx.cardFor(id.account.cosmos);
      if (!card) throw new Error(`no published recipient card for ${id.role}`);
      recipients.push(await resolveRecipient(ctx.chain, id.account.cosmos, card));
    }
    ctx.log({ label: "resolve recipients", detail: `${a.receiver.role} and ${a.auditor.role}: ML-DSA-87 key with proof of possession, ML-KEM-1024 key and card all check out on chain`, lane: "local" });
    const record = a.record ?? demoRecord({ transferId: newTransferId(), originatorAddress: a.sender.account.cosmos, beneficiaryAddress: a.receiver.account.cosmos, amount: a.amount });
    const envelope = sealRecord(record, recipients);
    const period = a.period ?? periodOf(new Date());
    ctx.log({ label: "seal record", detail: `${envelope.length} B hybrid ML-KEM-1024 + X25519 envelope, bound to transfer ${record.transferId.slice(0, 8)}…, ${Number(record.transfer.amount) / 1e6} fUSD`, lane: "local" });
    const args = { transferId: asBytes32(record.transferId), originator: a.sender.account.evm as Address, beneficiary: a.receiver.account.evm as Address, period, envelopeHash: keccak256(envelope) };
    const onChain = await pub.readContract({ address: ledger, abi: ledgerAbi, functionName: "postPayload", args: [args.transferId, args.originator, args.beneficiary, args.period, args.envelopeHash] });
    if (onChain !== postPayload(ledger, args)) throw new Error("TS and contract disagree on the post payload; refusing to sign");
    const postTx = await ledgerTx(a.sender, "post record", "postRecord", [args.transferId, args.originator, args.beneficiary, args.period, toHex(envelope), pqSignPayload(a.sender.account, onChain)]);
    return { transferId: record.transferId, envelope, envelopeHash: args.envelopeHash, period, record, postTx };
  }

  /** Originator: the value transfer itself, a hybrid-signed native send carrying the transfer id in its memo. */
  async function sendTransfer(sender: Identity, to: string, transferId: TransferId, amount: string, denom = FUSD_DENOM): Promise<string> {
    const tx = await ctx.chain.send(sender.account, [msg.bank.send({ fromAddress: sender.account.cosmos, toAddress: to, amount: [{ denom, amount }] })], { gas: 250_000, memo: transferMemo(transferId) });
    ctx.log({ label: "transfer", detail: `${Number(amount) / 1e6} fUSD to ${short(to)}, memo travelseal:${transferId.slice(0, 8)}… (hybrid-signed)`, hash: tx.hash, lane: "native" });
    return tx.hash;
  }

  /**
   * RecordPosted events (optionally for one transfer), newest first. The public RPC caps eth_getLogs at 10,000
   * blocks, so scan backwards from the head in chunks, down to the deploy block. Each envelope is checked against its hash.
   */
  async function scanPosted(transferId?: TransferId, stopAtFirst = false): Promise<PostedEvent[]> {
    const CHUNK = 9_999n, out: PostedEvent[] = [], start = BigInt(ctx.deployment.block);
    for (let to = await pub.getBlockNumber(); to >= start; to -= CHUNK + 1n) {
      const from = to - CHUNK > start ? to - CHUNK : start;
      const logs = await pub.getContractEvents({ address: ledger, abi: ledgerAbi, eventName: "RecordPosted", ...(transferId ? { args: { transferId: asBytes32(transferId) } } : {}), fromBlock: from, toBlock: to });
      for (const log of [...logs].reverse() as any[]) {
        const e = log.args as { transferId: Hex; originator: Address; beneficiary: Address; period: number; envelopeHash: Hex; envelope: Hex };
        if (keccak256(e.envelope) !== e.envelopeHash) throw new Error(`event envelope for ${e.transferId} does not match its hash`);
        out.push({ transferId: e.transferId.slice(2) as TransferId, originator: e.originator, beneficiary: e.beneficiary, period: Number(e.period), envelope: hexToBytes(e.envelope), block: log.blockNumber, txHash: log.transactionHash });
        if (stopAtFirst) return out;
      }
    }
    return out;
  }

  async function readAnswer(transferId: TransferId): Promise<{ decision: "pending" | "accepted" | "rejected"; reason: number }> {
    const r = await pub.readContract({ address: ledger, abi: ledgerAbi, functionName: "records", args: [asBytes32(transferId)] });
    return { decision: (["pending", "accepted", "rejected"] as const)[r[3]] ?? "pending", reason: r[4] };
  }

  /**
   * Beneficiary: rebuild the terms from the deposit that landed, open the record with them, and answer on chain.
   * A record that does not open for these exact terms is rejected; the receiver never trusts what the sender claims.
   */
  async function receiveAndAnswer(receiver: Identity, depositTx: string): Promise<{ outcome: Outcome | { decision: "notTravelSeal"; error: ObserveError }; answerTx?: Hex }> {
    const observed = observeTransfer((await ctx.chain.waitForTx(depositTx)) as any, receiver.account.cosmos);
    if (!observed.ok) return { outcome: { decision: "notTravelSeal", error: observed.error } };
    const { terms } = observed;
    ctx.log({ label: "receive", detail: `deposit of ${Number(terms.amount) / 1e6} fUSD from ${short(terms.originator)} read from the chain, transfer ${terms.transferId.slice(0, 8)}…`, hash: depositTx, lane: "native" });

    const event = (await scanPosted(terms.transferId, true))[0];
    let outcome: Outcome;
    if (!event) outcome = { decision: "rejected", reason: "NoRecord" };
    else {
      const opened = openRecord(event.envelope, receiver.seal, terms);
      outcome = opened.ok ? { decision: "accepted", record: opened.record } : { decision: "rejected", reason: opened.reason === "NOT_A_RECIPIENT" ? "NotARecipient" : "DoesNotOpen" };
      ctx.log({ label: "open record", detail: opened.ok ? "opened with the terms of the deposit that landed" : `does not open with the terms of the deposit that landed (${opened.reason})`, lane: "local" });
    }
    if (outcome.decision === "rejected" && outcome.reason === "NoRecord") {
      ctx.log({ label: "no record", detail: "no TravelSeal record was posted for this transfer", lane: "local" });
      return { outcome };
    }
    const r = await pub.readContract({ address: ledger, abi: ledgerAbi, functionName: "records", args: [asBytes32(terms.transferId)] });
    const decision = outcome.decision === "accepted" ? Decision.Accepted : Decision.Rejected;
    const reason = outcome.decision === "accepted" ? RejectReason.None : RejectReason[outcome.reason];
    const payload = answerPayload(ledger, { transferId: asBytes32(terms.transferId), envelopeHash: r[5], decision, reason });
    const answerTx = await ledgerTx(receiver, outcome.decision === "accepted" ? "accept record" : "reject record", "answer", [asBytes32(terms.transferId), decision, reason, pqSignPayload(receiver.account, payload)]);
    return { outcome, answerTx };
  }

  /** A quarter's auditor opens every record filed under `period`, each against the transfer that actually landed. */
  async function auditQuarter(auditor: Identity, period: number): Promise<AuditEntry[]> {
    const events = (await scanPosted()).filter((e) => e.period === period);
    const out: AuditEntry[] = [];
    for (const event of events) {
      const found = await findTransfer(ctx.chain, evmToQor(event.beneficiary), event.transferId);
      if (!found?.ok) { out.push({ status: "noTransfer", event }); continue; }
      const r = openRecord(event.envelope, auditor.seal, found.terms);
      out.push(r.ok ? { status: "opened", event, record: r.record, transferTx: found.hash } : { status: "flagged", event, reason: r.reason, transferTx: found.hash });
    }
    const n = (s: AuditEntry["status"]) => out.filter((e) => e.status === s).length;
    ctx.log({ label: `audit ${period}`, detail: `${auditor.role} opened ${n("opened")} of ${out.length} records against their landed transfers, flagged ${n("flagged")}, ${n("noTransfer")} had no transfer`, lane: "local" });
    return out;
  }

  return { postRecord, sendTransfer, scanPosted, readAnswer, receiveAndAnswer, auditQuarter, envelopeText: envelopeToText, log: ctx.log };
}

export type Flows = ReturnType<typeof createFlows>;
