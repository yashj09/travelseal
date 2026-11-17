import { Chain, closeWindow, ledgerAbi, ledgerBytecode, openWindow, publicClient, walletClient, windowBudgetUqor } from "@travelseal/core";
import type { Hex } from "viem";
import { evidence } from "./lib/evidence.js";
import { saveDeployment } from "./lib/deployment.js";
import { loadIdentity } from "./lib/secrets.js";

const chain = new Chain();
const deployer = await loadIdentity("vasp-mumbai");
const pub = publicClient();
const wallet = walletClient(deployer.account);

const gas = (await pub.estimateGas({ account: wallet.account, data: ledgerBytecode })) * 13n / 10n;
const fees = await pub.estimateFeesPerGas();
// A scoped window refuses contract creation, so the deploy uses a short unscoped window that admits exactly one tx.
const open = await openWindow(chain, deployer.account, { txs: 1, blocks: 120, maxValueUqor: windowBudgetUqor(gas, fees.maxFeePerGas, 1) + 1n });
evidence("deploy: open EVM window", "hybrid-signed, 1 tx, 120 blocks, value cap = this deploy's max fee", open.hash);

try {
  // Opening the window advanced the account sequence, which is also the EVM nonce: read it now, not before.
  const nonce = await pub.getTransactionCount({ address: wallet.account.address, blockTag: "pending" });
  const hash = await wallet.deployContract({ abi: ledgerAbi, bytecode: ledgerBytecode, gas, maxFeePerGas: fees.maxFeePerGas, maxPriorityFeePerGas: fees.maxPriorityFeePerGas, nonce });
  const receipt = await pub.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success" || !receipt.contractAddress) throw new Error(`deploy failed: ${hash}`);
  saveDeployment({ ledger: receipt.contractAddress, deployTx: hash as Hex, deployer: wallet.account.address, block: Number(receipt.blockNumber) });
  evidence("deploy TravelRuleLedger", `at ${receipt.contractAddress}, gas ${receipt.gasUsed}`, hash);
} finally {
  const closed = await closeWindow(chain, deployer.account);
  if (closed) evidence("deploy: close EVM window", "hybrid-signed", closed.hash);
}
