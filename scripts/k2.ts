import { loadAll } from "./lib/secrets.js";
import { postRecord } from "./lib/flows.js";

/** K2: post one sealed record whose ML-DSA-87 signature the ledger checks with pqcVerify. */
const ids = await loadAll();
const t = await postRecord(ids["vasp-mumbai"]!, ids["vasp-singapore"]!, ids["auditor-q4"]!, process.argv[2] ?? "5000000");
console.log(`\nK2 passed. transferId ${t.transferId}`);
