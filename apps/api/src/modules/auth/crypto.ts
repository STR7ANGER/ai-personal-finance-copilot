import { createCipheriv, createDecipheriv, createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

function scrypt(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, 64, { N: 16_384, r: 8, p: 1 }, (error, key) => error ? reject(error) : resolve(key));
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt);
  return { hash: hash.toString("base64"), salt: salt.toString("base64") };
}

export async function verifyPassword(password: string, expectedHash: string, salt: string) {
  const actual = await scrypt(password, Buffer.from(salt, "base64"));
  const expected = Buffer.from(expectedHash, "base64");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export type EncryptedValue = { ciphertext: string; nonce: string; authTag: string; keyVersion: number };

export function encryptValue(value: string, key: Buffer, associatedData: string): EncryptedValue {
  if (key.length !== 32) throw new Error("Profile encryption key must contain 32 bytes");
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(Buffer.from(associatedData));
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return { ciphertext: ciphertext.toString("base64"), nonce: nonce.toString("base64"), authTag: cipher.getAuthTag().toString("base64"), keyVersion: 1 };
}

export function decryptValue(value: EncryptedValue, key: Buffer, associatedData: string) {
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(value.nonce, "base64"));
  decipher.setAAD(Buffer.from(associatedData));
  decipher.setAuthTag(Buffer.from(value.authTag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(value.ciphertext, "base64")), decipher.final()]).toString("utf8");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
