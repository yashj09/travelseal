import { messagePqSignBytes, pqSign } from "@qorechain/qoresign";
import { closeEvmWindowMsg, openEvmWindowMsg, type UnifiedAccount } from "@qorechain/sdk";
import {
  createPublicClient, createWalletClient, defineChain, encodeAbiParameters, hexToBytes, http, keccak256, toHex,
  type Address, type Hex, type PublicClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { Chain } from "./chain.js";
import { CHAIN_ID, EVM_CHAIN_ID } from "./config.js";
import { ledgerAbi } from "./generated/ledger.js";

export { ledgerAbi };
export { ledgerBytecode } from "./generated/ledger.js";

export const EVM_RPC = "https://evm-testnet.qore.host";

export const diana = defineChain({
  id: EVM_CHAIN_ID,
  name: "QoreChain Diana testnet",
  nativeCurrency: { name: "QOR", symbol: "QOR", decimals: 18 },
  rpcUrls: { default: { http: [EVM_RPC] } },
  blockExplorers: { default: { name: "QoreChain Explorer", url: "https://explore.qore.network" } },
});
export const POST_TAG = keccak256(toHex("travelseal.post.v1"));
export const ACK_TAG = keccak256(toHex("travelseal.ack.v1"));
export const Decision = { Accepted: 1, Rejected: 2 } as const;
export type DecisionCode = (typeof Decision)[keyof typeof Decision];

/** Why a receiver rejects a record. Stored on chain as a uint8. */
export const RejectReason = { None: 0, DoesNotOpen: 1, NoRecord: 2, NotARecipient: 3, Sanctions: 4 } as const;

export const publicClient = (rpc = EVM_RPC): PublicClient => createPublicClient({ chain: diana, transport: http(rpc) }) as PublicClient;

export function walletClient(account: UnifiedAccount, rpc = EVM_RPC) {
  return createWalletClient({ account: privateKeyToAccount(account.privateKey as Hex), chain: diana, transport: http(rpc) });
}

/** Mirrors TravelRuleLedger.postPayload. A unit test and a live eth_call compare the two. */
export function postPayload(ledger: Address, a: { transferId: Hex; originator: Address; beneficiary: Address; period: number; envelopeHash: Hex }): Hex {
  return encodeAbiParameters(
    [{ type: "bytes32" }, { type: "uint256" }, { type: "address" }, { type: "bytes32" }, { type: "address" }, { type: "address" }, { type: "uint32" }, { type: "bytes32" }],
    [POST_TAG, BigInt(EVM_CHAIN_ID), ledger, a.transferId, a.originator, a.beneficiary, a.period, a.envelopeHash],
  );
}

/** Mirrors TravelRuleLedger.answerPayload. */
export function answerPayload(ledger: Address, a: { transferId: Hex; envelopeHash: Hex; decision: DecisionCode; reason: number }): Hex {
  return encodeAbiParameters(
    [{ type: "bytes32" }, { type: "uint256" }, { type: "address" }, { type: "bytes32" }, { type: "bytes32" }, { type: "uint8" }, { type: "uint8" }],
    [ACK_TAG, BigInt(EVM_CHAIN_ID), ledger, a.transferId, a.envelopeHash, a.decision, a.reason],
  );
}

/** ML-DSA-87 over the QoreSign message-signing-v1 bytes: exactly what the contract feeds pqcVerify (and what QoreX signArbitrary would sign). */
export function pqSignPayload(account: UnifiedAccount, payload: Hex): Hex {
  return toHex(pqSign(account.pqc.secretKey, messagePqSignBytes(CHAIN_ID, hexToBytes(payload))));
}

/** Year * 10 + quarter, e.g. 20264 for Q4 2026. The auditor key for that quarter is a recipient of every record in it. */
export const periodOf = (d: Date) => d.getUTCFullYear() * 10 + Math.floor(d.getUTCMonth() / 3) + 1;

/**
 * Open an EVM authorisation window (hybrid-signed native tx). Scoped to `targets` unless it is a deploy, which a
 * scoped window refuses. The caller must re-read the EVM nonce afterwards: opening advances the account sequence.
 */
export async function openWindow(chain: Chain, account: UnifiedAccount, opts: { targets?: Address[]; txs: number; maxValueUqor: bigint; blocks?: number }) {
  return chain.send(account, [openEvmWindowMsg({
    sender: account.cosmos,
    blocks: opts.blocks ?? 300,
    maxTxs: opts.txs,
    maxValue: opts.maxValueUqor,
    ...(opts.targets ? { allowedTargets: opts.targets } : {}),
  } as Parameters<typeof openEvmWindowMsg>[0])], { gas: 300_000 });
}

export async function closeWindow(chain: Chain, account: UnifiedAccount) {
  const w = await chain.get<{ found?: boolean }>(`/qorechain/pqc/v1/evm_window/${account.cosmos}`);
  if (!w?.found) return undefined;
  return chain.send(account, [closeEvmWindowMsg(account.cosmos)], { gas: 200_000 });
}

/** The window's value cap counts value plus gas limit x fee cap, in uqor (1 uqor = 1e12 wei), rounded up. */
export const windowBudgetUqor = (gas: bigint, maxFeePerGasWei: bigint, txs: number) => ((gas * maxFeePerGasWei + 999_999_999_999n) / 1_000_000_000_000n) * BigInt(txs);
