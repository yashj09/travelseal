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
| 2026-11-25T18:35:13 | deploy: open EVM window | hybrid-signed, 1 tx, 120 blocks, value cap = this deploy's max fee | [`DD8F362068…`](https://explore.qore.network/tx/DD8F362068B8A0A243865125E629FCC66876C6E568AFEBA639290F7C916F8104) |
| 2026-11-25T18:35:16 | deploy TravelRuleLedger | at 0xccdff2afed218fed224811edc18b5ebac569536c, gas 953222 | [`0x12049615…`](https://explore.qore.network/tx/0x12049615fd00164483f2688674075ad83389cf8293132d7b38efd1a993958386) |
| 2026-11-25T18:35:20 | deploy: close EVM window | hybrid-signed | [`CCD68A8486…`](https://explore.qore.network/tx/CCD68A84863BC02A1E031123E0DC1F2976AB0E1D3DD177A8940350AA6977F716) |
| 2026-11-25T18:35:22 | resolve recipients | vasp-singapore and auditor-q4: ML-DSA-87 key with proof of possession, ML-KEM-1024 key and card all check out on chain |  |
| 2026-11-25T18:35:22 | seal record | 4333 B hybrid ML-KEM-1024 + X25519 envelope, bound to transfer 26a80adb…, 0.25 fUSD |  |
| 2026-11-25T18:35:27 | post record: open EVM window | vasp-mumbai, scoped to the ledger, 1 tx (hybrid-signed) | [`DC0A7988D8…`](https://explore.qore.network/tx/DC0A7988D827F332FDF02FD49842305A05DA75456F4D898B929552431E6FA281) |
| 2026-11-25T18:35:29 | post record | postRecord: ML-DSA-87 signature checked on chain by pqcVerify, gas 405684 | [`0x4883c1f9…`](https://explore.qore.network/tx/0x4883c1f96acb2c54ae6c01f645b8f32bae5c007df05274468e2c8ea7442a01a3) |
| 2026-11-25T18:35:33 | post record: close EVM window | vasp-mumbai | [`EA22192D4E…`](https://explore.qore.network/tx/EA22192D4EDFD2BCF2D72EB8201105B82177AD39E96F51B1E2572209305BA9CE) |
| 2026-11-25T18:35:36 | transfer | 0.000001 QOR to qor1ketaxqdh…, memo travelseal:26a80adb… (hybrid-signed) | [`F2847640CD…`](https://explore.qore.network/tx/F2847640CD872AB63BA7DB535C02375BCE9E695227144CF866822470C341BFA2) |
| 2026-11-25T18:35:36 | receive | deposit of 0.000001 QOR from qor1ws53czmd… read from the chain, transfer 26a80adb… | [`F2847640CD…`](https://explore.qore.network/tx/F2847640CD872AB63BA7DB535C02375BCE9E695227144CF866822470C341BFA2) |
| 2026-11-25T18:35:36 | no record | the sender of this deposit posted no TravelSeal record for it to us; left unanswered |  |
| 2026-11-25T18:35:39 | transfer | 0.25 fUSD to qor1ketaxqdh…, memo travelseal:26a80adb… (hybrid-signed) | [`0549FEC89F…`](https://explore.qore.network/tx/0549FEC89FA13D48C824AE58F937A5334124BE5A5E155C5C0D6365E6B39337DE) |
| 2026-11-25T18:35:40 | receive | deposit of 0.25 fUSD from qor1ywtz48pc… read from the chain, transfer 26a80adb… | [`0549FEC89F…`](https://explore.qore.network/tx/0549FEC89FA13D48C824AE58F937A5334124BE5A5E155C5C0D6365E6B39337DE) |
| 2026-11-25T18:35:41 | open record | opened with the terms of the deposit that landed |  |
| 2026-11-25T18:35:46 | accept record: open EVM window | vasp-singapore, scoped to the ledger, 1 tx (hybrid-signed) | [`3826184397…`](https://explore.qore.network/tx/38261843977A5EF7A6AD787A1D035CC31339981E290606B96671584BDD66A0AC) |
| 2026-11-25T18:35:49 | accept record | answer: ML-DSA-87 signature checked on chain by pqcVerify, gas 241252 | [`0xd6d3f009…`](https://explore.qore.network/tx/0xd6d3f009233fe07bf32309cbaccd85abd5520b49735ff553f37a27962ed9c410) |
| 2026-11-25T18:35:52 | accept record: close EVM window | vasp-singapore | [`1DFCC25F80…`](https://explore.qore.network/tx/1DFCC25F80285ED3865A3A506757052BD4311AAEEB57FC781F2C08471CE7A6A8) |
| 2026-11-25T18:35:55 | resolve recipients | vasp-singapore and auditor-q4: ML-DSA-87 key with proof of possession, ML-KEM-1024 key and card all check out on chain |  |
| 2026-11-25T18:35:55 | seal record | 4333 B hybrid ML-KEM-1024 + X25519 envelope, bound to transfer 1c5b8aea…, 0.25 fUSD |  |
| 2026-11-25T18:36:00 | post record: open EVM window | vasp-mumbai, scoped to the ledger, 1 tx (hybrid-signed) | [`DE2FBBD92A…`](https://explore.qore.network/tx/DE2FBBD92AE8E66AFBB2EF9C770F55713F688F5097EFCB222CBA9616F6FF7EAE) |
| 2026-11-25T18:36:04 | post record | postRecord: ML-DSA-87 signature checked on chain by pqcVerify, gas 405828 | [`0x7b889775…`](https://explore.qore.network/tx/0x7b889775297cad6e9725ada6e99481249bc251d97821ce4750722170283d9660) |
| 2026-11-25T18:36:07 | post record: close EVM window | vasp-mumbai | [`309EF76CD2…`](https://explore.qore.network/tx/309EF76CD209C43101E542FC8FE3DA5C6236E2E0B60728CC8DCE8979BBB039B9) |
| 2026-11-25T18:36:10 | transfer | 0.2 fUSD to qor1ketaxqdh…, memo travelseal:1c5b8aea… (hybrid-signed) | [`8A31836FB1…`](https://explore.qore.network/tx/8A31836FB1F0A4770BC9CDBE460F2ED7068B5BBE07A57000A9D00F006DAE38CF) |
| 2026-11-25T18:36:10 | receive | deposit of 0.2 fUSD from qor1ywtz48pc… read from the chain, transfer 1c5b8aea… | [`8A31836FB1…`](https://explore.qore.network/tx/8A31836FB1F0A4770BC9CDBE460F2ED7068B5BBE07A57000A9D00F006DAE38CF) |
| 2026-11-25T18:36:11 | open record | does not open with the terms of the deposit that landed (DECRYPTION_FAILED) |  |
| 2026-11-25T18:36:16 | reject record: open EVM window | vasp-singapore, scoped to the ledger, 1 tx (hybrid-signed) | [`9BDADC2912…`](https://explore.qore.network/tx/9BDADC29124724E3DEA3760CC6C906F9DA3A25905C436C8E144D990372CD0501) |
| 2026-11-25T18:36:19 | reject record | answer: ML-DSA-87 signature checked on chain by pqcVerify, gas 241288 | [`0x2ee75969…`](https://explore.qore.network/tx/0x2ee75969c313bdc559e685c2dc1fef3479134b6d7109e8897cbe238fc48428d0) |
| 2026-11-25T18:36:22 | reject record: close EVM window | vasp-singapore | [`17528C168C…`](https://explore.qore.network/tx/17528C168C78C2ED625C6C9EF37994EE1C231881902FB95BB41EE80437E9CF59) |
| 2026-11-25T18:36:25 | resolve recipients | vasp-singapore and auditor-q4: ML-DSA-87 key with proof of possession, ML-KEM-1024 key and card all check out on chain |  |
| 2026-11-25T18:36:25 | seal record | 4333 B hybrid ML-KEM-1024 + X25519 envelope, bound to transfer 310de88b…, 0.25 fUSD |  |
| 2026-11-25T18:36:31 | post record: open EVM window | vasp-mumbai, scoped to the ledger, 1 tx (hybrid-signed) | [`4E98F6DBC3…`](https://explore.qore.network/tx/4E98F6DBC334E1767C5B02408E2557D393FAF79D327FDCDE95EED17611CD87AC) |
| 2026-11-25T18:36:33 | post record | postRecord: ML-DSA-87 signature checked on chain by pqcVerify, gas 405756 | [`0xa401dc44…`](https://explore.qore.network/tx/0xa401dc44444e23671844f0121a0fd0eb6089b6e7778d9eb348fddb5cca28bdcb) |
| 2026-11-25T18:36:37 | post record: close EVM window | vasp-mumbai | [`78F29A503D…`](https://explore.qore.network/tx/78F29A503D58161549725DF464014A31967117AB9207A3E8B6C7D7A322D995CC) |
| 2026-11-25T18:36:39 | transfer | 0.25 fUSD to qor1ketaxqdh…, memo travelseal:310de88b… (hybrid-signed) | [`97E3C812D8…`](https://explore.qore.network/tx/97E3C812D8D4EAD798F7FF2E8B056175267014526116129143E6A63C9447430A) |
| 2026-11-25T18:36:40 | receive | deposit of 0.25 fUSD from qor1ywtz48pc… read from the chain, transfer 310de88b… | [`97E3C812D8…`](https://explore.qore.network/tx/97E3C812D8D4EAD798F7FF2E8B056175267014526116129143E6A63C9447430A) |
| 2026-11-25T18:36:41 | open record | opened with the terms of the deposit that landed |  |
| 2026-11-25T18:36:46 | accept record: open EVM window | vasp-singapore, scoped to the ledger, 1 tx (hybrid-signed) | [`640D5D0895…`](https://explore.qore.network/tx/640D5D0895EC04F95E4C2C01ACADD2AFF3221E0399D26E580B72D8A945C26390) |
| 2026-11-25T18:36:49 | accept record | answer: ML-DSA-87 signature checked on chain by pqcVerify, gas 241348 | [`0x0c4fcff1…`](https://explore.qore.network/tx/0x0c4fcff10eff5ea298af7c6f2e88917fe3a98278a17cb6b528e287eb1aa1e40f) |
| 2026-11-25T18:36:53 | accept record: close EVM window | vasp-singapore | [`E454E87A19…`](https://explore.qore.network/tx/E454E87A191DC381C20AD08D0A02264D159B765413982981C4EB75C41BF1B2C9) |
| 2026-11-25T18:36:54 | live positive check | valid ML-DSA-87 signature simulates successfully |  |
| 2026-11-25T18:36:55 | live negative check | forged signature (all zero bytes): reverted BadSignature |  |
| 2026-11-25T18:36:55 | live negative check | valid signature, envelope changed by one byte: reverted BadSignature |  |
| 2026-11-25T18:36:56 | live negative check | valid signature claimed for another originator: reverted BadSignature |  |
| 2026-11-25T18:36:56 | live negative check | originator with no registered PQC key: reverted KeyNotUsable |  |
| 2026-11-25T18:37:01 | audit 20264 | auditor-q4 opened 2 of 3 records against their landed transfers, flagged 1, 0 had no transfer |  |
| 2026-11-25T18:37:12 | resolve recipients | vasp-singapore and auditor-q3: ML-DSA-87 key with proof of possession, ML-KEM-1024 key and card all check out on chain |  |
| 2026-11-25T18:37:12 | seal record | 4333 B hybrid ML-KEM-1024 + X25519 envelope, bound to transfer 25891c2f…, 0.25 fUSD |  |
| 2026-11-25T18:37:17 | post record: open EVM window | vasp-mumbai, scoped to the ledger, 1 tx (hybrid-signed) | [`2B59FE82F4…`](https://explore.qore.network/tx/2B59FE82F4EF89778BC08D3E5BFE7AD24986775CACC64779E92E9A0BA93C9458) |
| 2026-11-25T18:37:20 | post record | postRecord: ML-DSA-87 signature checked on chain by pqcVerify, gas 405804 | [`0xf01cdcd0…`](https://explore.qore.network/tx/0xf01cdcd02ef0ce8167b73285dfad64114c41805fce624291244c917005fa648f) |
| 2026-11-25T18:37:24 | post record: close EVM window | vasp-mumbai | [`02176C084C…`](https://explore.qore.network/tx/02176C084C73E734483237F07570E98ED020A95743F83AD116C40ED44C248B3C) |
| 2026-11-25T18:37:27 | transfer | 0.25 fUSD to qor1ketaxqdh…, memo travelseal:25891c2f… (hybrid-signed) | [`874B16D787…`](https://explore.qore.network/tx/874B16D787B069FFE9BC8FB366C1032DD70B3CDF4866525AF0005C6ED015D389) |
| 2026-11-25T18:37:27 | receive | deposit of 0.25 fUSD from qor1ywtz48pc… read from the chain, transfer 25891c2f… | [`874B16D787…`](https://explore.qore.network/tx/874B16D787B069FFE9BC8FB366C1032DD70B3CDF4866525AF0005C6ED015D389) |
| 2026-11-25T18:37:29 | open record | opened with the terms of the deposit that landed |  |
| 2026-11-25T18:37:33 | accept record: open EVM window | vasp-singapore, scoped to the ledger, 1 tx (hybrid-signed) | [`C9913CE02B…`](https://explore.qore.network/tx/C9913CE02B5768103DC5EC5EA590C13A16031B60F0C693FE6700703689F289FD) |
| 2026-11-25T18:37:36 | accept record | answer: ML-DSA-87 signature checked on chain by pqcVerify, gas 241180 | [`0x42f43255…`](https://explore.qore.network/tx/0x42f43255993b2be7dd88001be9f0ce7082ebe9df894e98c9069d34bb16b31d62) |
| 2026-11-25T18:37:40 | accept record: close EVM window | vasp-singapore | [`F623C40FDB…`](https://explore.qore.network/tx/F623C40FDB14871E92ED5FBEB75B61FFAC8456FF1F511ECA6A8ADEEAC2296950) |
