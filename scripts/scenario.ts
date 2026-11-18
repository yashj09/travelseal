import { loadAll } from "./lib/secrets.js";
import { postRecord, receiveAndAnswer, sendTransfer } from "./lib/flows.js";
import { saveTransfer } from "./lib/deployment.js";
import type { TransferId } from "@travelseal/core";

/**
 * pnpm ts scenario.ts accept   record says 0.25 fUSD, 0.25 fUSD lands  -> accepted on chain
 * pnpm ts scenario.ts tamper   record says 0.25 fUSD, 0.20 fUSD lands  -> record does not open -> rejected on chain
 * Add "q3" to file the record under Q3 2026 for auditor-q3 instead of the current quarter's auditor-q4.
 */
const mode = process.argv[2] === "tamper" ? "tamper" : "accept";
const quarter = process.argv[3] === "q3" ? "q3" : "q4";
const ids = await loadAll();
const sender = ids["vasp-mumbai"]!, receiver = ids["vasp-singapore"]!, auditor = ids[quarter === "q3" ? "auditor-q3" : "auditor-q4"]!;
const recordAmount = "250000";
const sentAmount = mode === "tamper" ? "200000" : recordAmount;

console.log(`\n== scenario: ${mode}, filed under ${quarter} ==`);
const t = await postRecord(sender, receiver, auditor, recordAmount, quarter === "q3" ? 20263 : 20264);
t.transferTx = await sendTransfer(sender, receiver.account.cosmos, t.transferId.slice(2) as TransferId, sentAmount);
const { outcome, answerTx } = await receiveAndAnswer(receiver, t.transferTx);
t.answerTx = answerTx;
saveTransfer(t);
console.log(`\nresult: ${JSON.stringify(outcome)}  transfer ${t.transferId}`);
const expected = mode === "accept" ? "accepted" : "rejected";
if (outcome.decision !== expected) { console.error(`expected ${expected}`); process.exit(1); }
