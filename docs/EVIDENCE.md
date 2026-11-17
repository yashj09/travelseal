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
