import { hexToBytes, keccak256, toHex, type Abi, type Address, type Hex } from "viem";
import { evmToQor, msg, qorToEvm } from "@qorechain/sdk";
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
import { findTransfers, observeTransfer, type ObserveError } from "./observe.js";
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

/**
 * What the beneficiary did with a deposit. Only "accepted" and "rejected" are answered on chain. A deposit with no
 * record from its own sender is left unanswered: anyone can send dust with a copied memo, and that must not let them
 * decide the fate of someone else's record.
 */
export type Outcome =
  | { decision: "accepted"; record: TravelRecord }
  | { decision: "rejected"; reason: "DoesNotOpen" | "NotARecipient" }
  | { decision: "noRecord" }
  | { decision: "alreadyAnswered"; answer: "accepted" | "rejected" }
  | { decision: "notTravelSeal"; error: ObserveError };

export interface LedgerRecord {
  exists: boolean;
  beneficiary: Address;
  decision: "pending" | "accepted" | "rejected";
  reason: number;
  envelopeHash: Hex;
}

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
    const close = async () => {
      // A failed close must not hide the error that got us here; the window also expires on its own.
      const closed = await closeWindow(ctx.chain, id.account).catch((e) => {
        ctx.log({ label: `${label}: close EVM window failed`, detail: `${id.role}: ${e instanceof Error ? e.message : String(e)}`, lane: "native" });
        return undefined;
      });
      if (closed) ctx.log({ label: `${label}: close EVM window`, detail: id.role, hash: closed.hash, lane: "native" });
    };
    try {
      const opened = await openWindow(ctx.chain, id.account, { targets: [ledger], txs: 1, maxValueUqor: windowBudgetUqor(gas, fees.maxFeePerGas, 1) + 1n });
      ctx.log({ label: `${label}: open EVM window`, detail: `${id.role}, scoped to the ledger, 1 tx (hybrid-signed)`, hash: opened.hash, lane: "native" });
      // Opening the window advanced the sequence, which is also the EVM nonce: read it now.
      const nonce = await pub.getTransactionCount({ address: wallet.account.address, blockTag: "pending" });
      const hash = await wallet.writeContract({ ...call, gas, maxFeePerGas: fees.maxFeePerGas, maxPriorityFeePerGas: fees.maxPriorityFeePerGas, nonce } as any);
      const receipt = await pub.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error(`${functionName} reverted: ${hash}`);
      ctx.log({ label, detail: `${functionName}: ML-DSA-87 signature checked on chain by pqcVerify, gas ${receipt.gasUsed}`, hash, lane: "evm" });
      return hash;
    } finally {
      await close();
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
    ctx.log({ label: "transfer", detail: `${Number(amount) / 1e6} ${denom === FUSD_DENOM ? "fUSD" : denom === "uqor" ? "QOR" : denom} to ${short(to)}, memo travelseal:${transferId.slice(0, 8)}… (hybrid-signed)`, hash: tx.hash, lane: "native" });
    return tx.hash;
  }

  /**
   * RecordPosted events, newest first, optionally narrowed to one transfer id and originator. The public RPC caps
   * eth_getLogs at 10,000 blocks, so scan backwards from the head in chunks, down to the deploy block. Each envelope
   * is checked against its hash.
   */
  async function scanPosted(filter: { transferId?: TransferId; originator?: Address } = {}, stopAtFirst = false): Promise<PostedEvent[]> {
    const CHUNK = 9_999n, out: PostedEvent[] = [], start = BigInt(ctx.deployment.block);
    const args = { ...(filter.transferId ? { transferId: asBytes32(filter.transferId) } : {}), ...(filter.originator ? { originator: filter.originator } : {}) };
    for (let to = await pub.getBlockNumber(); to >= start; to -= CHUNK + 1n) {
      const from = to - CHUNK > start ? to - CHUNK : start;
      const logs = await pub.getContractEvents({ address: ledger, abi: ledgerAbi, eventName: "RecordPosted", args, fromBlock: from, toBlock: to });
      for (const log of [...logs].reverse() as any[]) {
        const e = log.args as { transferId: Hex; originator: Address; beneficiary: Address; period: number; envelopeHash: Hex; envelope: Hex };
        if (keccak256(e.envelope) !== e.envelopeHash) throw new Error(`event envelope for ${e.transferId} does not match its hash`);
        out.push({ transferId: e.transferId.slice(2) as TransferId, originator: e.originator, beneficiary: e.beneficiary, period: Number(e.period), envelope: hexToBytes(e.envelope), block: log.blockNumber, txHash: log.transactionHash });
        if (stopAtFirst) return out;
      }
    }
    return out;
  }

  /** The ledger's record for (originator, transfer id). Records are keyed by both, so a copied id finds nothing. */
  async function readRecord(originator: Address, transferId: TransferId): Promise<LedgerRecord> {
    const r = await pub.readContract({ address: ledger, abi: ledgerAbi, functionName: "records", args: [originator, asBytes32(transferId)] });
    return {
      exists: r.originator !== "0x0000000000000000000000000000000000000000",
      beneficiary: r.beneficiary,
      decision: (["pending", "accepted", "rejected"] as const)[r.decision] ?? "pending",
      reason: r.reason,
      envelopeHash: r.envelopeHash,
    };
  }

  /**
   * Beneficiary: rebuild the terms from the deposit that landed, look up the record its sender posted, open it with
   * those terms, and answer on chain. The receiver never trusts what the sender claims, and never answers a record
   * on the strength of a deposit from anyone but that record's originator.
   */
  async function receiveAndAnswer(receiver: Identity, depositTx: string): Promise<{ outcome: Outcome; answerTx?: Hex }> {
    const observed = observeTransfer((await ctx.chain.waitForTx(depositTx)) as any, receiver.account.cosmos);
    if (!observed.ok) return { outcome: { decision: "notTravelSeal", error: observed.error } };
    const { terms } = observed;
    const originator = qorToEvm(terms.originator) as Address;
    ctx.log({ label: "receive", detail: `deposit of ${Number(terms.amount) / 1e6} ${terms.denom === FUSD_DENOM ? "fUSD" : terms.denom === "uqor" ? "QOR" : terms.denom} from ${short(terms.originator)} read from the chain, transfer ${terms.transferId.slice(0, 8)}…`, hash: depositTx, lane: "native" });

    const onLedger = await readRecord(originator, terms.transferId);
    if (!onLedger.exists || onLedger.beneficiary.toLowerCase() !== receiver.account.evm.toLowerCase()) {
      ctx.log({ label: "no record", detail: "the sender of this deposit posted no TravelSeal record for it to us; left unanswered", lane: "local" });
      return { outcome: { decision: "noRecord" } };
    }
    if (onLedger.decision !== "pending") return { outcome: { decision: "alreadyAnswered", answer: onLedger.decision } };
    const event = (await scanPosted({ transferId: terms.transferId, originator }, true))[0];
    if (!event) throw new Error(`record ${terms.transferId} is on the ledger but its RecordPosted event was not found`);

    const opened = openRecord(event.envelope, receiver.seal, terms);
    const outcome: Outcome = opened.ok ? { decision: "accepted", record: opened.record } : { decision: "rejected", reason: opened.reason === "NOT_A_RECIPIENT" ? "NotARecipient" : "DoesNotOpen" };
    ctx.log({ label: "open record", detail: opened.ok ? "opened with the terms of the deposit that landed" : `does not open with the terms of the deposit that landed (${opened.reason})`, lane: "local" });

    const decision = outcome.decision === "accepted" ? Decision.Accepted : Decision.Rejected;
    const reason = outcome.decision === "accepted" ? RejectReason.None : RejectReason[outcome.reason];
    const args = { transferId: asBytes32(terms.transferId), originator, envelopeHash: onLedger.envelopeHash, decision, reason };
    const onChain = await pub.readContract({ address: ledger, abi: ledgerAbi, functionName: "answerPayload", args: [args.transferId, originator, args.envelopeHash, decision, reason] });
    if (onChain !== answerPayload(ledger, args)) throw new Error("TS and contract disagree on the answer payload; refusing to sign");
    const answerTx = await ledgerTx(receiver, outcome.decision === "accepted" ? "accept record" : "reject record", "answer", [args.transferId, originator, decision, reason, pqSignPayload(receiver.account, onChain)]);
    return { outcome, answerTx };
  }

  /**
   * A quarter's auditor opens every record filed under `period`, each against a transfer its originator actually
   * sent. One unreadable or malformed record never stops the rest of the quarter.
   */
  async function auditQuarter(auditor: Identity, period: number): Promise<AuditEntry[]> {
    const events = (await scanPosted()).filter((e) => e.period === period);
    const out: AuditEntry[] = [];
    for (const event of events) {
      const deposits = await findTransfers(ctx.chain, evmToQor(event.beneficiary), event.transferId, evmToQor(event.originator));
      if (deposits.length === 0) { out.push({ status: "noTransfer", event }); continue; }
      let flagged: AuditEntry | undefined;
      let openedEntry: AuditEntry | undefined;
      for (const d of deposits) {
        const r = openRecord(event.envelope, auditor.seal, d.terms);
        if (r.ok) { openedEntry = { status: "opened", event, record: r.record, transferTx: d.hash }; break; }
        flagged ??= { status: "flagged", event, reason: r.reason, transferTx: d.hash };
      }
      out.push(openedEntry ?? flagged!);
    }
    const n = (s: AuditEntry["status"]) => out.filter((e) => e.status === s).length;
    ctx.log({ label: `audit ${period}`, detail: `${auditor.role} opened ${n("opened")} of ${out.length} records against their landed transfers, flagged ${n("flagged")}, ${n("noTransfer")} had no transfer`, lane: "local" });
    return out;
  }

  return { postRecord, sendTransfer, scanPosted, readRecord, receiveAndAnswer, auditQuarter, envelopeText: envelopeToText, log: ctx.log };
}

export type Flows = ReturnType<typeof createFlows>;
