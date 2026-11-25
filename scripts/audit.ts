import { flows } from "./lib/flows.js";
import { evidence } from "./lib/evidence.js";
import { loadIdentity } from "./lib/secrets.js";

/**
 * pnpm ts audit.ts q4   The quarter's auditor opens every record filed under that quarter, each checked against the
 * transfer that actually landed. A record that lies about its transfer is flagged; one with no transfer stays closed.
 */
const quarter = process.argv[2] === "q3" ? "q3" : "q4";
let auditor;
try {
  auditor = await loadIdentity(`auditor-${quarter}`);
} catch {
  evidence(`audit ${quarter}`, `auditor-${quarter}'s key was destroyed; the auditor's copy of every ${quarter.toUpperCase()} record can no longer be opened (the receiving exchange keeps its own access)`);
  process.exit(0);
}
for (const e of await flows.auditQuarter(auditor, quarter === "q3" ? 20263 : 20264)) {
  const id = e.event.transferId.slice(0, 8);
  if (e.status === "opened") {
    const o = e.record.originator.customer.name, b = e.record.beneficiary.customer.name;
    console.log(`  ✔ ${id}… ${Number(e.record.transfer.amount) / 1e6} fUSD  ${o.secondaryIdentifier} ${o.primaryIdentifier} -> ${b.secondaryIdentifier} ${b.primaryIdentifier} (fictional)`);
  } else if (e.status === "flagged") console.log(`  ⚑ ${id}… flagged: the record does not match the transfer that landed (${e.reason})`);
  else console.log(`  · ${id}… no transfer landed for this record`);
}
