import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

const CONFIG_DIR = process.env.MIREL_CONFIG_DIR || join(homedir(), '.mirel');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export interface MirelGlobalConfig {
  apiUrl?: string;
  currentProfile?: string;
  user?: {
    email: string;
    name: string;
  };
  preferences?: {
    colorOutput?: boolean;
    verbose?: boolean;
  };
}

/**
 * API URLを優先順位に従って取得
 * 1. CLI option
 * 2. 環境変数
 * 3. グローバル設定
 * 4. デフォルト
 */
export function loadApiUrl(cliOption?: string): string {
  // 1. コマンドラインオプション
  if (cliOption) {
    return cliOption;
  }

  // 2. 環境変数
  if (process.env.MIREL_API_URL) {
    return process.env.MIREL_API_URL;
  }

  // 3. グローバル設定
  const config = loadGlobalConfig();
  if (config.apiUrl) {
    return config.apiUrl;
  }

  // 4. デフォルト
  return 'https://mirelplatform.example.com';
}

/**
 * グローバル設定を読み込み
 */
export function loadGlobalConfig(): MirelGlobalConfig {
  if (!existsSync(CONFIG_FILE)) {
    return {};
  }

  try {
    const content = readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return {};
  }
}

/**
 * グローバル設定を保存
 */
export function saveGlobalConfig(config: MirelGlobalConfig): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }

  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * 設定値を取得
 */
export function getConfig(key: string): any {
  const config = loadGlobalConfig();
  return getNestedValue(config, key);
}

/**
 * 設定値を設定
 */
export function setConfig(key: string, value: any): void {
  const config = loadGlobalConfig();
  setNestedValue(config, key, value);
  saveGlobalConfig(config);
}

/**
 * 設定値を削除
 */
export function unsetConfig(key: string): void {
  const config = loadGlobalConfig();
  deleteNestedValue(config, key);
  saveGlobalConfig(config);
}

/**
 * ネストされたキーの値を取得
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * ネストされたキーに値を設定
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

/**
 * ネストされたキーを削除
 */
function deleteNestedValue(obj: any, path: string): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => current?.[key], obj);
  if (target) delete target[lastKey];
}
