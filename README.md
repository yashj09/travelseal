# TravelSeal

Travel-rule data between exchanges, sealed so a copy taken today stays unreadable after Q-Day.

When an exchange sends crypto to another exchange, it must send the customer's identity data with it (the FATF travel rule) and keep it for years. TravelSeal seals each record in the browser with ML-KEM-1024 (QoreSeal hybrid mode) to the receiving exchange's key registered on QoreChain, and binds it to the transfer it describes: if the transfer that lands on chain differs in amount, asset, sender, beneficiary or transfer ID, the record does not open.

Built for **Build Before Q-Day: The QoreChain Developer Fest** (Encrypted Apps). Work in progress; all identity data is fictional.

## Status

- [x] Accounts, ML-DSA-87 registration with proof of possession, ML-KEM-1024 registration, recipient cards (`packages/core`, `scripts/register.ts`)
- [x] Records sealed to the receiver and an auditor quarter, bound to the transfer terms (`packages/core/src/seal.ts`, `binding.ts`)
- [x] On-chain ledger with ML-DSA-87 approvals checked by `pqcVerify` / `pqcKeyStatus` (`contracts/src/TravelRuleLedger.sol`), live at [`0xa9466483c8c1a55eb18cd669b9b60308baae28ca`](https://explore.qore.network/address/0xa9466483c8c1a55eb18cd669b9b60308baae28ca)
- [ ] Transfer, receive and accept or reject
- [ ] Auditor quarters and key destruction
- [ ] App

On-chain evidence for every step: [docs/EVIDENCE.md](docs/EVIDENCE.md).

## Run

```sh
pnpm install
pnpm test                 # offline tests
pnpm ts setup.ts          # creates 4 testnet accounts in .secrets/ (git-ignored)
# claim the faucet once for vasp-mumbai: https://dashboard.qorechain.io/faucet
pnpm ts register.ts       # registers keys, funds the other accounts, writes recipient cards
pnpm ts k1.ts             # seals a record from on-chain keys and checks who can open it
pnpm ts deploy-ledger.ts  # opens a one-tx EVM window, deploys the ledger, closes the window
pnpm ts k2.ts             # posts a sealed record, authorised by an ML-DSA-87 signature checked on chain
pnpm ts negative-checks.ts # forged and tampered posts revert on the live ledger
(cd contracts && forge test)  # 19 contract tests with the precompiles mocked at their real addresses
```

## Credits

Uses the QoreChain SDK, QoreSeal, QoreSign and qorechain-pqc (Apache-2.0) from [github.com/qorechain](https://github.com/qorechain). See [AI_USAGE.md](AI_USAGE.md) for how AI tools were used.

## License

MIT
