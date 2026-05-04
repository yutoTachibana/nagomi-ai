// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';

describe('libsodium round-trip (direct)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sodium: any;

  beforeAll(async () => {
    const mod = await import('libsodium-wrappers');
    sodium = mod.default ?? mod;
    await sodium.ready;
  });

  it('encrypts and decrypts correctly', () => {
    const key = sodium.crypto_secretbox_keygen();
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    const message = sodium.from_string('こんにちは');
    const ct = sodium.crypto_secretbox_easy(message, nonce, key);
    const plain = sodium.crypto_secretbox_open_easy(ct, nonce, key);
    expect(sodium.to_string(plain)).toBe('こんにちは');
  });

  it('decryption fails with wrong key', () => {
    const key = sodium.crypto_secretbox_keygen();
    const wrongKey = sodium.crypto_secretbox_keygen();
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    const message = sodium.from_string('secret');
    const ct = sodium.crypto_secretbox_easy(message, nonce, key);
    expect(() => {
      sodium.crypto_secretbox_open_easy(ct, nonce, wrongKey);
    }).toThrow();
  });

  it('round-trips using nonce:ciphertext format (matching app format)', () => {
    const key = sodium.crypto_secretbox_keygen();
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    const plaintext = '日記の内容です';
    const message = sodium.from_string(plaintext);
    const ct = sodium.crypto_secretbox_easy(message, nonce, key);

    // Encode in the format used by the app: {nonce_b64}:{ciphertext_b64}
    const stored = `${sodium.to_base64(nonce)}:${sodium.to_base64(ct)}`;

    // Decode
    const [nonceB64, ctB64] = stored.split(':');
    const decodedNonce = sodium.from_base64(nonceB64);
    const decodedCt = sodium.from_base64(ctB64);
    const decrypted = sodium.crypto_secretbox_open_easy(decodedCt, decodedNonce, key);
    expect(sodium.to_string(decrypted)).toBe(plaintext);
  });
});
