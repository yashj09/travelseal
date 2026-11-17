import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Chain, ROLES, makeCard, msg, registerKemKey, registerPqcKey, type Identity, type StepOutcome } from "@travelseal/core";
import { evidence } from "./lib/evidence.js";
import { ROOT, loadAll } from "./lib/secrets.js";

const FUNDING_UQOR = 2_000_000n; // 2 QOR covers both registrations and a few txs per account.
const chain = new Chain();
const ids = await loadAll();
const funder = ids["vasp-mumbai"]!;

const report = (role: string, what: string, out: StepOutcome) =>
  out.kind === "done" ? evidence(`${role}: ${what}`, `gas ${out.tx.gasUsed}`, out.tx.hash) : console.log(`  · ${role}: ${what} already on chain`);

const funderBal = await chain.balances(funder.account.cosmos);
if (!funderBal.uqor) {
  console.error(`vasp-mumbai (${funder.account.cosmos}) has no QOR. Claim the faucet for it first: https://dashboard.qorechain.io/faucet`);
  process.exit(1);
}

// A new account's first transaction must be its key registration, so the funder registers before it sends anything.
report("vasp-mumbai", "ML-DSA-87 key + proof of possession", await registerPqcKey(chain, funder));

for (const r of ROLES.filter((r) => r !== "vasp-mumbai")) {
  const id = ids[r];
  if (!id) continue;
  const bal = await chain.balances(id.account.cosmos);
  if ((bal.uqor ?? 0n) < FUNDING_UQOR / 2n) {
    const tx = await chain.send(funder.account, [msg.bank.send({ fromAddress: funder.account.cosmos, toAddress: id.account.cosmos, amount: [{ denom: "uqor", amount: String(FUNDING_UQOR) }] })], { gas: 250_000, memo: `travelseal setup: fund ${r}` });
    evidence(`fund ${r}`, `2 QOR from vasp-mumbai (hybrid-signed)`, tx.hash);
  }
}

const cardsDir = join(ROOT, "deployments", "cards");
mkdirSync(cardsDir, { recursive: true });
for (const r of ROLES) {
  const id: Identity | undefined = ids[r];
  if (!id) continue;
  report(r, "ML-DSA-87 key + proof of possession", await registerPqcKey(chain, id));
  report(r, "ML-KEM-1024 key in the QoreSeal registry", await registerKemKey(chain, id));
  writeFileSync(join(cardsDir, `${r}.json`), JSON.stringify(makeCard(id), null, 2) + "\n");
}
console.log(`\nRecipient cards written to deployments/cards/. Run: pnpm ts status.ts`);
