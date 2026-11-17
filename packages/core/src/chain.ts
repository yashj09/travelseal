import { EthNativeSigner, type EthBroadcaster, type UnifiedAccount } from "@qorechain/sdk";
import type { EncodeObject } from "@cosmjs/proto-signing";
import { CHAIN_ID, DEFAULT_REST, GAS_PRICE_UQOR } from "./config.js";

export interface TxResult {
  hash: string;
  height: number;
  gasUsed: number;
}

export class TxFailed extends Error {
  constructor(readonly hash: string, readonly code: number, readonly rawLog: string) {
    super(`tx ${hash} failed with code ${code}: ${rawLog}`);
  }
}

export interface PqcAccountView {
  found: boolean;
  publicKey?: Uint8Array;
  algorithmId?: number;
  possessionProven: boolean;
}

export interface KemKeyView {
  found: boolean;
  publicKey?: Uint8Array;
  registeredHeight?: number;
}

const b64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const toB64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** REST-only access to qorechain-diana. Works in Node and, behind a same-origin proxy, in the browser (public REST sends no CORS headers). */
export class Chain {
  constructor(readonly rest: string = DEFAULT_REST, private readonly fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis)) {}

  async get<T>(path: string): Promise<T | undefined> {
    const res = await this.fetchImpl(this.rest + path, { headers: { accept: "application/json", "user-agent": "travelseal/0.1" } });
    if (res.status === 404) return undefined;
    if (!res.ok) throw new Error(`GET ${path}: HTTP ${res.status} ${await res.text()}`);
    return (await res.json()) as T;
  }

  async accountSequence(address: string): Promise<{ accountNumber: bigint; sequence: bigint } | undefined> {
    const r = await this.get<{ account: Record<string, any> }>(`/cosmos/auth/v1beta1/accounts/${address}`);
    if (!r) return undefined;
    const a = r.account.base_account ?? r.account;
    return { accountNumber: BigInt(a.account_number ?? 0), sequence: BigInt(a.sequence ?? 0) };
  }

  async balances(address: string): Promise<Record<string, bigint>> {
    const r = await this.get<{ balances: { denom: string; amount: string }[] }>(`/cosmos/bank/v1beta1/balances/${address}?pagination.limit=50`);
    return Object.fromEntries((r?.balances ?? []).map((b) => [b.denom, BigInt(b.amount)]));
  }

  async pqcAccount(address: string): Promise<PqcAccountView> {
    const r = await this.get<{ found?: boolean; account?: { public_key?: string; algorithm_id?: number | string; possession_proven?: boolean } }>(
      `/qorechain/pqc/v1/account/${address}`,
    );
    if (!r?.account?.public_key) return { found: false, possessionProven: false };
    return {
      found: true,
      publicKey: b64(r.account.public_key),
      algorithmId: Number(r.account.algorithm_id),
      possessionProven: r.account.possession_proven === true,
    };
  }

  async kemKey(address: string): Promise<KemKeyView> {
    const r = await this.get<{ found?: boolean; key?: { public_key?: string; registered_height?: string } | null }>(`/qorechain/pqc/v1/kem/${address}`);
    if (!r?.found || !r.key?.public_key) return { found: false };
    return { found: true, publicKey: b64(r.key.public_key), registeredHeight: Number(r.key.registered_height ?? 0) };
  }

  async getTx(hash: string): Promise<Record<string, any> | undefined> {
    return this.get(`/cosmos/tx/v1beta1/txs/${hash}`);
  }

  async waitForTx(hash: string, timeoutMs = 60_000): Promise<Record<string, any>> {
    const until = Date.now() + timeoutMs;
    while (Date.now() < until) {
      const tx = await this.getTx(hash).catch(() => undefined);
      if (tx?.tx_response) return tx;
      await sleep(1500);
    }
    throw new Error(`tx ${hash} not found after ${timeoutMs} ms`);
  }

  broadcaster(): EthBroadcaster {
    return {
      broadcastTx: async (txBytes: Uint8Array) => {
        const res = await this.fetchImpl(this.rest + "/cosmos/tx/v1beta1/txs", {
          method: "POST",
          headers: { "content-type": "application/json", "user-agent": "travelseal/0.1" },
          body: JSON.stringify({ tx_bytes: toB64(txBytes), mode: "BROADCAST_MODE_SYNC" }),
        });
        const body = (await res.json()) as { tx_response?: { code: number; txhash: string; raw_log?: string } };
        const sync = body.tx_response;
        if (!sync) throw new Error(`broadcast failed: ${JSON.stringify(body)}`);
        if (sync.code !== 0) return { code: sync.code, transactionHash: sync.txhash, rawLog: sync.raw_log ?? "" };
        const included = await this.waitForTx(sync.txhash);
        const tr = included.tx_response;
        return { code: tr.code, transactionHash: tr.txhash, height: Number(tr.height), gasUsed: BigInt(tr.gas_used ?? 0), rawLog: tr.raw_log ?? "" };
      },
    };
  }

  /** Sign with the account's keys (hybrid secp256k1 + ML-DSA-87 unless `classical`) and wait for inclusion. Throws TxFailed on a non-zero code. */
  async send(
    account: UnifiedAccount,
    messages: EncodeObject[],
    opts: { gas: number; memo?: string; mode?: "hybrid" | "classical" } ,
  ): Promise<TxResult> {
    const seq = await this.accountSequence(account.cosmos);
    if (!seq) throw new Error(`account ${account.cosmos} does not exist on chain yet (fund it first)`);
    const signer = new EthNativeSigner(account, { signMode: opts.mode ?? "hybrid", rest: this.rest, fetch: this.fetchImpl });
    const fee = { amount: [{ denom: "uqor", amount: String(Math.ceil(opts.gas * GAS_PRICE_UQOR)) }], gas: String(opts.gas) };
    let out: Awaited<ReturnType<EthNativeSigner["signAndBroadcast"]>>;
    try {
      out = await signer.signAndBroadcast(this.broadcaster(), {
        chainId: CHAIN_ID,
        accountNumber: seq.accountNumber,
        sequence: seq.sequence,
        messages,
        fee,
        memo: opts.memo ?? "",
      });
    } catch (e: any) {
      if (e?.transactionHash) throw new TxFailed(e.transactionHash, e.code ?? -1, e.rawLog ?? String(e.message));
      throw e;
    }
    if (out.code !== 0) throw new TxFailed(out.transactionHash, out.code, out.rawLog ?? "");
    return { hash: out.transactionHash, height: out.height ?? 0, gasUsed: Number(out.gasUsed ?? 0) };
  }
}
