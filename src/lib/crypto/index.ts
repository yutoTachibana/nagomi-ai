/**
 * クライアント側暗号化ラッパー.
 *
 * 設計:
 *  - libsodium の secretbox (XSalsa20-Poly1305) を使用
 *  - マスターキーはサインアップ時に生成、パスフレーズで保護してローカル保存
 *  - DB に保存される `*_encrypted` カラムは {nonce_b64}:{ciphertext_b64} 形式
 *
 * ⚠️ Phase 0 (現在) では `NEXT_PUBLIC_FEATURE_E2E_ENCRYPTION=false` で
 *   passthrough 実装. Phase 1 で本格実装する.
 */

import sodium from 'libsodium-wrappers';

const ENABLED = process.env.NEXT_PUBLIC_FEATURE_E2E_ENCRYPTION === 'true';

let ready = false;
async function ensureReady() {
  if (!ready) {
    await sodium.ready;
    ready = true;
  }
}

const STORAGE_KEY = 'komorebi.encryption.master_key';

/**
 * マスターキーを生成 (サインアップ時に 1 回).
 * 返り値は base64.
 */
export async function generateMasterKey(): Promise<string> {
  await ensureReady();
  const key = sodium.crypto_secretbox_keygen();
  return sodium.to_base64(key);
}

/**
 * マスターキーを localStorage に保存.
 * 注意: 本番では IndexedDB + パスフレーズで暗号化して保存すべき.
 * Phase 1 で改善.
 */
export function storeMasterKey(keyB64: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, keyB64);
}

export function loadMasterKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function clearMasterKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * 暗号化. ENABLED=false なら passthrough.
 */
export async function encrypt(plaintext: string | null): Promise<string | null> {
  if (plaintext === null || plaintext === undefined) return null;
  if (!ENABLED) return plaintext;

  await ensureReady();
  const keyB64 = loadMasterKey();
  if (!keyB64) {
    throw new Error('Master key not found. Call generateMasterKey() at signup.');
  }
  const key = sodium.from_base64(keyB64);
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const message = sodium.from_string(plaintext);
  const ciphertext = sodium.crypto_secretbox_easy(message, nonce, key);
  return `${sodium.to_base64(nonce)}:${sodium.to_base64(ciphertext)}`;
}

/**
 * 復号. ENABLED=false なら passthrough. 復号失敗時は null を返す
 * (利用者の手元に既存データがあるが鍵を失った場合への配慮).
 */
export async function decrypt(stored: string | null): Promise<string | null> {
  if (stored === null || stored === undefined) return null;
  if (!ENABLED) return stored;

  await ensureReady();
  const keyB64 = loadMasterKey();
  if (!keyB64) return null;

  try {
    const [nonceB64, ctB64] = stored.split(':');
    if (!nonceB64 || !ctB64) return null;
    const key = sodium.from_base64(keyB64);
    const nonce = sodium.from_base64(nonceB64);
    const ct = sodium.from_base64(ctB64);
    const plain = sodium.crypto_secretbox_open_easy(ct, nonce, key);
    return sodium.to_string(plain);
  } catch {
    return null;
  }
}

export const ENCRYPTION_ENABLED = ENABLED;
