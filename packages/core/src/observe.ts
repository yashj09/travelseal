import { transferIdFromMemo, type TransferId, type TransferTerms } from "./binding.js";
import type { Chain } from "./chain.js";

/** Why a landed transaction can't be matched to a travel-rule record at all. */
export type ObserveError =
  | "TX_FAILED"
  | "NOT_A_SINGLE_SEND"
  | "NOT_TO_THIS_RECEIVER"
  | "MULTI_DENOM"
  | "NO_TRAVELSEAL_MEMO";

export type Observed = { ok: true; terms: TransferTerms; hash: string; height: number } | { ok: false; error: ObserveError; hash: string };

interface TxJson {
  tx?: { body?: { memo?: string; messages?: Array<Record<string, any>> } };
  tx_response?: { txhash: string; code: number; height: string };
}

/**
 * Read the terms a deposit actually has from the REST tx JSON: one MsgSend to us, one coin, and the transfer id in
 * the memo. The receiver opens the record with these, never with what the sender claims.
 */
export function observeTransfer(tx: TxJson, receiver: string): Observed {
  const hash = tx.tx_response?.txhash ?? "";
  if (!tx.tx_response || tx.tx_response.code !== 0) return { ok: false, error: "TX_FAILED", hash };
  const msgs = tx.tx?.body?.messages ?? [];
  const send = msgs[0];
  if (msgs.length !== 1 || send?.["@type"] !== "/cosmos.bank.v1beta1.MsgSend") return { ok: false, error: "NOT_A_SINGLE_SEND", hash };
  if (send.to_address !== receiver) return { ok: false, error: "NOT_TO_THIS_RECEIVER", hash };
  const coins = send.amount as { denom: string; amount: string }[];
  if (coins.length !== 1) return { ok: false, error: "MULTI_DENOM", hash };
  const transferId = transferIdFromMemo(tx.tx?.body?.memo ?? "");
  if (!transferId) return { ok: false, error: "NO_TRAVELSEAL_MEMO", hash };
  return {
    ok: true,
    hash,
    height: Number(tx.tx_response.height),
    terms: { transferId, originator: send.from_address, beneficiary: send.to_address, amount: coins[0]!.amount, denom: coins[0]!.denom },
  };
}

/** Find the deposit that carries `transferId` to `receiver` (used by auditors, who never saw the deposit arrive). */
export async function findTransfer(chain: Chain, receiver: string, transferId: TransferId): Promise<Observed | undefined> {
  for (const tx of await chain.searchTxs(`transfer.recipient='${receiver}'`)) {
    const o = observeTransfer(tx as TxJson, receiver);
    if (o.ok && o.terms.transferId === transferId) return o;
  }
  return undefined;
}
