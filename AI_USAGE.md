# AI usage

TravelSeal is built by Yash with Claude Code (Anthropic) as a pair programmer. This file is updated as the project grows.

## Workflow

- **Research and design (human-led, AI-assisted).** Claude read the fest rules, QoreChain docs and kit sources and summarised them; the problem choice (travel-rule records and RSA-OAEP harvest risk), the binding design and the scope cuts were decided by Yash after reviewing those summaries.
- **Implementation (AI-written, human-reviewed).** Claude writes code against the real kit type declarations; every module is typechecked and covered by tests before commit, and every on-chain step writes its transaction hash to `docs/EVIDENCE.md`.
- **Verification.** Offline tests (`pnpm test`) plus live runs on qorechain-diana; nothing is marked done without a transaction on chain.

## What the AI wrote, and how it was checked

- `packages/core`, `contracts/`, `scripts/` and `app/` were written by Claude against the kits' published type declarations, then typechecked and tested (20 TypeScript tests, 19 Foundry tests).
- Every on-chain claim was run live on qorechain-diana and logged with its hash in `docs/EVIDENCE.md`; failures found that way (the RPC's 10,000-block log limit, the node ignoring AND in tx search) were fixed in code.
- The app was verified by driving it with Playwright (`app/e2e/`): a full send and receive through the UI on chain, the Auditor and Q-Day screens, and the production build in replay mode.
- The UI uses shadcn/ui components composed per the shadcn skill rules.

## Human contribution

Product direction, threat model decisions, reviewing diffs, running the live steps (faucet, wallet), the demo video and its voiceover.
