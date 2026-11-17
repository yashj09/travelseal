import { Chain, FUSD_DENOM, ROLES } from "@travelseal/core";
import { loadAll } from "./lib/secrets.js";

const chain = new Chain();
const ids = await loadAll();
for (const r of ROLES) {
  const id = ids[r];
  if (!id) { console.log(`${r.padEnd(15)} (shredded)`); continue; }
  const a = id.account.cosmos;
  const [bal, pqc, kem] = await Promise.all([chain.balances(a), chain.pqcAccount(a), chain.kemKey(a)]);
  const qor = Number(bal.uqor ?? 0n) / 1e6, fusd = Number(bal[FUSD_DENOM] ?? 0n) / 1e6;
  console.log(`${r.padEnd(15)} ${a}  QOR ${qor.toFixed(3).padStart(9)}  fUSD ${fusd.toFixed(2).padStart(8)}  ML-DSA ${pqc.found ? (pqc.possessionProven ? "registered+PoP" : "registered, NO PoP") : "-"}  ML-KEM ${kem.found ? "registered" : "-"}`);
}
