import { ROLES } from "@travelseal/core";
import { ensureMnemonics, loadAll } from "./lib/secrets.js";

ensureMnemonics();
const ids = await loadAll();
console.log("Accounts (mnemonics in .secrets/mnemonics.json, git-ignored):\n");
for (const r of ROLES) console.log(`  ${r.padEnd(15)} ${ids[r]!.account.cosmos}   ${ids[r]!.account.evm}`);
console.log(`\nNext: claim the faucet once for vasp-mumbai at https://dashboard.qorechain.io/faucet (paste ${ids["vasp-mumbai"]!.account.cosmos}), then run: pnpm ts register.ts`);
