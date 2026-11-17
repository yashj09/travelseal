import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ROLES, identityFromMnemonic, newMnemonic, type Identity, type Role } from "@travelseal/core";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SECRETS = join(ROOT, ".secrets", "mnemonics.json");

type Store = Partial<Record<Role, string>>;

const read = (): Store => (existsSync(SECRETS) ? JSON.parse(readFileSync(SECRETS, "utf8")) : {});

function write(s: Store) {
  mkdirSync(dirname(SECRETS), { recursive: true });
  writeFileSync(SECRETS, JSON.stringify(s, null, 2) + "\n");
  chmodSync(SECRETS, 0o600);
}

/** Create any missing mnemonics. Existing ones are never overwritten. */
export function ensureMnemonics(): Store {
  const s = read();
  for (const r of ROLES) s[r] ??= newMnemonic();
  write(s);
  return s;
}

export async function loadIdentity(role: Role): Promise<Identity> {
  const m = read()[role];
  if (!m) throw new Error(`no mnemonic for ${role}; run setup first (or ${role} was shredded)`);
  return identityFromMnemonic(role, m);
}

export async function loadAll(): Promise<Partial<Record<Role, Identity>>> {
  const s = read();
  const out: Partial<Record<Role, Identity>> = {};
  for (const r of ROLES) if (s[r]) out[r] = await identityFromMnemonic(r, s[r]!);
  return out;
}

/** Destroy a role's mnemonic, and with it every key derived from it. Used for an auditor quarter at end of retention. */
export function shred(role: Role) {
  const s = read();
  delete s[role];
  write(s);
}
