import { ledgerAbi, newTransferId, periodOf, postPayload, pqSignPayload, publicClient } from "@travelseal/core";
import { BaseError, ContractFunctionRevertedError, keccak256, toHex, type Hex } from "viem";
import { evidence } from "./lib/evidence.js";
import { loadDeployment } from "./lib/deployment.js";
import { loadAll } from "./lib/secrets.js";

/** Read-only eth_calls against the live ledger: they show the real precompiles reject what the mocks reject. */
const { ledger } = loadDeployment();
const ids = await loadAll();
const sender = ids["vasp-mumbai"]!, receiver = ids["vasp-singapore"]!, q3 = ids["auditor-q3"]!;
const pub = publicClient();
const envelope = toHex(new TextEncoder().encode("QSEL test envelope"));
const args = { transferId: `0x${newTransferId()}` as Hex, originator: sender.account.evm as Hex, beneficiary: receiver.account.evm as Hex, period: periodOf(new Date()), envelopeHash: keccak256(envelope) };
const goodSig = pqSignPayload(sender.account, postPayload(ledger, args));

async function expectRevert(name: string, sig: Hex, env: Hex, originator = args.originator, expected = "BadSignature") {
  try {
    await pub.simulateContract({ address: ledger, abi: ledgerAbi, functionName: "postRecord", args: [args.transferId, originator, args.beneficiary, args.period, env, sig], account: sender.account.evm as Hex });
  } catch (e) {
    const revert = e instanceof BaseError ? e.walk((x) => x instanceof ContractFunctionRevertedError) : undefined;
    const got = revert instanceof ContractFunctionRevertedError ? revert.data?.errorName : String(e);
    if (got === expected) return evidence("live negative check", `${name}: reverted ${expected}`);
    throw new Error(`${name}: expected ${expected}, got ${got}`);
  }
  throw new Error(`${name}: expected a revert, call succeeded`);
}

await pub.simulateContract({ address: ledger, abi: ledgerAbi, functionName: "postRecord", args: [args.transferId, args.originator, args.beneficiary, args.period, envelope, goodSig], account: sender.account.evm as Hex });
evidence("live positive check", "valid ML-DSA-87 signature simulates successfully");
await expectRevert("forged signature (all zero bytes)", toHex(new Uint8Array(4627)), envelope);
await expectRevert("valid signature, envelope changed by one byte", goodSig, toHex(new TextEncoder().encode("QSEL test envelopf")));
await expectRevert("valid signature claimed for another originator", goodSig, envelope, q3.account.evm as Hex);
const unknown = "0x000000000000000000000000000000000000dEaD" as Hex;
await expectRevert("originator with no registered PQC key", goodSig, envelope, unknown, "KeyNotUsable");
