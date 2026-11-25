import type { Hex } from "viem";
import { saveTransfer } from "./lib/deployment.js";
import { flows } from "./lib/flows.js";
import { loadAll } from "./lib/secrets.js";

/**
 * pnpm ts scenario.ts accept   record says 0.25 fUSD, 0.25 fUSD lands  -> accepted on chain
 * pnpm ts scenario.ts tamper   record says 0.25 fUSD, 0.20 fUSD lands  -> record does not open -> rejected on chain
 * pnpm ts scenario.ts grief    after an honest post, a third party sends dust with the copied memo first
 *                               -> left unanswered; the real deposit is then accepted
 * Add "q3" to file the record under Q3 2026 for auditor-q3 instead of the current quarter's auditor-q4.
 */
const mode = (["tamper", "grief"] as const).find((m) => m === process.argv[2]) ?? "accept";
const quarter = process.argv[3] === "q3" ? "q3" : "q4";
const ids = await loadAll();
const sender = ids["vasp-mumbai"]!, receiver = ids["vasp-singapore"]!, auditor = ids[quarter === "q3" ? "auditor-q3" : "auditor-q4"]!;
const recordAmount = "250000";
const sentAmount = mode === "tamper" ? "200000" : recordAmount;

console.log(`\n== scenario: ${mode}, filed under ${quarter} ==`);
const p = await flows.postRecord({ sender, receiver, auditor, amount: recordAmount, period: quarter === "q3" ? 20263 : 20264 });
if (mode === "grief") {
  // The transfer id is public once the record is posted. A third party copies it onto a transfer of their own.
  const griefer = ids["auditor-q4"]!;
  const dust = await flows.sendTransfer(griefer, receiver.account.cosmos, p.transferId, "1", "uqor");
  const g = await flows.receiveAndAnswer(receiver, dust);
  console.log(`third-party deposit with the copied memo: ${g.outcome.decision}`);
  if (g.outcome.decision !== "noRecord" || g.answerTx) process.exit(1);
}
const transferTx = await flows.sendTransfer(sender, receiver.account.cosmos, p.transferId, sentAmount);
const { outcome, answerTx } = await flows.receiveAndAnswer(receiver, transferTx);
saveTransfer({ transferId: `0x${p.transferId}` as Hex, envelope: flows.envelopeText(p.envelope), period: p.period, originator: sender.account.cosmos, beneficiary: receiver.account.cosmos, amount: recordAmount, denom: p.record.transfer.denom, postTx: p.postTx, transferTx, ...(answerTx ? { answerTx } : {}) });
console.log(`\nresult: ${outcome.decision}${"reason" in outcome ? ` (${outcome.reason})` : ""}  transfer 0x${p.transferId}`);
if (outcome.decision !== (mode === "tamper" ? "rejected" : "accepted")) process.exit(1);
