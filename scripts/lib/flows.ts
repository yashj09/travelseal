import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  Chain, Decision, FUSD_DENOM, RejectReason, answerPayload, closeWindow, demoRecord, envelopeToText, ledgerAbi, msg, newTransferId,
  observeTransfer, openRecord, openWindow, periodOf, postPayload, pqSignPayload, publicClient, resolveRecipient, sealRecord,
  transferMemo, walletClient, windowBudgetUqor, type Identity, type RecipientCard, type Role, type TransferId,
} from "@travelseal/core";
import { hexToBytes, keccak256, toHex, type Abi, type Address, type Hex } from "viem";
import { evidence } from "./evidence.js";
import { loadDeployment, saveTransfer, type TransferFile } from "./deployment.js";
import { ROOT } from "./secrets.js";

export const chain = new Chain();
const pub = publicClient();
const card = (r: Role): RecipientCard => JSON.parse(readFileSync(join(ROOT, "deployments", "cards", `${r}.json`), "utf8"));
const asBytes32 = (id: TransferId) => `0x${id}` as Hex;

/**
 * Send one ledger call from `id` inside a window scoped to the ledger that admits exactly that call, then close it.
 * The signature inside the call is what authorises it; the window only bounds what this account's classical key can do.
 */
async function ledgerTx(id: Identity, label: string, functionName: "postRecord" | "answer", args: readonly unknown[]): Promise<Hex> {
  const { ledger } = loadDeployment();
  const wallet = walletClient(id.account);
  const call = { address: ledger, abi: ledgerAbi as Abi, functionName, args } as const;
  const gas = ((await pub.estimateContractGas({ ...call, account: wallet.account })) * 13n) / 10n;
  const fees = await pub.estimateFeesPerGas();
  const opened = await openWindow(chain, id.account, { targets: [ledger], txs: 1, maxValueUqor: windowBudgetUqor(gas, fees.maxFeePerGas, 1) + 1n });
  evidence(`${label}: open EVM window`, `${id.role}, scoped to the ledger, 1 tx`, opened.hash);
  try {
    // Opening the window advanced the sequence, which is the EVM nonce.
    const nonce = await pub.getTransactionCount({ address: wallet.account.address, blockTag: "pending" });
    const hash = await wallet.writeContract({ ...call, gas, maxFeePerGas: fees.maxFeePerGas, maxPriorityFeePerGas: fees.maxPriorityFeePerGas, nonce } as any);
    const receipt = await pub.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") throw new Error(`${functionName} reverted: ${hash}`);
    evidence(label, `${functionName}, ML-DSA-87 signature checked on chain; gas ${receipt.gasUsed}`, hash);
    return hash;
  } finally {
    const closed = await closeWindow(chain, id.account);
    if (closed) evidence(`${label}: close EVM window`, id.role, closed.hash);
  }
}

/** Originator: seal the travel record to the beneficiary and this quarter's auditor, sign it with ML-DSA-87, post it. */
export async function postRecord(sender: Identity, receiver: Identity, auditor: Identity, amount: string): Promise<TransferFile> {
  const { ledger } = loadDeployment();
  const recipients = await Promise.all([receiver, auditor].map((id) => resolveRecipient(chain, id.account.cosmos, card(id.role))));
  const record = demoRecord({ transferId: newTransferId(), originatorAddress: sender.account.cosmos, beneficiaryAddress: receiver.account.cosmos, amount });
  const envelope = sealRecord(record, recipients);
  const args = { transferId: asBytes32(record.transferId), originator: sender.account.evm as Address, beneficiary: receiver.account.evm as Address, period: periodOf(new Date()), envelopeHash: keccak256(envelope) };
  const onChain = await pub.readContract({ address: ledger, abi: ledgerAbi, functionName: "postPayload", args: [args.transferId, args.originator, args.beneficiary, args.period, args.envelopeHash] });
  if (onChain !== postPayload(ledger, args)) throw new Error("TS and contract disagree on the post payload; refusing to sign");
  const postTx = await ledgerTx(sender, "post record", "postRecord", [args.transferId, args.originator, args.beneficiary, args.period, toHex(envelope), pqSignPayload(sender.account, onChain)]);
  const t: TransferFile = { transferId: args.transferId, envelope: envelopeToText(envelope), period: args.period, originator: sender.account.cosmos, beneficiary: receiver.account.cosmos, amount, denom: record.transfer.denom, postTx };
  saveTransfer(t);
  return t;
}

/** Originator: the actual value transfer, a hybrid-signed native send carrying the transfer id in its memo. */
export async function sendTransfer(sender: Identity, to: string, transferId: TransferId, amount: string, denom = FUSD_DENOM): Promise<string> {
  const tx = await chain.send(sender.account, [msg.bank.send({ fromAddress: sender.account.cosmos, toAddress: to, amount: [{ denom, amount }] })], { gas: 250_000, memo: transferMemo(transferId) });
  evidence("transfer", `${Number(amount) / 1e6} fUSD to ${to.slice(0, 12)}… with memo travelseal:${transferId.slice(0, 8)}…`, tx.hash);
  return tx.hash;
}

/**
 * Beneficiary: find the sealed envelope in the ledger's RecordPosted event and check it against the stored hash.
 * The public RPC caps eth_getLogs at 10,000 blocks, so scan backwards from the head in chunks, down to the deploy block.
 */
export async function fetchEnvelope(transferId: TransferId): Promise<Uint8Array | undefined> {
  const { ledger, block } = loadDeployment();
  const CHUNK = 9_999n;
  for (let to = await pub.getBlockNumber(); to >= BigInt(block); to -= CHUNK + 1n) {
    const from = to - CHUNK > BigInt(block) ? to - CHUNK : BigInt(block);
    const logs = await pub.getContractEvents({ address: ledger, abi: ledgerAbi, eventName: "RecordPosted", args: { transferId: asBytes32(transferId) }, fromBlock: from, toBlock: to });
    const log = logs[0] as { args: { envelope: Hex; envelopeHash: Hex } } | undefined;
    if (!log) continue;
    if (keccak256(log.args.envelope) !== log.args.envelopeHash) throw new Error("event envelope does not match its hash");
    return hexToBytes(log.args.envelope);
  }
  return undefined;
}

export type Outcome = { decision: "accepted" } | { decision: "rejected"; reason: keyof typeof RejectReason };

/**
 * Beneficiary: rebuild the terms from the deposit that landed, open the record with them, and answer on chain.
 * A record that does not open for these exact terms is rejected; the receiver never trusts what the sender claims.
 */
export async function receiveAndAnswer(receiver: Identity, depositTx: string): Promise<{ outcome: Outcome; answerTx: Hex }> {
  const { ledger } = loadDeployment();
  const observed = observeTransfer((await chain.waitForTx(depositTx)) as any, receiver.account.cosmos);
  if (!observed.ok) throw new Error(`deposit ${depositTx} is not a TravelSeal transfer: ${observed.error}`);
  const { terms } = observed;
  evidence("receive", `deposit ${Number(terms.amount) / 1e6} fUSD from ${terms.originator.slice(0, 12)}…, transfer ${terms.transferId.slice(0, 8)}…`);

  const envelope = await fetchEnvelope(terms.transferId);
  let outcome: Outcome;
  if (!envelope) outcome = { decision: "rejected", reason: "NoRecord" };
  else {
    const opened = openRecord(envelope, receiver.seal, terms);
    outcome = opened.ok ? { decision: "accepted" }
      : { decision: "rejected", reason: opened.reason === "NOT_A_RECIPIENT" ? "NotARecipient" : "DoesNotOpen" };
    evidence("open record", opened.ok ? `opened with the landed terms: originator ${opened.record.originator.customer.name.secondaryIdentifier} ${opened.record.originator.customer.name.primaryIdentifier} (fictional)` : `did not open with the landed terms: ${opened.reason}`);
  }

  const record = await pub.readContract({ address: ledger, abi: ledgerAbi, functionName: "records", args: [asBytes32(terms.transferId)] });
  const decision = outcome.decision === "accepted" ? Decision.Accepted : Decision.Rejected;
  const reason = outcome.decision === "accepted" ? RejectReason.None : RejectReason[outcome.reason];
  if (outcome.decision === "rejected" && outcome.reason === "NoRecord") return { outcome, answerTx: "0x" };
  const payload = answerPayload(ledger, { transferId: asBytes32(terms.transferId), envelopeHash: record[5], decision, reason });
  const answerTx = await ledgerTx(receiver, outcome.decision === "accepted" ? "accept record" : "reject record", "answer", [asBytes32(terms.transferId), decision, reason, pqSignPayload(receiver.account, payload)]);
  return { outcome, answerTx };
}
