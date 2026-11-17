import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sha3_256 } from "@noble/hashes/sha3.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { Chain, demoRecord, newTransferId, openRecord, resolveRecipient, sealRecord, termsOf, type RecipientCard, type Role } from "@travelseal/core";
import { evidence } from "./lib/evidence.js";
import { ROOT, loadAll } from "./lib/secrets.js";

const chain = new Chain();
const ids = await loadAll();
const card = (r: Role): RecipientCard => JSON.parse(readFileSync(join(ROOT, "deployments", "cards", `${r}.json`), "utf8"));
const [sender, receiver, q3, q4] = (["vasp-mumbai", "vasp-singapore", "auditor-q3", "auditor-q4"] as const).map((r) => ids[r]!);

// Recipients are resolved from the chain only: registered ML-DSA-87 key with proof of possession, registered ML-KEM key, verified card.
const recipients = await Promise.all([receiver!, q4!].map((id) => resolveRecipient(chain, id.account.cosmos, card(id.role))));
const record = demoRecord({ transferId: newTransferId(), originatorAddress: sender!.account.cosmos, beneficiaryAddress: receiver!.account.cosmos });
const envelope = sealRecord(record, recipients);
evidence("K1 seal", `record sealed to vasp-singapore + auditor-q4 from on-chain keys; ${envelope.length} bytes; sha3 ${bytesToHex(sha3_256(envelope)).slice(0, 16)}…`);

const terms = termsOf(record);
const checks: [string, boolean][] = [
  ["vasp-singapore opens it", openRecord(envelope, receiver!.seal, terms).ok],
  ["auditor-q4 opens it", openRecord(envelope, q4!.seal, terms).ok],
  ["auditor-q3 cannot", !openRecord(envelope, q3!.seal, terms).ok],
  ["4 fUSD instead of 5 fails", !openRecord(envelope, receiver!.seal, { ...terms, amount: "4000000" }).ok],
  ["another beneficiary fails", !openRecord(envelope, receiver!.seal, { ...terms, beneficiary: q3!.account.cosmos }).ok],
];
for (const [name, pass] of checks) {
  if (!pass) { console.error(`K1 FAILED: ${name}`); process.exit(1); }
  evidence("K1 check", name);
}
console.log("\nK1 passed.");
