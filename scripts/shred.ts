import { Chain, msg } from "@travelseal/core";
import { evidence } from "./lib/evidence.js";
import { loadIdentity, shred } from "./lib/secrets.js";

/**
 * pnpm ts shred.ts q3 --yes   End of retention for a quarter: withdraw the auditor's ML-KEM key from the registry so
 * nobody seals to it again, then delete its mnemonic from .secrets/. After that the auditor's copy of that quarter's
 * records can't be opened, and unlike an RSA-wrapped copy, a quantum computer doesn't change that. The receiving
 * exchange still holds its own key. A production system would destroy the key inside an HSM; this deletes a file.
 */
const quarter = process.argv[2];
if (quarter !== "q3" && quarter !== "q4") throw new Error("usage: pnpm ts shred.ts q3|q4 --yes");
if (!process.argv.includes("--yes")) { console.log(`dry run: would remove auditor-${quarter}'s ML-KEM key and destroy its mnemonic. Add --yes.`); process.exit(0); }
const chain = new Chain();
const id = await loadIdentity(`auditor-${quarter}`);
const tx = await chain.send(id.account, [msg.pqc.removeKemKey({ sender: id.account.cosmos })], { gas: 300_000 });
evidence(`shred ${quarter}`, `auditor-${quarter} ML-KEM key removed from the registry (hybrid-signed)`, tx.hash);
shred(`auditor-${quarter}`);
evidence(`shred ${quarter}`, `auditor-${quarter} mnemonic destroyed`);
