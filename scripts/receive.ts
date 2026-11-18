import { loadAll } from "./lib/secrets.js";
import { receiveAndAnswer } from "./lib/flows.js";

/** Beneficiary side only: pnpm ts receive.ts <deposit tx hash> */
const depositTx = process.argv[2];
if (!depositTx) throw new Error("usage: pnpm ts receive.ts <deposit tx hash>");
const { outcome, answerTx } = await receiveAndAnswer((await loadAll())["vasp-singapore"]!, depositTx);
console.log(`\nresult: ${JSON.stringify(outcome)}  answer ${answerTx}`);
