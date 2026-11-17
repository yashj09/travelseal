import { appendFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { explorerTx } from "@travelseal/core";
import { ROOT } from "./secrets.js";

const FILE = join(ROOT, "docs", "EVIDENCE.md");

/** Append one line of on-chain evidence. Every claim in the README links back to a row here. */
export function evidence(step: string, detail: string, hash?: string) {
  if (!existsSync(FILE)) writeFileSync(FILE, "# On-chain evidence (qorechain-diana)\n\nAppended by the scripts as each step runs. Times are UTC.\n\n| Time | Step | Detail | Tx |\n|---|---|---|---|\n");
  const tx = hash ? `[\`${hash.slice(0, 10)}…\`](${explorerTx(hash)})` : "";
  appendFileSync(FILE, `| ${new Date().toISOString().slice(0, 19)} | ${step} | ${detail} | ${tx} |\n`);
  console.log(`  ✔ ${step}: ${detail}${hash ? `  ${hash}` : ""}`);
}
