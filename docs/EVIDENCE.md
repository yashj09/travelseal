# On-chain evidence (qorechain-diana)

Appended by the scripts as each step runs. Times are UTC.

| Time | Step | Detail | Tx |
|---|---|---|---|
| 2026-11-17T20:19:54 | vasp-mumbai: ML-DSA-87 key + proof of possession | gas 297060 | [`9CA660F90C…`](https://explore.qore.network/tx/9CA660F90C1F85DAF7A092936901ED268602C1C43007B4907A24EEBCC0FBC520) |
| 2026-11-17T20:19:57 | fund vasp-singapore | 2 QOR from vasp-mumbai (hybrid-signed) | [`1DFA760879…`](https://explore.qore.network/tx/1DFA760879E318A0777D338046A85F7A64A5C678FDA4D8015DB38540303A4AE0) |
| 2026-11-17T20:20:01 | fund auditor-q3 | 2 QOR from vasp-mumbai (hybrid-signed) | [`A75D10B90A…`](https://explore.qore.network/tx/A75D10B90AED6E53D031E9CFA77C26A55A64CCFB384B2D341B998DF29A771729) |
| 2026-11-17T20:20:04 | fund auditor-q4 | 2 QOR from vasp-mumbai (hybrid-signed) | [`BE5CE214E8…`](https://explore.qore.network/tx/BE5CE214E85DC2B8476DC935F16DAA0C63E68B3FD64350943B710DDD0DAE8FE3) |
| 2026-11-17T20:20:08 | vasp-mumbai: ML-KEM-1024 key in the QoreSeal registry | gas 267617 | [`BFAB397865…`](https://explore.qore.network/tx/BFAB3978652FAC07BB72C921DE6574880DE15B914AF5F9575B1E13030C42D875) |
| 2026-11-17T20:20:11 | vasp-singapore: ML-DSA-87 key + proof of possession | gas 297027 | [`BD429E4EDD…`](https://explore.qore.network/tx/BD429E4EDDBCAB652FF853C933EF8EB329901517ECC820DCA1CB7B209C6C7B5F) |
| 2026-11-17T20:20:15 | vasp-singapore: ML-KEM-1024 key in the QoreSeal registry | gas 267584 | [`A453CAEAEF…`](https://explore.qore.network/tx/A453CAEAEFE5D66E047AAEEF56E9F039D07CF8E8144069DF5762C5519F371940) |
| 2026-11-17T20:20:19 | auditor-q3: ML-DSA-87 key + proof of possession | gas 297027 | [`08A91C9D7A…`](https://explore.qore.network/tx/08A91C9D7A831CE9A13BB51BC8E52D4F9896D4AED5760FFE31DE588F0B5D50D6) |
| 2026-11-17T20:20:22 | auditor-q3: ML-KEM-1024 key in the QoreSeal registry | gas 267584 | [`E8AAE6DB20…`](https://explore.qore.network/tx/E8AAE6DB204F2D9FB6791614F1ECE89D159F1096979C30745FF812254E07AAD6) |
| 2026-11-17T20:20:26 | auditor-q4: ML-DSA-87 key + proof of possession | gas 297027 | [`6D0C05E37D…`](https://explore.qore.network/tx/6D0C05E37D219666B8629DC056B8E55E6762BA9122D91725418B40FEC023FEDB) |
| 2026-11-17T20:20:29 | auditor-q4: ML-KEM-1024 key in the QoreSeal registry | gas 267584 | [`DF007A5FC0…`](https://explore.qore.network/tx/DF007A5FC0192583541D7A6F9F8784343DF0FAD4FBB93AC940FEE3138D412751) |
| 2026-11-17T20:20:39 | K1 seal | record sealed to vasp-singapore + auditor-q4 from on-chain keys; 4330 bytes; sha3 3d0aec38751c3208… |  |
| 2026-11-17T20:20:39 | K1 check | vasp-singapore opens it |  |
| 2026-11-17T20:20:39 | K1 check | auditor-q4 opens it |  |
| 2026-11-17T20:20:39 | K1 check | auditor-q3 cannot |  |
| 2026-11-17T20:20:39 | K1 check | 4 fUSD instead of 5 fails |  |
| 2026-11-17T20:20:39 | K1 check | another beneficiary fails |  |
| 2026-11-17T20:20:55 | deploy: open EVM window | hybrid-signed, 1 tx, 120 blocks, value cap = this deploy's max fee | [`A4041E80C3…`](https://explore.qore.network/tx/A4041E80C307D4FAA44FC1D72159F1BC5F5CA6C1B1439FC8A33D909CE04AD7E5) |
| 2026-11-17T20:20:57 | deploy TravelRuleLedger | at 0xa9466483c8c1a55eb18cd669b9b60308baae28ca, gas 863196 | [`0xa4b7aebf…`](https://explore.qore.network/tx/0xa4b7aebf784f28ac9b6970d47b456cedaa998897a76bbb9a9a726692c39a1602) |
| 2026-11-17T20:21:00 | deploy: close EVM window | hybrid-signed | [`ABABBF2022…`](https://explore.qore.network/tx/ABABBF2022C89C5FFE2836DC095A26B8423B85812A8663EF032B575E84081783) |
| 2026-11-17T20:21:12 | K2: open scoped EVM window | targets [ledger], 1 tx | [`C639235706…`](https://explore.qore.network/tx/C639235706FB9831003144CA3737352777CA9B77941067B1D0645AD0826B7DE7) |
| 2026-11-17T20:21:18 | K2: postRecord | ML-DSA-87 signature checked on chain by pqcVerify; envelope 4330 B; gas 405441 | [`0x5104c90a…`](https://explore.qore.network/tx/0x5104c90afd6e37af4f346a66345f958e43f8616abc5d5ee86988a3e0cec6c76c) |
| 2026-11-17T20:21:21 | K2: close EVM window | hybrid-signed | [`5FF1D333BC…`](https://explore.qore.network/tx/5FF1D333BC338CF10C4FA0ACA056323ABD2B678480E3527AF152E23863539245) |
| 2026-11-17T20:21:37 | live positive check | valid ML-DSA-87 signature simulates successfully |  |
| 2026-11-17T20:21:37 | live negative check | forged signature (all zero bytes): reverted BadSignature |  |
| 2026-11-17T20:21:38 | live negative check | valid signature, envelope changed by one byte: reverted BadSignature |  |
| 2026-11-17T20:21:38 | live negative check | valid signature claimed for another originator: reverted BadSignature |  |
| 2026-11-17T20:21:38 | live negative check | originator with no registered PQC key: reverted KeyNotUsable |  |
| 2026-11-18T21:46:31 | swap on the native AMM | 10 QOR for fUSD in pool 2 (min 0.72882); vasp-mumbai now holds 0.764881 fUSD | [`F79F30C51B…`](https://explore.qore.network/tx/F79F30C51BE08D81E02D1C560A5799E5039690B7FC739B32549B91559810014C) |
| 2026-11-18T21:47:44 | post record: open EVM window | vasp-mumbai, scoped to the ledger, 1 tx | [`399BF31880…`](https://explore.qore.network/tx/399BF318803A4B69DC5B3B0276558A1970245C3F646860BA3A54515AAB3045CA) |
| 2026-11-18T21:47:47 | post record | postRecord, ML-DSA-87 signature checked on chain; gas 405321 | [`0x8d47affc…`](https://explore.qore.network/tx/0x8d47affc44a41f8837b9fb79c76da73a018f484b88ab1076fae1e547649fa8d9) |
| 2026-11-18T21:47:50 | post record: close EVM window | vasp-mumbai | [`BA8E915D1C…`](https://explore.qore.network/tx/BA8E915D1C539FED5D3BC623D151040368FCB8CF31D844760776BB26389F5029) |
| 2026-11-18T21:47:53 | transfer | 0.25 fUSD to qor1ketaxqdh… with memo travelseal:85f4d7b6… | [`53B414BF01…`](https://explore.qore.network/tx/53B414BF01CD849729C40F1FDAD15C18393388B3DE3FBA41F03DDA381220E49D) |
| 2026-11-18T21:47:54 | receive | deposit 0.25 fUSD from qor1ywtz48pc…, transfer 85f4d7b6… |  |
| 2026-11-18T21:48:15 | receive | deposit 0.25 fUSD from qor1ywtz48pc…, transfer 85f4d7b6… |  |
| 2026-11-18T21:48:16 | open record | opened with the landed terms: originator Meera Kulkarni (fictional) |  |
| 2026-11-18T21:48:21 | accept record: open EVM window | vasp-singapore, scoped to the ledger, 1 tx | [`B2AE66D122…`](https://explore.qore.network/tx/B2AE66D1224BE98C2D759ED9FE9D85A80041BA3CEAD63FEF9A2A989EF01D1ABF) |
| 2026-11-18T21:48:24 | accept record | answer, ML-DSA-87 signature checked on chain; gas 239411 | [`0x1fe9996b…`](https://explore.qore.network/tx/0x1fe9996beeed2fba71c198f3ad67b40d97917ea354b536c5517f5968efb367ae) |
| 2026-11-18T21:48:27 | accept record: close EVM window | vasp-singapore | [`6401CB7A37…`](https://explore.qore.network/tx/6401CB7A37CCF187E52292E0F1BDE2EEC352AB9FCB7C7B004A0D821EE23EF400) |
| 2026-11-18T21:48:41 | post record: open EVM window | vasp-mumbai, scoped to the ledger, 1 tx | [`5B2DA42807…`](https://explore.qore.network/tx/5B2DA428073367E3F58E444A8A4B36B70E473852E365CB83E2260B6E42CBE2CA) |
| 2026-11-18T21:48:44 | post record | postRecord, ML-DSA-87 signature checked on chain; gas 405465 | [`0x886cdb66…`](https://explore.qore.network/tx/0x886cdb66fb3cfd5ad8524b3b5c53394ec2a1cb2e6058215b3d6b826b086ac662) |
| 2026-11-18T21:48:47 | post record: close EVM window | vasp-mumbai | [`BA85822C1B…`](https://explore.qore.network/tx/BA85822C1BA481779C93FABEDA688EF85D629A1F7FCEE8196BAD7A586829971A) |
| 2026-11-18T21:48:49 | transfer | 0.2 fUSD to qor1ketaxqdh… with memo travelseal:e79c1c81… | [`D1AD6FA38F…`](https://explore.qore.network/tx/D1AD6FA38F009CE983F8171204B75D2E82C6F2245B0B18BD052FB2651042EFE1) |
| 2026-11-18T21:48:50 | receive | deposit 0.2 fUSD from qor1ywtz48pc…, transfer e79c1c81… |  |
| 2026-11-18T21:48:51 | open record | did not open with the landed terms: DECRYPTION_FAILED |  |
| 2026-11-18T21:48:57 | reject record: open EVM window | vasp-singapore, scoped to the ledger, 1 tx | [`E4FD4C36D2…`](https://explore.qore.network/tx/E4FD4C36D2D516C767AF95DDB6A69E605EEE33B25143512661900F0577216E97) |
| 2026-11-18T21:49:00 | reject record | answer, ML-DSA-87 signature checked on chain; gas 239279 | [`0xba1aca17…`](https://explore.qore.network/tx/0xba1aca17e635ff15fc9327b359eadb9883222494e2f3db29fdc2358e1eec17f7) |
| 2026-11-18T21:49:03 | reject record: close EVM window | vasp-singapore | [`623F9DC3D5…`](https://explore.qore.network/tx/623F9DC3D596006FF9572633ED927E3C932D03CB2B0EFBD800233048299205D4) |
| 2026-11-18T21:51:35 | post record: open EVM window | vasp-mumbai, scoped to the ledger, 1 tx | [`031CFDC3BF…`](https://explore.qore.network/tx/031CFDC3BFA888EDB75896BA136A15B80F4D643956A4DC53F5C25922D4F2D6C3) |
| 2026-11-18T21:51:38 | post record | postRecord, ML-DSA-87 signature checked on chain; gas 405429 | [`0xd5201e95…`](https://explore.qore.network/tx/0xd5201e95529c3f862552d29198953bcab91192faaa80aa83319f6035c8a570f5) |
| 2026-11-18T21:51:41 | post record: close EVM window | vasp-mumbai | [`1B4B94A03F…`](https://explore.qore.network/tx/1B4B94A03F221C6B0EBB02DD2F914E6E3F929B4F5AA181672852503FBAC4BE1A) |
| 2026-11-18T21:51:44 | transfer | 0.25 fUSD to qor1ketaxqdh… with memo travelseal:cb5d93c6… | [`997594DA4B…`](https://explore.qore.network/tx/997594DA4B305F33473AAFF7B5CF2C8950B988F9186E3F0D8F586C7C3D200CF4) |
| 2026-11-18T21:51:44 | receive | deposit 0.25 fUSD from qor1ywtz48pc…, transfer cb5d93c6… |  |
| 2026-11-18T21:51:46 | open record | opened with the landed terms: originator Meera Kulkarni (fictional) |  |
| 2026-11-18T21:51:50 | accept record: open EVM window | vasp-singapore, scoped to the ledger, 1 tx | [`BA041C9AF1…`](https://explore.qore.network/tx/BA041C9AF1C0574E71BE4A627902ADC06630E113132DE5E2CEA5005D13FD9166) |
| 2026-11-18T21:51:53 | accept record | answer, ML-DSA-87 signature checked on chain; gas 239447 | [`0x7362e4c1…`](https://explore.qore.network/tx/0x7362e4c179d661f5a76c6ce65c886d9e601104bac80489154c0bbd262d439bc1) |
| 2026-11-18T21:51:56 | accept record: close EVM window | vasp-singapore | [`C20482374E…`](https://explore.qore.network/tx/C20482374E04AF12A0B4800DFBB4316D8ECC46E449C02F53842D20A0482A4A2E) |
| 2026-11-18T21:52:03 | audit q4 | auditor-q4 opened 1 of 3 Q4 records against their landed transfers; 1 had no matching transfer |  |
| 2026-11-18T21:52:09 | audit q3 | auditor-q3 opened 1 of 1 Q3 records against their landed transfers; 0 had no matching transfer |  |
| 2026-11-18T21:52:46 | top up vasp-singapore | 10 QOR from vasp-mumbai | [`3853C06EC5…`](https://explore.qore.network/tx/3853C06EC56F189B36E0C3184A62D9B902C21DAF68EC02884C083B7B0663BE3C) |
| 2026-11-19T20:35:36 | audit 20264 | auditor-q4 opened 1 of 3 records against their landed transfers, flagged 1, 1 had no transfer |  |
