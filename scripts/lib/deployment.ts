import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Address, Hex } from "viem";
import { ROOT } from "./secrets.js";

export interface Deployment {
  ledger: Address;
  deployTx: Hex;
  deployer: Address;
  block: number;
}

const FILE = join(ROOT, "deployments", "diana.json");

export const loadDeployment = (): Deployment => {
  if (!existsSync(FILE)) throw new Error("no ledger deployed yet: run pnpm ts deploy-ledger.ts");
  return JSON.parse(readFileSync(FILE, "utf8"));
};

export function saveDeployment(d: Deployment) {
  mkdirSync(join(ROOT, "deployments"), { recursive: true });
  writeFileSync(FILE, JSON.stringify(d, null, 2) + "\n");
}

/** Public, PII-free state of one demo transfer, so later steps (receive, audit) can pick it up. */
export interface TransferFile {
  transferId: Hex;
  envelope: string;
  period: number;
  originator: string;
  beneficiary: string;
  amount: string;
  denom: string;
  postTx?: Hex;
  transferTx?: string;
  answerTx?: Hex;
}

const dir = join(ROOT, "deployments", "transfers");
export const saveTransfer = (t: TransferFile) => {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${t.transferId}.json`), JSON.stringify(t, null, 2) + "\n");
};
export const loadTransfer = (id: string): TransferFile => JSON.parse(readFileSync(join(dir, `${id}.json`), "utf8"));
