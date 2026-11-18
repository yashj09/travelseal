import { describe, expect, it } from "vitest";
import { verifyRecipientCard, type SealKeyPair } from "@qorechain/qoreseal";
import {
  CHAIN_ID, decodeRecord, demoRecord, encodeRecord, generateRsaKeyPair, identityFromMnemonic, makeCard, newMnemonic, newTransferId,
  openClassic, openRecord, sealClassic, sealRecord, termsOf,
} from "../src/index.js";

/**
 * The demo's Q-Day scene as a test. Eve harvested both envelopes earlier. A future quantum computer gives her what
 * Shor's algorithm breaks: the RSA private key and the receiver's X25519 secret. It does not give her the ML-KEM secret.
 */
describe("simulated Q-Day", () => {
  it("opens the classical envelope and not the TravelSeal one", async () => {
    const [mumbai, singapore] = await Promise.all([identityFromMnemonic("vasp-mumbai", newMnemonic()), identityFromMnemonic("vasp-singapore", newMnemonic())]);
    const record = demoRecord({ transferId: newTransferId(), originatorAddress: mumbai.account.cosmos, beneficiaryAddress: singapore.account.cosmos });
    const recipient = verifyRecipientCard({ card: makeCard(singapore), chainId: CHAIN_ID, address: singapore.account.cosmos, pqPublicKey: singapore.account.pqc.publicKey, mlkemPublicKey: singapore.seal.mlkemPublicKey });

    const rsa = await generateRsaKeyPair();
    const classic = await sealClassic(encodeRecord(record), rsa.publicKey);
    const travelSeal = sealRecord(record, [recipient]);

    const eveFromRsa = decodeRecord(await openClassic(classic, rsa.privateKey));
    expect(eveFromRsa.originator.customer.name.primaryIdentifier).toBe("Kulkarni");

    const eveKeys: SealKeyPair = {
      ...singapore.seal,
      mlkemSecretKey: crypto.getRandomValues(new Uint8Array(singapore.seal.mlkemSecretKey.length)),
    };
    expect(openRecord(travelSeal, eveKeys, termsOf(record))).toEqual({ ok: false, reason: "DECRYPTION_FAILED" });
    expect(openRecord(travelSeal, singapore.seal, termsOf(record)).ok).toBe(true);
  });
});
