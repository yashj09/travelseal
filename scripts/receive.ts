import { flows } from "./lib/flows.js";
import { loadAll } from "./lib/secrets.js";

/** Beneficiary side only: pnpm ts receive.ts <deposit tx hash> */
const depositTx = process.argv[2];
if (!depositTx) throw new Error("usage: pnpm ts receive.ts <deposit tx hash>");
const { outcome, answerTx } = await flows.receiveAndAnswer((await loadAll())["vasp-singapore"]!, depositTx);
console.log(`\nresult: ${outcome.decision}  answer ${answerTx ?? "-"}`);
