# 実装ギャップ分析 (GAP Analysis)

## 現状 vs あるべき姿

| 機能カテゴリ | 現在の実装 | あるべき姿 | 優先度 | ステータス |
|-------------|-----------|-----------|--------|----------|
| **認証** | ❌ なし | ✅ OAuth2デバイスフロー + APIトークン | 🔴 High | 未実装 |
| **API クライアント** | ❌ なし | ✅ JWT認証付きHTTPクライアント | 🔴 High | 未実装 |
| **設定管理** | ⚠️ 最小実装 | ✅ config.json + セキュアなトークン管理 | 🔴 High | 要改善 |
| **環境診断** | ✅ 実装済み | ✅ 実装済み | 🟢 Low | 完了 |
| **バージョン表示** | ✅ 実装済み | ✅ 実装済み | 🟢 Low | 完了 |
| **ProMarker: リスト** | ⚠️ デモ実装 | ✅ API連携でテンプレート一覧取得 | 🟡 Medium | 要改善 |
| **ProMarker: 生成** | ⚠️ ローカルのみ | ✅ リモートAPI + ローカル両対応 | 🔴 High | 要改善 |
| **ProMarker: ダウンロード** | ❌ なし | ✅ 生成結果のダウンロード | 🟡 Medium | 未実装 |
| **ProMarker: ローカル開発** | ⚠️ 部分実装 | ✅ テンプレート開発サポート | 🟡 Medium | 要改善 |

---

## 詳細ギャップ分析

### 1. 認証機能

#### 現状
```typescript
// 認証機能なし
// API呼び出しは未実装
```

#### あるべき姿
```typescript
// packages/cli/src/commands/login.ts
export default class Login extends Command {
  async run() {
    // OAuth2デバイスフロー実装
    // ブラウザ起動
    // ポーリング
    // トークン保存
  }
}

// packages/cli/src/commands/logout.ts
export default class Logout extends Command {
  async run() {
    // トークン削除
  }
}

// packages/cli/src/commands/auth/token.ts
export default class AuthToken extends Command {
  async run() {
    // 手動トークン設定
  }
}
```

#### 必要な作業
- [ ] `login.ts` コマンド実装
- [ ] `logout.ts` コマンド実装
- [ ] `auth/token.ts` コマンド実装
- [ ] `core/auth.ts` 実装（keytar使用）
- [ ] 依存関係追加: `keytar`, `open`
- [ ] サーバー側API実装（別リポジトリ）

---

### 2. API クライアント

#### 現状
```typescript
// APIクライアントなし
// HTTP通信の実装なし
```

#### あるべき姿
```typescript
// packages/cli/src/core/api-client.ts
export class MirelApiClient {
  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // JWT自動付与
    // エラーハンドリング
    // リトライロジック
  }
  
  async listTemplates() { /* ... */ }
  async generateCode(templateId, params) { /* ... */ }
  async downloadFile(fileId) { /* ... */ }
}
```

#### 必要な作業
- [ ] `core/api-client.ts` 実装
- [ ] エラーハンドリング
- [ ] リトライロジック
- [ ] レスポンス型定義
- [ ] テスト作成

---

### 3. 設定管理

#### 現状
```typescript
// packages/cli/src/config/loadConfig.ts
export async function loadConfig(cwd = process.cwd()): Promise<MirelConfig> {
  const explorer = cosmiconfig('mirel');
  const result = await explorer.search(cwd);
  // プロジェクト固有の設定を読み込み
}
```

**問題点**:
- プロジェクトローカルの設定を読み込んでいる
- グローバル設定（`~/.mirel/config.json`）が未対応
- トークン管理なし

#### あるべき姿
```typescript
// packages/cli/src/core/config-manager.ts
export function loadGlobalConfig(): GlobalConfig {
  // ~/.mirel/config.json を読み込み
  // apiUrl, user情報など
}

export function saveGlobalConfig(config: GlobalConfig): void {
  // ~/.mirel/config.json に保存
}

// packages/cli/src/core/auth.ts
export async function saveToken(token: string): Promise<void> {
  // keychain or ~/.mirel/credentials (600)
}

export async function loadToken(): Promise<string | null> {
  // 環境変数 > keychain > file
}
```

#### 必要な作業
- [ ] `core/config-manager.ts` 実装（グローバル設定）
- [ ] 既存の `config/loadConfig.ts` を整理（プロジェクトローカル設定）
- [ ] `config/schema.ts` 更新（templates削除、workspace簡素化）
- [ ] `core/auth.ts` 実装（トークン管理）

---

### 4. ProMarker コマンド

#### 現状: `promarker:list`
```typescript
// packages/plugin-promarker/src/commands/promarker/list.ts
export default class PromarkerList extends Command {
  async run() {
    const items = [
      'github:vemikrs/promarker-app',
      'github:vemikrs/promarker-minimal'
    ];
    items.forEach(i => this.log(`- ${i}`));
  }
}
```

**問題点**: ハードコードされたリスト

#### あるべき姿
```typescript
export default class PromarkerList extends Command {
  async run() {
    const client = new MirelApiClient();
    const templates = await client.listTemplates();
    
    templates.forEach(t => {
      this.log(`${t.name.padEnd(20)} ${t.description}`);
    });
  }
}
```

#### 必要な作業
- [ ] API連携実装
- [ ] レスポンス型定義
- [ ] エラーハンドリング
- [ ] オフライン対応（キャッシュ）

---

#### 現状: `promarker:new`
```typescript
// packages/plugin-promarker/src/commands/promarker/new.ts
export default class PromarkerNew extends Command {
  async run() {
    await resolveTemplate(flags.template, { targetDir: flags.name });
    this.log(`Created ${flags.name}`);
  }
}
```

**問題点**: gigetでGitHubからダウンロードしているが、実際はAPI経由で生成すべき

#### あるべき姿（2つのコマンドに分離）

**A. リモート生成**: `promarker:generate`
```typescript
export default class PromarkerGenerate extends Command {
  async run() {
    const client = new MirelApiClient();
    
    // 1. API経由でコード生成ジョブを開始
    const job = await client.generateCode(templateId, params);
    
    // 2. ジョブ完了を待つ
    this.log('Generating code...');
    await pollJobStatus(job.id);
    
    // 3. ダウンロード
    await client.downloadFile(job.outputId, outputDir);
    
    this.log(`✅ Generated code saved to ${outputDir}`);
  }
}
```

**B. ローカル開発**: `promarker:dev:init`（既存のnewを改名）
```typescript
export default class PromarkerDevInit extends Command {
  async run() {
    // ローカルでテンプレートプロジェクトを初期化
    await resolveTemplate(flags.template, { targetDir: flags.name });
  }
}
```

#### 必要な作業
- [ ] `promarker:generate` コマンド新規作成
- [ ] `promarker:download` コマンド新規作成
- [ ] 既存の `promarker:new` を `promarker:dev:init` に改名
- [ ] ジョブポーリング実装
- [ ] 進捗表示

---

### 5. ローカル開発機能

#### 現状
```typescript
// packages/cli/src/core/template.ts
export async function resolveTemplate(source: string, opts: Options) {
  await downloadTemplate(source, { dir: target });
}

// packages/cli/src/core/workspace.ts
export function detectWorkspaceRoot(cwd = process.cwd()) {
  // pnpm-workspace.yaml を検出
}
```

**問題点**: CLI本体にあるが、ProMarker固有の機能

#### あるべき姿

**移動先**: `packages/plugin-promarker/src/core/`

```typescript
// packages/plugin-promarker/src/core/template.ts
export async function resolveTemplate(source, opts) {
  // 既存の実装をそのまま移動
}

// packages/plugin-promarker/src/core/workspace.ts
export function detectWorkspaceRoot(cwd) {
  // 既存の実装をそのまま移動
}
```

#### 必要な作業
- [ ] `cli/src/core/template.ts` → `plugin-promarker/src/core/template.ts` 移動
- [ ] `cli/src/core/workspace.ts` → `plugin-promarker/src/core/workspace.ts` 移動
- [ ] インポートパス更新
- [ ] API経由でも利用できるよう `cli/src/api/index.ts` に再エクスポート

---

### 6. 不要な機能・依存関係

#### 削除対象

| ファイル/依存関係 | 理由 | 影響 |
|------------------|------|------|
| `cli/src/commands/init.ts` | ProMarker固有機能 | `promarker:dev:init`に改名・移動 |
| `cli/package.json`: `prompts` | init削除で不要 | 削除可能 |
| `cli/package.json`: `giget` | プラグインに移動 | `plugin-promarker`に移動 |
| `cli/src/core/plugin.ts` の固定リスト | 動的検出に変更 | 要改善 |

#### 必要な作業
- [ ] `init.ts` 削除（移動先: `promarker:dev:init`）
- [ ] `prompts` 依存削除
- [ ] `giget` を promarker に移動

---

## 実装優先順位

### フェーズ1: 基盤構築（最優先）

1. **認証システム**
   - [ ] `core/auth.ts` 実装（keytar）
   - [ ] `commands/login.ts` 実装
   - [ ] `commands/logout.ts` 実装
   - [ ] `commands/auth/token.ts` 実装
   - **依存関係**: `keytar@^7.9.0`, `open@^10.0.0`

2. **API クライアント**
   - [ ] `core/api-client.ts` 実装
   - [ ] エラーハンドリング
   - [ ] 型定義

3. **設定管理**
   - [ ] `core/config-manager.ts` 実装（グローバル）
   - [ ] `config/schema.ts` 整理

**完了条件**: `mirel login` → `mirel config show` が動作

---

### フェーズ2: ProMarker API連携

1. **テンプレート一覧**
   - [ ] `promarker:list` をAPI連携に変更

2. **コード生成**
   - [ ] `promarker:generate` 新規作成
   - [ ] ジョブポーリング
   - [ ] 進捗表示

3. **ダウンロード**
   - [ ] `promarker:download` 新規作成

**完了条件**: `mirel promarker:generate` でリモート生成が動作

---

### フェーズ3: ローカル開発機能整理

1. **機能移動**
   - [ ] `template.ts`, `workspace.ts` を promarker に移動
   - [ ] `init` を `promarker:dev:init` に改名

2. **クリーンアップ**
   - [ ] 不要な依存関係削除
   - [ ] ドキュメント更新

**完了条件**: コア・プラグインの責務が明確に分離

---

## 依存関係の変更

### 追加

| パッケージ | バージョン | 用途 | 対象 |
|-----------|----------|------|------|
| `keytar` | ^7.9.0 | トークン保存 | cli |
| `open` | ^10.0.0 | ブラウザ起動 | cli |

### 移動

| パッケージ | 移動元 | 移動先 |
|-----------|--------|--------|
| `giget` | cli | plugin-promarker |
| `prompts` | cli | （削除） |

### 削除

| パッケージ | 理由 |
|-----------|------|
| `prompts` | init コマンド削除で不要 |

---

## テスト計画

### ユニットテスト

- [ ] `core/auth.ts`: トークン保存・読み込み・削除
- [ ] `core/api-client.ts`: API通信、エラーハンドリング
- [ ] `core/config-manager.ts`: 設定の保存・読み込み

### 統合テスト

- [ ] ログインフロー（モックサーバー）
- [ ] API呼び出し（モックサーバー）
- [ ] トークン有効期限切れ時の挙動

### E2Eテスト

- [ ] `mirel login` → `mirel promarker:list` → `mirel logout`
- [ ] 環境変数経由の認証

---

## サーバー側の必要実装（別リポジトリ）

### 認証API

- [ ] `POST /api/auth/device/code` - デバイスコード発行
- [ ] `POST /api/auth/device/token` - トークンポーリング
- [ ] `GET /api/auth/user` - ユーザー情報取得

### ProMarker API

- [ ] `GET /apps/mste/api/templates` - テンプレート一覧
- [ ] `POST /apps/mste/api/generate` - コード生成開始
- [ ] `GET /apps/mste/api/jobs/:id` - ジョブ状態確認
- [ ] `GET /commons/download/:fileId` - ファイルダウンロード

---

## リスクと緩和策

| リスク | 影響 | 緩和策 |
|-------|------|--------|
| keytar がインストールできない環境 | 認証不可 | ファイルベースのフォールバック実装 |
| サーバーAPIが未完成 | CLI開発停滞 | モックサーバーでの開発 |
| 既存ユーザーへの影響 | breaking change | semver major bump、移行ガイド |

---

**作成日**: 2025年12月2日  
**最終更新**: 2025年12月2日
