import { evmToQor, findTransfer, openRecord } from "@travelseal/core";
import { chain, scanPosted } from "./lib/flows.js";
import { evidence } from "./lib/evidence.js";
import { loadIdentity } from "./lib/secrets.js";

/**
 * pnpm ts audit.ts q4   The quarter's auditor opens every record filed under that quarter, each checked against the
 * transfer that actually landed. A record with no matching transfer stays closed: it is bound to a transfer that never happened.
 */
const quarter = process.argv[2] === "q3" ? "q3" : "q4";
const period = quarter === "q3" ? 20263 : 20264;
let auditor;
try {
  auditor = await loadIdentity(`auditor-${quarter}`);
} catch {
  evidence(`audit ${quarter}`, `auditor-${quarter}'s key was destroyed; every ${quarter.toUpperCase()} envelope is now permanently unreadable`);
  process.exit(0);
}
const events = (await scanPosted()).filter((e) => e.period === period);
let opened = 0, noTransfer = 0, flagged = 0;
for (const e of events) {
  const found = await findTransfer(chain, evmToQor(e.beneficiary), e.transferId);
  if (!found?.ok) { noTransfer++; continue; }
  const r = openRecord(e.envelope, auditor.seal, found.terms);
  if (!r.ok) { flagged++; console.log(`  ⚑ ${e.transferId.slice(0, 8)}… flagged: the record does not match the transfer that landed (${r.reason})`); continue; }
  opened++;
  const o = r.record.originator.customer.name, b = r.record.beneficiary.customer.name;
  console.log(`  ✔ ${e.transferId.slice(0, 8)}… ${Number(r.record.transfer.amount) / 1e6} fUSD  ${o.secondaryIdentifier} ${o.primaryIdentifier} -> ${b.secondaryIdentifier} ${b.primaryIdentifier} (fictional)`);
}
evidence(`audit ${quarter}`, `auditor-${quarter} opened ${opened} of ${events.length} ${quarter.toUpperCase()} records against their landed transfers; ${flagged} flagged as not matching their transfer; ${noTransfer} had no transfer`);
