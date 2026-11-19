import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Chain, createFlows, type RecipientCard } from "@travelseal/core";
import { evidence } from "./evidence.js";
import { loadDeployment } from "./deployment.js";
import { ROOT } from "./secrets.js";

export const chain = new Chain();

const cardsDir = join(ROOT, "deployments", "cards");
const cards = new Map<string, RecipientCard>(
  readdirSync(cardsDir).map((f) => JSON.parse(readFileSync(join(cardsDir, f), "utf8")) as RecipientCard).map((c) => [c.address, c]),
);

/** The shared flows from @travelseal/core, wired to the CLI: cards from deployments/cards, steps to docs/EVIDENCE.md. */
export const flows = createFlows({
  chain,
  deployment: loadDeployment(),
  cardFor: (address) => cards.get(address),
  log: (s) => evidence(s.label, s.detail, s.hash),
});
