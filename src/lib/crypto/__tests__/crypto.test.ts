import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, generateMasterKey, ENCRYPTION_ENABLED } from '../index';

describe('crypto module (passthrough mode)', () => {
  it('ENCRYPTION_ENABLED is false in test environment', () => {
    expect(ENCRYPTION_ENABLED).toBe(false);
  });

  it('encrypt returns plaintext as-is when disabled', async () => {
    const result = await encrypt('hello');
    expect(result).toBe('hello');
  });

  it('decrypt returns stored text as-is when disabled', async () => {
    const result = await decrypt('hello');
    expect(result).toBe('hello');
  });

  it('encrypt returns null for null input', async () => {
    const result = await encrypt(null);
    expect(result).toBeNull();
  });

  it('decrypt returns null for null input', async () => {
    const result = await decrypt(null);
    expect(result).toBeNull();
  });

  it('handles Japanese text in passthrough mode', async () => {
    const text = 'こんにちは、今日は調子がいいです';
    expect(await encrypt(text)).toBe(text);
    expect(await decrypt(text)).toBe(text);
  });

  it('handles empty string in passthrough mode', async () => {
    expect(await encrypt('')).toBe('');
    expect(await decrypt('')).toBe('');
  });

  it('generateMasterKey returns a base64 string', async () => {
    const key = await generateMasterKey();
    expect(typeof key).toBe('string');
    expect(key.length).toBeGreaterThan(0);
  });
});
