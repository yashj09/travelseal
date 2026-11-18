import { Chain, msg, type Role } from "@travelseal/core";
import { evidence } from "./lib/evidence.js";
import { loadAll } from "./lib/secrets.js";

/** pnpm ts topup.ts vasp-singapore 5   Move test QOR from vasp-mumbai to another demo account. */
const [role, qor] = [process.argv[2] as Role, Number(process.argv[3] ?? "5")];
const ids = await loadAll();
const from = ids["vasp-mumbai"]!, to = ids[role];
if (!to) throw new Error(`unknown or shredded role ${role}`);
const tx = await new Chain().send(from.account, [msg.bank.send({ fromAddress: from.account.cosmos, toAddress: to.account.cosmos, amount: [{ denom: "uqor", amount: String(Math.round(qor * 1e6)) }] })], { gas: 250_000, memo: `travelseal: top up ${role}` });
evidence(`top up ${role}`, `${qor} QOR from vasp-mumbai`, tx.hash);
