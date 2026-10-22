import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const KEY_BYTES = 32;

/** `iv:tag:ciphertext`, hex iv, hex tag, base64url ciphertext. */
export const ENCRYPTED_VALUE_PATTERN = /^[0-9a-f]{24}:[0-9a-f]{32}:[A-Za-z0-9_-]+$/;

export class CryptoConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CryptoConfigError";
  }
}

export class DecryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DecryptionError";
  }
}

/**
 * Reads the symmetric key from the environment. The key must decode to
 * exactly 32 bytes: 64 hex characters or 44 base64 characters.
 */
export function loadEncryptionKey(
  raw: string | undefined = process.env.TOKEN_ENCRYPTION_KEY,
): Buffer {
  const value = raw?.trim();
  if (!value) {
    throw new CryptoConfigError("TOKEN_ENCRYPTION_KEY is not set.");
  }

  const key = /^[0-9a-fA-F]{64}$/.test(value)
    ? Buffer.from(value, "hex")
    : Buffer.from(value, "base64");

  if (key.length !== KEY_BYTES) {
    throw new CryptoConfigError(
      "TOKEN_ENCRYPTION_KEY must decode to 32 bytes (64 hex characters or base64).",
    );
  }

  return key;
}

/** Encrypts a secret with AES-256-GCM using a fresh random IV. */
export function encryptSecret(
  plaintext: string,
  key: Buffer = loadEncryptionKey(),
): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("base64url")}`;
}

/** Decrypts a value produced by {@link encryptSecret}. */
export function decryptSecret(
  stored: string,
  key: Buffer = loadEncryptionKey(),
): string {
  const parts = stored.split(":");
  if (parts.length !== 3) {
    throw new DecryptionError("Malformed encrypted value.");
  }

  const [ivHex, tagHex, data] = parts;
  if (
    !/^[0-9a-f]{24}$/.test(ivHex) ||
    !/^[0-9a-f]{32}$/.test(tagHex) ||
    !data.length
  ) {
    throw new DecryptionError("Malformed encrypted value.");
  }

  try {
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    return Buffer.concat([
      decipher.update(Buffer.from(data, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new DecryptionError(
      "Could not decrypt the value: wrong key or tampered ciphertext.",
    );
  }
}

/** True when the value looks like output of {@link encryptSecret}. */
export function isEncryptedValue(value: string): boolean {
  return ENCRYPTED_VALUE_PATTERN.test(value);
}
