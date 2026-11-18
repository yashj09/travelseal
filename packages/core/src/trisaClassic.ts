/**
 * A classical travel-rule envelope in the shape TRISA's docs describe: the payload is encrypted with AES-256-GCM
 * under a fresh key, authenticated with HMAC-SHA256 under a fresh secret, and both are wrapped to the recipient's RSA
 * key with RSA-OAEP-SHA512. It exists only for the side-by-side "harvest now, decrypt later" comparison.
 */
const subtle = globalThis.crypto.subtle;
const RSA = { name: "RSA-OAEP", hash: "SHA-512" } as const;

export interface ClassicEnvelope {
  encryptionAlgorithm: "AES256-GCM";
  hmacAlgorithm: "HMAC-SHA256";
  sealed: true;
  encryptionKey: string;
  hmacSecret: string;
  nonce: string;
  payload: string;
  hmac: string;
}

const b64 = (u: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(u)));
const unb64 = (s: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function generateRsaKeyPair(bits = 2048): Promise<CryptoKeyPair> {
  return subtle.generateKey({ ...RSA, modulusLength: bits, publicExponent: new Uint8Array([1, 0, 1]) }, true, ["encrypt", "decrypt"]);
}

export async function sealClassic(plaintext: Uint8Array<ArrayBuffer>, recipient: CryptoKey): Promise<ClassicEnvelope> {
  const key = crypto.getRandomValues(new Uint8Array(32));
  const secret = crypto.getRandomValues(new Uint8Array(32));
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const aes = await subtle.importKey("raw", key, "AES-GCM", false, ["encrypt"]);
  const payload = await subtle.encrypt({ name: "AES-GCM", iv: nonce }, aes, plaintext);
  const mac = await subtle.importKey("raw", secret, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return {
    encryptionAlgorithm: "AES256-GCM",
    hmacAlgorithm: "HMAC-SHA256",
    sealed: true,
    encryptionKey: b64(await subtle.encrypt(RSA, recipient, key)),
    hmacSecret: b64(await subtle.encrypt(RSA, recipient, secret)),
    nonce: b64(nonce),
    payload: b64(payload),
    hmac: b64(await subtle.sign("HMAC", mac, payload)),
  };
}

/** Whoever holds the RSA private key (the recipient today, or an attacker after Q-Day) opens every stored copy. */
export async function openClassic(env: ClassicEnvelope, rsaPrivateKey: CryptoKey): Promise<Uint8Array> {
  const key = new Uint8Array(await subtle.decrypt(RSA, rsaPrivateKey, unb64(env.encryptionKey)));
  const secret = new Uint8Array(await subtle.decrypt(RSA, rsaPrivateKey, unb64(env.hmacSecret)));
  const mac = await subtle.importKey("raw", secret, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  if (!(await subtle.verify("HMAC", mac, unb64(env.hmac), unb64(env.payload)))) throw new Error("HMAC mismatch");
  const aes = await subtle.importKey("raw", key, "AES-GCM", false, ["decrypt"]);
  return new Uint8Array(await subtle.decrypt({ name: "AES-GCM", iv: unb64(env.nonce) }, aes, unb64(env.payload)));
}
