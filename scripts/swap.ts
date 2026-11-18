import { Chain, FUSD_DENOM, msg } from "@travelseal/core";
import { evidence } from "./lib/evidence.js";
import { loadIdentity } from "./lib/secrets.js";

/** Buy demo fUSD with QOR on the native AMM (pool 2, fUSD/QOR, constant product). Usage: pnpm ts swap.ts <QOR in> */
const chain = new Chain();
const id = await loadIdentity("vasp-mumbai");
const qorIn = BigInt(Math.round(Number(process.argv[2] ?? "10") * 1e6));
const pool = (await chain.get<{ pool: { token_a: string; reserve_a: string; reserve_b: string } }>("/qorechain/amm/v1/pools/2"))!.pool;
if (pool.token_a !== FUSD_DENOM) throw new Error(`pool 2 is not fUSD/QOR: ${pool.token_a}`);
const rA = BigInt(pool.reserve_a), rB = BigInt(pool.reserve_b);
const quoted = (qorIn * rA) / (rB + qorIn);
const minOut = (quoted * 95n) / 100n;
const tx = await chain.send(id.account, [msg.amm.swapExactIn({ sender: id.account.cosmos, poolId: "2", tokenIn: { denom: "uqor", amount: String(qorIn) }, denomOut: FUSD_DENOM, minOut: String(minOut) })], { gas: 500_000 });
const after = await chain.balances(id.account.cosmos);
evidence("swap on the native AMM", `${Number(qorIn) / 1e6} QOR for fUSD in pool 2 (min ${Number(minOut) / 1e6}); vasp-mumbai now holds ${Number(after[FUSD_DENOM] ?? 0n) / 1e6} fUSD`, tx.hash);
