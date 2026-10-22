import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  CryptoConfigError,
  DecryptionError,
  decryptSecret,
  encryptSecret,
  isEncryptedValue,
  loadEncryptionKey,
} from "@/lib/crypto";

const KEY_A = "a".repeat(64);
const KEY_B = "b".repeat(64);

describe("token encryption", () => {
  beforeEach(() => {
    process.env.TOKEN_ENCRYPTION_KEY = KEY_A;
  });

  afterEach(() => {
    delete process.env.TOKEN_ENCRYPTION_KEY;
  });

  it("round-trips a secret", () => {
    const plaintext = "gho_16C7e42F292c6912E7710c838347Ae178B4a";
    const encrypted = encryptSecret(plaintext);

    expect(encrypted).not.toContain(plaintext);
    expect(isEncryptedValue(encrypted)).toBe(true);
    expect(decryptSecret(encrypted)).toBe(plaintext);
  });

  it("uses a fresh IV for every value", () => {
    const first = encryptSecret("same-value");
    const second = encryptSecret("same-value");

    expect(first).not.toBe(second);
    expect(first.split(":")[0]).not.toBe(second.split(":")[0]);
    expect(decryptSecret(first)).toBe(decryptSecret(second));
  });

  it("detects tampered ciphertext", () => {
    const encrypted = encryptSecret("secret-token");
    const [iv, tag, data] = encrypted.split(":");
    const flipped = `${data.slice(0, -1)}${data.endsWith("A") ? "B" : "A"}`;

    expect(() => decryptSecret(`${iv}:${tag}:${flipped}`)).toThrow(
      DecryptionError,
    );
  });

  it("detects a tampered authentication tag", () => {
    const encrypted = encryptSecret("secret-token");
    const [iv, tag, data] = encrypted.split(":");
    const flippedTag = `${tag.slice(0, -1)}${tag.endsWith("0") ? "1" : "0"}`;

    expect(() => decryptSecret(`${iv}:${flippedTag}:${data}`)).toThrow(
      DecryptionError,
    );
  });

  it("refuses to decrypt with a different key", () => {
    const encrypted = encryptSecret("secret-token", loadEncryptionKey(KEY_A));

    expect(() => decryptSecret(encrypted, loadEncryptionKey(KEY_B))).toThrow(
      DecryptionError,
    );
  });

  it("rejects malformed values", () => {
    expect(() => decryptSecret("not-encrypted")).toThrow(DecryptionError);
    expect(() => decryptSecret("a:b:c")).toThrow(DecryptionError);
  });

  it("requires a valid key", () => {
    delete process.env.TOKEN_ENCRYPTION_KEY;
    expect(() => loadEncryptionKey()).toThrow(CryptoConfigError);
    expect(() => loadEncryptionKey("")).toThrow(CryptoConfigError);
    expect(() => loadEncryptionKey("too-short")).toThrow(CryptoConfigError);
    expect(loadEncryptionKey(KEY_A)).toHaveLength(32);
  });
});
