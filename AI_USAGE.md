# AI usage

TravelSeal is built by Yash with Claude Code (Anthropic) as a pair programmer. This file is updated as the project grows.

## Workflow

- **Research and design (human-led, AI-assisted).** Claude read the fest rules, QoreChain docs and kit sources and summarised them; the problem choice (travel-rule records and RSA-OAEP harvest risk), the binding design and the scope cuts were decided by Yash after reviewing those summaries.
- **Implementation (AI-written, human-reviewed).** Claude writes code against the real kit type declarations; every module is typechecked and covered by tests before commit, and every on-chain step writes its transaction hash to `docs/EVIDENCE.md`.
- **Verification.** Offline tests (`pnpm test`) plus live runs on qorechain-diana; nothing is marked done without a transaction on chain.

## Human contribution

Product direction, threat model decisions, reviewing diffs, running the live steps (faucet, wallet), the demo video and its voiceover.
