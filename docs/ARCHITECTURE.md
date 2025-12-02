# mirelplatform-cli アーキテクチャ設計

## 概要

**mirelplatform-cli** は、mirelplatform（汎用業務アプリケーションプラットフォーム）の**利用者向け**CLIツールです。プラットフォームが提供するAPI（主にProMarkerのコード生成機能）をコマンドラインから操作します。

## システム構成

```
┌─────────────────────────────────────────────┐
│  mirelplatform (サーバー/SaaS)              │
│  ├── Spring Boot Backend                    │
│  ├── React Frontend                         │
│  └── API Endpoints                          │
│      ├── /apps/mste/api/*  (ProMarker)      │
│      ├── /commons/upload                    │
│      └── /commons/download                  │
└─────────────────────────────────────────────┘
                     ↑
                     │ HTTPS (JWT認証)
                     ↓
┌─────────────────────────────────────────────┐
│  mirelplatform-cli (このリポジトリ)        │
│  ├── CLI Commands                           │
│  ├── API Client                             │
│  └── Authentication                         │
└─────────────────────────────────────────────┘
```

## パッケージ構成

```
mirelplatform-cli/
├── packages/
│   ├── cli/                    # コアCLI
│   │   ├── src/
│   │   │   ├── commands/       # CLIコマンド
│   │   │   │   ├── login.ts              # 認証
│   │   │   │   ├── logout.ts
│   │   │   │   ├── config.ts             # 設定管理
│   │   │   │   ├── version.ts            # ✅ 実装済み
│   │   │   │   └── platform/
│   │   │   │       └── doctor.ts         # ✅ 実装済み
│   │   │   ├── core/           # コア機能
│   │   │   │   ├── auth.ts               # 認証ロジック
│   │   │   │   ├── api-client.ts         # APIクライアント
│   │   │   │   └── config-manager.ts     # 設定管理
│   │   │   └── api/            # プラグイン向けAPI
│   │   │       └── index.ts              # 公開API
│   │   └── package.json
│   │
│   ├── shared/                 # 共通ユーティリティ
│   │   ├── src/
│   │   │   ├── logger.ts                 # ✅ 実装済み
│   │   │   └── http-client.ts            # HTTP通信
│   │   └── package.json
│   │
│   └── plugin-promarker/       # ProMarkerプラグイン
│       ├── src/
│       │   ├── commands/
│       │   │   └── promarker/
│       │   │       ├── list.ts           # テンプレート一覧
│       │   │       ├── generate.ts       # コード生成
│       │   │       ├── download.ts       # ダウンロード
│       │   │       └── dev/              # ローカル開発用
│       │   │           ├── init.ts       # ローカルテンプレート初期化
│       │   │           └── generate.ts   # ローカル生成テスト
│       │   └── core/
│       │       ├── template.ts           # テンプレート処理
│       │       └── workspace.ts          # ワークスペース管理
│       └── package.json
│
├── docs/                       # ドキュメント
└── templates/                  # サンプルテンプレート
```

## 主要コンポーネント

### 1. 認証システム

**目的**: プラットフォームAPIへの安全なアクセス

**認証フロー**:
1. OAuth2 デバイスフロー（ブラウザ認証）
2. APIトークン方式（マニュアル設定）
3. 環境変数（CI/CD向け）

**トークン保存**:
- 優先: OS キーチェーン（macOS Keychain / Windows Credential Manager / Linux Secret Service）
- フォールバック: `~/.mirel/credentials` (600パーミッション)
- 環境変数: `MIREL_API_TOKEN`

### 2. API クライアント

**責務**: プラットフォームAPIとの通信

**主要機能**:
- JWT認証ヘッダー自動付与
- エラーハンドリング
- リトライロジック
- レスポンスパース

### 3. 設定管理

**設定ファイル**: `~/.mirel/config.json`

**保存内容**:
- APIエンドポイントURL
- ユーザー情報
- CLI設定（カラー出力、詳細モードなど）

**トークンは保存しない**（セキュリティのため別管理）

### 4. プラグインシステム

**設計思想**: 薄いコア + プラグイン拡張

**コアの責務**:
- 認証
- 設定管理
- 環境診断
- プラグインAPI提供

**プラグインの責務**:
- 機能別コマンド実装
- APIクライアント利用
- ドメイン固有ロジック

## 技術スタック

### 言語・ランタイム
- TypeScript 5.6+
- Node.js 18+
- ESM (ES Modules)

### CLIフレームワーク
- oclif v4

### 主要ライブラリ
- `cosmiconfig` - 設定ファイル検索
- `zod` - スキーマバリデーション
- `keytar` - セキュアな認証情報保存
- `giget` - テンプレートダウンロード（ローカル開発用）

### HTTP通信
- `fetch` API (Node.js 18+)
- または `axios`

## 設計原則

### 1. セキュリティファースト
- トークンは平文で保存しない
- 最小権限の原則
- 環境変数サポート

### 2. プラグイン拡張性
- コアは薄く保つ
- プラグインから公開APIを利用可能
- oclif の plugin システム活用

### 3. 開発者体験（DX）
- 明確なエラーメッセージ
- 進捗表示
- カラー出力
- 対話型プロンプト

### 4. オフライン対応
- ローカル開発機能（ProMarker）
- キャッシュ機能
- グレースフルなエラー

## ユースケース

### A. リモート利用（本番）

```bash
# 認証
mirel login

# テンプレート一覧
mirel promarker:list

# コード生成
mirel promarker:generate --template spring-boot-api --params config.json

# ダウンロード
mirel promarker:download <job-id> --output ./generated
```

### B. ローカル開発（ステンシル作成者）

```bash
# ローカルテンプレートプロジェクト初期化
mirel promarker:dev:init --name my-template

# ローカルでテスト生成
mirel promarker:dev:generate --template ./my-template --params test.json

# ワークスペース管理
mirel promarker:dev:workspace list
```

## リリース戦略

### バージョニング
- Semantic Versioning (semver)
- コア: `@vemijp/mirelplatform-cli`
- プラグイン: `@vemijp/mirel-*`

### 配布
- npm registry: `npmjs.com`
- バイナリ: GitHub Releases（将来）

### 互換性
- API バージョニング
- プラグイン互換性保証
- 非推奨機能の段階的廃止

## 参考実装

### 類似CLI
- `gh` (GitHub CLI) - OAuth2デバイスフロー、keytar使用
- `vercel` - トークン保存、API クライアント
- `aws` - 設定ファイル、プロファイル管理
- `heroku` - プラグインシステム

---

**更新日**: 2025年12月2日
**バージョン**: v0.1.0 (アルファ版)
