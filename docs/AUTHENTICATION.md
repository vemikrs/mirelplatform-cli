# 認証設計書

## 概要

mirelplatform-cli は、mirelplatform API へのアクセスに JWT (JSON Web Token) ベースの認証を使用します。

## 認証方式

### 1. OAuth2 デバイスフロー（推奨）

**フロー概要**:

```
┌─────────┐                                    ┌──────────────┐
│   CLI   │                                    │ mirelplatform│
└────┬────┘                                    └──────┬───────┘
     │                                                │
     │ 1. POST /api/auth/device/code                 │
     ├──────────────────────────────────────────────>│
     │                                                │
     │ 2. { device_code, user_code, verification_uri}│
     │<──────────────────────────────────────────────┤
     │                                                │
     │ 3. ブラウザを開く                              │
     │    https://mirelplatform.example.com/cli/auth │
     │         ?user_code=ABCD-1234                  │
     │                                                │
     │ 4. ポーリング開始                              │
     │    GET /api/auth/device/token                 │
     │         ?device_code=xxxxx                    │
     ├──────────────────────────────────────────────>│
     │                                                │
     │ 5a. { "status": "pending" } (認証待ち)         │
     │<──────────────────────────────────────────────┤
     │                                                │
     │ ... (5秒間隔でポーリング) ...                  │
     │                                                │
     │ 5b. { "access_token": "eyJ...", "user": {...} }│
     │<──────────────────────────────────────────────┤
     │                                                │
     │ 6. トークン保存 (keychain or file)            │
     │                                                │
```

**実装例**:

```typescript
// packages/cli/src/commands/login.ts
import { Command } from '@oclif/core';
import open from 'open';
import { saveToken } from '../core/auth.js';

export default class Login extends Command {
  static description = 'mirelplatform にログイン';

  async run() {
    const apiUrl = 'https://mirelplatform.example.com';
    
    // 1. デバイスコード取得
    const deviceResponse = await fetch(`${apiUrl}/api/auth/device/code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: 'mirel-cli' }),
    });
    
    const { device_code, user_code, verification_uri } = await deviceResponse.json();
    
    // 2. ブラウザを開く
    this.log(`Opening browser for authentication...`);
    this.log(`\nIf browser doesn't open, please visit:`);
    this.log(`${verification_uri}?user_code=${user_code}\n`);
    
    await open(`${verification_uri}?user_code=${user_code}`);
    
    // 3. ポーリング
    this.log('Waiting for authentication...');
    const token = await this.pollForToken(apiUrl, device_code);
    
    // 4. トークン保存
    await saveToken(token.access_token);
    
    this.log(`\n✅ Successfully logged in as ${token.user.email}`);
  }
  
  private async pollForToken(apiUrl: string, deviceCode: string, maxAttempts = 60): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(`${apiUrl}/api/auth/device/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_code: deviceCode }),
      });
      
      const data = await response.json();
      
      if (data.status === 'authorized') {
        return data;
      }
      
      if (data.status === 'denied') {
        this.error('Authentication was denied');
      }
      
      // 5秒待機
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    this.error('Authentication timeout');
  }
}
```

**サーバー側実装（参考）**:

```java
// backend/src/main/java/com/mirelplatform/api/AuthController.java
@RestController
@RequestMapping("/api/auth/device")
public class DeviceAuthController {
    
    @PostMapping("/code")
    public DeviceCodeResponse initiateDeviceAuth(@RequestBody DeviceAuthRequest request) {
        String deviceCode = generateDeviceCode();
        String userCode = generateUserCode(); // e.g., "ABCD-1234"
        
        // Redis等に一時保存（10分間有効）
        redisTemplate.opsForValue().set(
            "device:" + deviceCode,
            new DeviceAuthSession(userCode, "pending"),
            Duration.ofMinutes(10)
        );
        
        return new DeviceCodeResponse(
            deviceCode,
            userCode,
            "https://mirelplatform.example.com/cli/auth"
        );
    }
    
    @PostMapping("/token")
    public DeviceTokenResponse pollForToken(@RequestBody TokenPollRequest request) {
        DeviceAuthSession session = redisTemplate.opsForValue()
            .get("device:" + request.getDeviceCode());
        
        if (session == null) {
            return new DeviceTokenResponse("expired");
        }
        
        if ("authorized".equals(session.getStatus())) {
            String jwt = jwtService.generateToken(session.getUser());
            return DeviceTokenResponse.authorized(jwt, session.getUser());
        }
        
        return new DeviceTokenResponse(session.getStatus()); // "pending" or "denied"
    }
}
```

### 2. APIトークン方式（シンプル）

**使用場面**:
- CI/CD環境
- スクリプト自動化
- デバイスフローが使えない環境

**フロー**:

```bash
# 1. Webブラウザでトークン発行
#    https://mirelplatform.example.com/settings/tokens
#    → "mirel-cli-token" という名前でトークン生成
#    → "mpl_abc123xyz..." というトークンをコピー

# 2. CLIでトークン設定
mirel auth:token mpl_abc123xyz...

# または環境変数
export MIREL_API_TOKEN=mpl_abc123xyz...
```

**実装例**:

```typescript
// packages/cli/src/commands/auth/token.ts
import { Command, Args } from '@oclif/core';
import { saveToken } from '../../core/auth.js';

export default class AuthToken extends Command {
  static description = 'APIトークンを手動設定';
  
  static args = {
    token: Args.string({
      description: 'mirelplatform APIトークン',
      required: true,
    }),
  };
  
  async run() {
    const { args } = await this.parse(AuthToken);
    
    // トークンの形式検証
    if (!args.token.startsWith('mpl_')) {
      this.error('Invalid token format. Token should start with "mpl_"');
    }
    
    // 保存
    await saveToken(args.token);
    
    this.log('✅ Token saved successfully');
  }
}
```

### 3. 環境変数方式（CI/CD向け）

```bash
# GitHub Actions
- name: Run mirel command
  env:
    MIREL_API_TOKEN: ${{ secrets.MIREL_API_TOKEN }}
  run: |
    mirel promarker:generate --template my-template
```

```typescript
// packages/cli/src/core/auth.ts
export async function loadToken(): Promise<string | null> {
  // 1. 環境変数を最優先
  if (process.env.MIREL_API_TOKEN) {
    return process.env.MIREL_API_TOKEN;
  }
  
  // 2. キーチェーン
  // 3. ファイル
  // ...
}
```

## トークン保存方式

### 優先順位

1. **環境変数** `MIREL_API_TOKEN` （最優先）
2. **OSキーチェーン** （推奨）
3. **ファイル** `~/.mirel/credentials` （フォールバック）

### 実装: セキュアなトークン管理

```typescript
// packages/cli/src/core/auth.ts
import keytar from 'keytar';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { chmod, mkdir } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

const SERVICE_NAME = 'mirel-cli';
const ACCOUNT_NAME = 'api-token';
const CONFIG_DIR = join(homedir(), '.mirel');
const CREDENTIALS_FILE = join(CONFIG_DIR, 'credentials');

/**
 * トークンを安全に保存
 */
export async function saveToken(token: string): Promise<void> {
  // キーチェーンに保存を試みる
  try {
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, token);
    return;
  } catch (error) {
    // キーチェーンが使えない環境の場合、ファイルにフォールバック
  }
  
  // フォールバック: ファイルに保存（600パーミッション）
  await mkdir(CONFIG_DIR, { recursive: true });
  writeFileSync(CREDENTIALS_FILE, JSON.stringify({ token }), 'utf-8');
  await chmod(CREDENTIALS_FILE, 0o600); // 所有者のみ読み書き可能
}

/**
 * トークンを読み込み
 */
export async function loadToken(): Promise<string | null> {
  // 1. 環境変数
  if (process.env.MIREL_API_TOKEN) {
    return process.env.MIREL_API_TOKEN;
  }
  
  // 2. キーチェーン
  try {
    const token = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
    if (token) return token;
  } catch (error) {
    // キーチェーンが使えない
  }
  
  // 3. ファイル
  try {
    const data = readFileSync(CREDENTIALS_FILE, 'utf-8');
    return JSON.parse(data).token;
  } catch {
    return null;
  }
}

/**
 * トークンを削除
 */
export async function deleteToken(): Promise<void> {
  // キーチェーンから削除
  try {
    await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
  } catch {}
  
  // ファイルから削除
  try {
    unlinkSync(CREDENTIALS_FILE);
  } catch {}
}
```

## トークンの使用

### API クライアントでの利用

```typescript
// packages/cli/src/core/api-client.ts
import { loadToken } from './auth.js';

export class MirelApiClient {
  private baseUrl: string;
  
  constructor(baseUrl = 'https://mirelplatform.example.com') {
    this.baseUrl = baseUrl;
  }
  
  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = await loadToken();
    
    if (!token) {
      throw new Error('Not authenticated. Please run: mirel login');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options?.headers,
    };
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });
    
    if (response.status === 401) {
      throw new Error('Authentication expired. Please run: mirel login');
    }
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return response.json();
  }
}
```

## セキュリティ考慮事項

### ✅ 実施すべき対策

1. **トークンの暗号化保存**
   - OS キーチェーン利用
   - ファイル保存時は 600 パーミッション

2. **トークンの有効期限**
   - JWT に exp クレーム設定
   - リフレッシュトークン機構（将来）

3. **スコープ制限**
   - APIトークンに権限スコープを設定
   - 最小権限の原則

4. **監査ログ**
   - トークン発行履歴
   - API使用履歴

### ❌ 避けるべき実装

1. **平文保存**
   - `~/.mirel/config.json` にトークンを保存
   - ログファイルにトークンを出力

2. **トークンの再利用**
   - 古いトークンを削除せずに放置

3. **過剰な権限**
   - すべての操作を許可するトークン

## 参考実装

### GitHub CLI (`gh`)

```bash
# デバイスフロー
gh auth login

# トークン方式
gh auth login --with-token < token.txt

# 環境変数
export GH_TOKEN=ghp_...
```

### AWS CLI

```ini
# ~/.aws/credentials (600パーミッション)
[default]
aws_access_key_id = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

---

**更新日**: 2025年12月2日
