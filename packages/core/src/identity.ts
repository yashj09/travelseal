import { deriveUnifiedAccount, generateMnemonic, type UnifiedAccount } from "@qorechain/sdk";
import { deriveSealKeys, type SealKeyPair } from "@qorechain/qoreseal";
import { classicalKeyFromPrivate, type ClassicalKey } from "@qorechain/qoresign";
import { hexToBytes } from "@noble/hashes/utils.js";

export const ROLES = ["vasp-mumbai", "vasp-singapore", "auditor-q3", "auditor-q4"] as const;
export type Role = (typeof ROLES)[number];

/** Everything one party holds: its unified QoreChain account and its QoreSeal keys, all from one mnemonic. */
export interface Identity {
  role: Role;
  account: UnifiedAccount;
  seal: SealKeyPair;
  classical: ClassicalKey;
}

export const newMnemonic = () => generateMnemonic(256);

export async function identityFromMnemonic(role: Role, mnemonic: string): Promise<Identity> {
  const account = await deriveUnifiedAccount(mnemonic);
  const seal = deriveSealKeys({ mnemonic });
  // The unified account is eth_secp256k1 on m/44'/60'; QoreSeal's own default (coin 118) would sign for a different qor1 address.
  const classical = classicalKeyFromPrivate(hexToBytes(account.privateKey.replace(/^0x/, "")), "eth_secp256k1");
  return { role, account, seal, classical };
}
