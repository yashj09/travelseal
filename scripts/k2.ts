import type { Hex } from "viem";
import { saveTransfer } from "./lib/deployment.js";
import { flows } from "./lib/flows.js";
import { loadAll } from "./lib/secrets.js";

/** K2: post one sealed record whose ML-DSA-87 signature the ledger checks with pqcVerify. */
const ids = await loadAll();
const sender = ids["vasp-mumbai"]!, receiver = ids["vasp-singapore"]!;
const p = await flows.postRecord({ sender, receiver, auditor: ids["auditor-q4"]!, amount: process.argv[2] ?? "5000000" });
saveTransfer({ transferId: `0x${p.transferId}` as Hex, envelope: flows.envelopeText(p.envelope), period: p.period, originator: sender.account.cosmos, beneficiary: receiver.account.cosmos, amount: p.record.transfer.amount, denom: p.record.transfer.denom, postTx: p.postTx });
console.log(`\nK2 passed. transferId 0x${p.transferId}`);
