import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  Chain, closeWindow, demoRecord, envelopeToText, ledgerAbi, newTransferId, openWindow, periodOf, postPayload, pqSignPayload,
  publicClient, resolveRecipient, sealRecord, walletClient, windowBudgetUqor, type RecipientCard, type Role,
} from "@travelseal/core";
import { keccak256, toHex, type Hex } from "viem";
import { evidence } from "./lib/evidence.js";
import { loadDeployment, saveTransfer } from "./lib/deployment.js";
import { ROOT, loadAll } from "./lib/secrets.js";

const chain = new Chain();
const { ledger } = loadDeployment();
const ids = await loadAll();
const card = (r: Role): RecipientCard => JSON.parse(readFileSync(join(ROOT, "deployments", "cards", `${r}.json`), "utf8"));
const sender = ids["vasp-mumbai"]!, receiver = ids["vasp-singapore"]!, auditor = ids["auditor-q4"]!;
const amount = process.argv[2] ?? "5000000";

const recipients = await Promise.all([receiver, auditor].map((id) => resolveRecipient(chain, id.account.cosmos, card(id.role))));
const record = demoRecord({ transferId: newTransferId(), originatorAddress: sender.account.cosmos, beneficiaryAddress: receiver.account.cosmos, amount });
const envelope = sealRecord(record, recipients);
const transferId = `0x${record.transferId}` as Hex;
const args = { transferId, originator: sender.account.evm as Hex, beneficiary: receiver.account.evm as Hex, period: periodOf(new Date()), envelopeHash: keccak256(envelope) };

const pub = publicClient();
const onChainPayload = await pub.readContract({ address: ledger, abi: ledgerAbi, functionName: "postPayload", args: [args.transferId, args.originator, args.beneficiary, args.period, args.envelopeHash] });
if (onChainPayload !== postPayload(ledger, args)) throw new Error("TS and contract disagree on the post payload; refusing to sign");
const signature = pqSignPayload(sender.account, onChainPayload);

const wallet = walletClient(sender.account);
const call = { address: ledger, abi: ledgerAbi, functionName: "postRecord", args: [args.transferId, args.originator, args.beneficiary, args.period, toHex(envelope), signature] } as const;
const gas = (await pub.estimateContractGas({ ...call, account: wallet.account })) * 13n / 10n;
const fees = await pub.estimateFeesPerGas();
const open = await openWindow(chain, sender.account, { targets: [ledger], txs: 1, maxValueUqor: windowBudgetUqor(gas, fees.maxFeePerGas, 1) + 1n });
evidence("K2: open scoped EVM window", `targets [ledger], 1 tx`, open.hash);
try {
  const nonce = await pub.getTransactionCount({ address: wallet.account.address, blockTag: "pending" });
  const hash = await wallet.writeContract({ ...call, gas, maxFeePerGas: fees.maxFeePerGas, maxPriorityFeePerGas: fees.maxPriorityFeePerGas, nonce });
  const receipt = await pub.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error(`postRecord reverted: ${hash}`);
  const stored = await pub.readContract({ address: ledger, abi: ledgerAbi, functionName: "records", args: [transferId] });
  if (stored[5] !== args.envelopeHash) throw new Error("stored envelope hash does not match");
  evidence("K2: postRecord", `ML-DSA-87 signature checked on chain by pqcVerify; envelope ${envelope.length} B; gas ${receipt.gasUsed}`, hash);
  saveTransfer({ transferId, envelope: envelopeToText(envelope), period: args.period, originator: sender.account.cosmos, beneficiary: receiver.account.cosmos, amount, denom: record.transfer.denom, postTx: hash });
  console.log(`\nK2 passed. transferId ${transferId}`);
} finally {
  const closed = await closeWindow(chain, sender.account);
  if (closed) evidence("K2: close EVM window", "hybrid-signed", closed.hash);
}
