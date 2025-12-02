import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { chmod } from 'fs/promises';

const SERVICE_NAME = 'mirel-cli';
const ACCOUNT_NAME = 'api-token';
const CONFIG_DIR = process.env.MIREL_CONFIG_DIR || join(homedir(), '.mirel');
const CREDENTIALS_FILE = join(CONFIG_DIR, 'credentials');

/**
 * トークンを安全に保存
 * 優先順位: keychain > ファイル (600パーミッション)
 */
export async function saveToken(token: string): Promise<void> {
  // keytarは後で実装 - 今はファイルベースのみ
  // try {
  //   const keytar = await import('keytar');
  //   await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, token);
  //   return;
  // } catch (error) {
  //   // keytarが使えない環境の場合、ファイルにフォールバック
  // }

  // ファイルに保存（600パーミッション）
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }

  writeFileSync(CREDENTIALS_FILE, JSON.stringify({ token }), 'utf-8');
  await chmod(CREDENTIALS_FILE, 0o600); // 所有者のみ読み書き可能
}

/**
 * トークンを読み込み
 * 優先順位: 環境変数 > keychain > ファイル
 */
export async function loadToken(): Promise<string | null> {
  // 1. 環境変数
  if (process.env.MIREL_API_TOKEN) {
    return process.env.MIREL_API_TOKEN;
  }

  // 2. keychain (後で実装)
  // try {
  //   const keytar = await import('keytar');
  //   const token = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
  //   if (token) return token;
  // } catch (error) {
  //   // keytarが使えない
  // }

  // 3. ファイル
  try {
    if (!existsSync(CREDENTIALS_FILE)) {
      return null;
    }

    const data = readFileSync(CREDENTIALS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.token || null;
  } catch {
    return null;
  }
}

/**
 * トークンを削除
 */
export async function deleteToken(): Promise<void> {
  // keychainから削除 (後で実装)
  // try {
  //   const keytar = await import('keytar');
  //   await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
  // } catch {
  //   // ignore
  // }

  // ファイルから削除
  try {
    if (existsSync(CREDENTIALS_FILE)) {
      unlinkSync(CREDENTIALS_FILE);
    }
  } catch {
    // ignore
  }
}

/**
 * トークンの存在確認
 */
export async function hasToken(): Promise<boolean> {
  const token = await loadToken();
  return token !== null && token.length > 0;
}
