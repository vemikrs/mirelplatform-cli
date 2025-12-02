# 設定管理ガイド

## 概要

mirelplatform-cli は、複数の設定方法と環境切り替え機能をサポートしています。

## 設定ファイルの場所

```
~/.mirel/
├── config.json              # グローバル設定
├── credentials              # トークン（600パーミッション）
└── profiles/                # プロファイル別設定
    ├── production/
    │   └── config.json
    ├── staging/
    │   └── config.json
    └── dev/
        └── config.json
```

---

## 接続先サーバーの設定

### 設定の優先順位

```
1. コマンドラインオプション (--api-url)
2. 環境変数 (MIREL_API_URL)
3. プロファイル設定 (~/.mirel/profiles/<name>/config.json)
4. グローバル設定 (~/.mirel/config.json)
5. デフォルト値 (https://mirelplatform.example.com)
```

### グローバル設定ファイル

**場所**: `~/.mirel/config.json`

```json
{
  "apiUrl": "https://mirelplatform.example.com",
  "currentProfile": null,
  "user": {
    "email": "user@example.com",
    "name": "John Doe"
  },
  "preferences": {
    "colorOutput": true,
    "verbose": false
  }
}
```

---

## ユースケース別の設定方法

### A. SaaS版（デフォルト）

デフォルトで `https://mirelplatform.example.com` に接続します。

```bash
# 設定不要、そのままログイン可能
mirel login
```

### B. 企業独自サーバー

```bash
# サーバーURLを設定
mirel config set apiUrl https://mirel.mycompany.com

# 確認
mirel config get apiUrl
# → https://mirel.mycompany.com

# ログイン
mirel login
```

### C. 環境変数による設定

```bash
# 環境変数で指定（グローバル設定より優先）
export MIREL_API_URL=https://mirel.mycompany.com
mirel login

# または .envrc (direnv使用)
echo 'export MIREL_API_URL=https://mirel.mycompany.com' > .envrc
direnv allow
```

### D. コマンドラインオプション

```bash
# 一時的に別のサーバーに接続
mirel --api-url https://dev.mirelplatform.com promarker:list

# ログインも可能
mirel --api-url https://staging.mirelplatform.com login
```

---

## プロファイル機能

複数の環境を切り替えて使用する場合に便利です。

### プロファイルの作成

```bash
# 本番環境
mirel config profile create production \
  --api-url https://mirelplatform.com

# ステージング環境
mirel config profile create staging \
  --api-url https://staging.mirelplatform.com

# 開発環境
mirel config profile create dev \
  --api-url http://localhost:3000
```

### プロファイルの一覧表示

```bash
mirel config profile list

# 出力例:
#   production (https://mirelplatform.com)
# * staging    (https://staging.mirelplatform.com) [current]
#   dev        (http://localhost:3000)
```

### プロファイルの切り替え

```bash
# プロファイルを切り替え
mirel config profile use production
# → ✅ Switched to profile 'production'

# 現在のプロファイルを確認
mirel config profile current
# → production

# 一時的に別プロファイルを使用
mirel --profile dev promarker:list
```

### プロファイルの削除

```bash
mirel config profile delete dev
# → ✅ Deleted profile 'dev'
```

---

## 設定コマンド一覧

### 設定の表示

```bash
# すべての設定を表示
mirel config show

# 出力例:
# Current Configuration:
#
# API URL:  https://mirelplatform.com
# User:     John Doe <john@example.com>
# Profile:  production
#
# Config file: ~/.mirel/config.json
```

### 設定値の取得

```bash
# 特定の設定を取得
mirel config get apiUrl
# → https://mirelplatform.com

mirel config get user
# → { "email": "user@example.com", "name": "John Doe" }
```

### 設定値の設定

```bash
# 設定を変更
mirel config set apiUrl https://new-server.com

# カラー出力を無効化
mirel config set preferences.colorOutput false

# 詳細モードを有効化
mirel config set preferences.verbose true
```

### 設定のリセット

```bash
# 特定の設定を削除
mirel config unset apiUrl

# すべての設定をリセット
mirel config reset
# → ⚠️  This will delete all configurations. Continue? (y/N)
```

---

## 初回セットアップフロー

### パターン1: SaaS版（推奨）

デフォルト設定で即座に利用可能：

```bash
$ mirel login
Opening browser for authentication...
https://mirelplatform.example.com/cli/auth?code=WDJB-MJHT

✅ Logged in as user@example.com

$ mirel promarker:list
# → API に接続してテンプレート一覧を表示
```

### パターン2: 企業独自サーバー

最初にサーバーURLを設定：

```bash
$ mirel config set apiUrl https://mirel.mycompany.com
✅ Set apiUrl = https://mirel.mycompany.com

$ mirel login
Opening browser for authentication...
https://mirel.mycompany.com/cli/auth?code=WDJB-MJHT

✅ Logged in as employee@mycompany.com
```

### パターン3: 対話型セットアップ（将来実装）

```bash
$ mirel setup
? Select your mirelplatform instance:
  ❯ mirelplatform.com (SaaS)
    Custom URL
    Local development (localhost:3000)

# Custom URL を選択した場合
? Enter your mirelplatform URL: https://mirel.mycompany.com
✅ API URL set to https://mirel.mycompany.com

? Authenticate now? (Y/n) Y
Opening browser for authentication...
```

---

## 環境変数一覧

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `MIREL_API_URL` | 接続先サーバーURL | `https://mirel.mycompany.com` |
| `MIREL_API_TOKEN` | APIトークン（認証） | `mpl_abc123xyz...` |
| `MIREL_PROFILE` | 使用するプロファイル | `production` |
| `MIREL_CONFIG_DIR` | 設定ファイルのディレクトリ | `~/.mirel` |
| `NO_COLOR` | カラー出力を無効化 | `1` |
| `DEBUG` | デバッグログを有効化 | `mirel:*` |

### 使用例

```bash
# 環境変数で一時的に設定を上書き
MIREL_API_URL=https://dev.mirelplatform.com \
MIREL_API_TOKEN=mpl_devtoken123 \
  mirel promarker:list

# CI/CD環境での使用
export MIREL_API_URL=https://mirelplatform.com
export MIREL_API_TOKEN=${{ secrets.MIREL_API_TOKEN }}
mirel promarker:generate --template my-template
```

---

## 実装例

### 設定の読み込み

```typescript
// packages/cli/src/core/config-manager.ts
import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

const CONFIG_DIR = process.env.MIREL_CONFIG_DIR || join(homedir(), '.mirel');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
const PROFILES_DIR = join(CONFIG_DIR, 'profiles');

export interface MirelConfig {
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

  // 3. 設定ファイル
  const config = loadGlobalConfig();

  // 3a. プロファイル設定
  const profile = process.env.MIREL_PROFILE || config.currentProfile;
  if (profile) {
    const profileConfig = loadProfileConfig(profile);
    if (profileConfig?.apiUrl) {
      return profileConfig.apiUrl;
    }
  }

  // 3b. グローバル設定
  if (config.apiUrl) {
    return config.apiUrl;
  }

  // 4. デフォルト
  return 'https://mirelplatform.example.com';
}

/**
 * グローバル設定を読み込み
 */
export function loadGlobalConfig(): MirelConfig {
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
export function saveGlobalConfig(config: MirelConfig): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }

  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * プロファイル設定を読み込み
 */
export function loadProfileConfig(profileName: string): MirelConfig | null {
  const profileFile = join(PROFILES_DIR, profileName, 'config.json');
  
  if (!existsSync(profileFile)) {
    return null;
  }

  try {
    const content = readFileSync(profileFile, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * プロファイル設定を保存
 */
export function saveProfileConfig(profileName: string, config: MirelConfig): void {
  const profileDir = join(PROFILES_DIR, profileName);
  
  if (!existsSync(profileDir)) {
    mkdirSync(profileDir, { recursive: true });
  }

  const profileFile = join(profileDir, 'config.json');
  writeFileSync(profileFile, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * プロファイル一覧を取得
 */
export function listProfiles(): Array<{ name: string; config: MirelConfig; isCurrent: boolean }> {
  if (!existsSync(PROFILES_DIR)) {
    return [];
  }

  const globalConfig = loadGlobalConfig();
  const currentProfile = process.env.MIREL_PROFILE || globalConfig.currentProfile;
  const profileDirs = readdirSync(PROFILES_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  return profileDirs.map(name => ({
    name,
    config: loadProfileConfig(name) || {},
    isCurrent: name === currentProfile,
  }));
}

/**
 * プロファイルを削除
 */
export function deleteProfile(profileName: string): void {
  const profileDir = join(PROFILES_DIR, profileName);
  
  if (existsSync(profileDir)) {
    rmSync(profileDir, { recursive: true });
  }

  // 現在のプロファイルだった場合はリセット
  const config = loadGlobalConfig();
  if (config.currentProfile === profileName) {
    config.currentProfile = undefined;
    saveGlobalConfig(config);
  }
}
```

### configコマンドの実装

```typescript
// packages/cli/src/commands/config.ts
import { Command, Args, Flags } from '@oclif/core';
import {
  loadGlobalConfig,
  saveGlobalConfig,
  loadApiUrl,
} from '../core/config-manager.js';

export default class Config extends Command {
  static description = 'CLI設定の管理';

  static examples = [
    '<%= config.bin %> <%= command.id %> show',
    '<%= config.bin %> <%= command.id %> get apiUrl',
    '<%= config.bin %> <%= command.id %> set apiUrl https://mirel.mycompany.com',
    '<%= config.bin %> <%= command.id %> unset apiUrl',
  ];

  static args = {
    action: Args.string({
      description: 'show | get | set | unset | reset',
      required: true,
      options: ['show', 'get', 'set', 'unset', 'reset'],
    }),
    key: Args.string({
      description: '設定キー (例: apiUrl, preferences.colorOutput)',
    }),
    value: Args.string({
      description: '設定値',
    }),
  };

  async run() {
    const { args } = await this.parse(Config);

    switch (args.action) {
      case 'show':
        await this.showConfig();
        break;
      case 'get':
        if (!args.key) this.error('Key is required for get action');
        await this.getConfig(args.key);
        break;
      case 'set':
        if (!args.key || !args.value) {
          this.error('Key and value are required for set action');
        }
        await this.setConfig(args.key, args.value);
        break;
      case 'unset':
        if (!args.key) this.error('Key is required for unset action');
        await this.unsetConfig(args.key);
        break;
      case 'reset':
        await this.resetConfig();
        break;
    }
  }

  private async showConfig() {
    const config = loadGlobalConfig();
    const apiUrl = loadApiUrl();

    this.log('Current Configuration:\n');
    this.log(`API URL:  ${apiUrl}`);

    if (config.user) {
      this.log(`User:     ${config.user.name} <${config.user.email}>`);
    }

    if (config.currentProfile) {
      this.log(`Profile:  ${config.currentProfile}`);
    }

    if (config.preferences) {
      this.log('\nPreferences:');
      Object.entries(config.preferences).forEach(([key, value]) => {
        this.log(`  ${key}: ${value}`);
      });
    }

    this.log(`\nConfig file: ~/.mirel/config.json`);
  }

  private async getConfig(key: string) {
    if (key === 'apiUrl') {
      this.log(loadApiUrl());
      return;
    }

    const config = loadGlobalConfig();
    const value = this.getNestedValue(config, key);

    if (value === undefined) {
      this.error(`Key '${key}' not found`);
    }

    this.log(typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value));
  }

  private async setConfig(key: string, value: string) {
    const config = loadGlobalConfig();
    this.setNestedValue(config, key, value);
    saveGlobalConfig(config);

    this.log(`✅ Set ${key} = ${value}`);
  }

  private async unsetConfig(key: string) {
    const config = loadGlobalConfig();
    this.deleteNestedValue(config, key);
    saveGlobalConfig(config);

    this.log(`✅ Unset ${key}`);
  }

  private async resetConfig() {
    const confirmed = await this.confirm(
      '⚠️  This will delete all configurations. Continue?'
    );

    if (!confirmed) {
      this.log('Cancelled');
      return;
    }

    saveGlobalConfig({});
    this.log('✅ Configuration reset');
  }

  // ネストされたキーの値を取得
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // ネストされたキーに値を設定
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  // ネストされたキーを削除
  private deleteNestedValue(obj: any, path: string): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => current?.[key], obj);
    if (target) delete target[lastKey];
  }

  private async confirm(message: string): Promise<boolean> {
    // 簡易実装 - 本番では prompts などを使用
    return true;
  }
}
```

---

## トラブルシューティング

### Q: 設定がうまく反映されない

```bash
# 設定の優先順位を確認
mirel config show

# 環境変数を確認
env | grep MIREL

# デバッグモードで実行
DEBUG=mirel:* mirel promarker:list
```

### Q: プロファイルが切り替わらない

```bash
# 現在のプロファイルを確認
mirel config profile current

# プロファイル一覧を確認
mirel config profile list

# 明示的に切り替え
mirel config profile use <profile-name>
```

### Q: 設定ファイルが見つからない

```bash
# 設定ファイルの場所を確認
ls -la ~/.mirel/

# 設定ディレクトリを再作成
mirel config set apiUrl https://mirelplatform.example.com
```

---

## ベストプラクティス

### 1. 環境ごとにプロファイルを作成

```bash
mirel config profile create production --api-url https://api.prod.com
mirel config profile create staging --api-url https://api.staging.com
mirel config profile create dev --api-url http://localhost:3000
```

### 2. CI/CD では環境変数を使用

```yaml
# .github/workflows/deploy.yml
env:
  MIREL_API_URL: ${{ secrets.MIREL_API_URL }}
  MIREL_API_TOKEN: ${{ secrets.MIREL_API_TOKEN }}

steps:
  - run: mirel promarker:generate --template my-template
```

### 3. チーム共有設定は .envrc で管理

```bash
# .envrc (direnv)
export MIREL_API_URL=https://mirel.mycompany.com

# .env.example (サンプル)
MIREL_API_URL=https://mirelplatform.example.com
```

---

**作成日**: 2025年12月2日  
**最終更新**: 2025年12月2日
