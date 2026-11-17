export const CHAIN_ID = "qorechain-diana";
export const EVM_CHAIN_ID = 9800;
export const DEFAULT_REST = "https://api-testnet.qore.host";
export const EXPLORER = "https://explore.qore.network";
export const FUSD_DENOM = "erc20:0x97143B771D34ddb9130b807b135Ae675A5a963CA";
export const QOR_DENOM = "uqor";
export const SEAL_PURPOSE = "travelseal:travel-rule:v1";
export const GAS_PRICE_UQOR = 0.15;

export const explorerTx = (hash: string) => `${EXPLORER}/tx/${hash}`;
