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
