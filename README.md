# mirelplatform-cli

**mirelplatform** の利用者向け CLI ツール（アルファ版）

mirelplatform は汎用業務アプリケーションプラットフォームです。この CLI は、プラットフォームが提供する機能（特に ProMarker のコード生成）をコマンドラインから操作します。

## 📦 パッケージ構成

- `@vemijp/mirelplatform-cli` - コアCLI（認証、設定管理、環境診断）
- `@vemijp/mirel-promarker` - ProMarker プラグイン（コード生成）
- `@vemijp/mirel-shared` - 共通ユーティリティ（ロガー等）

## 🚀 インストール

```bash
# npm
npm install -g @vemijp/mirelplatform-cli

# pnpm
pnpm add -g @vemijp/mirelplatform-cli

# yarn
yarn global add @vemijp/mirelplatform-cli
```

## 📖 使い方

### 認証

```bash
# ブラウザ経由でログイン（OAuth2デバイスフロー）
mirel login

# APIトークンで認証
mirel auth:token <your-api-token>

# ログアウト
mirel logout
```

### ProMarker（コード生成）

```bash
# テンプレート一覧
mirel promarker:list

# コード生成
mirel promarker:generate --template spring-boot-api --params config.json

# ダウンロード
mirel promarker:download <job-id> --output ./generated
```

### ユーティリティ

```bash
# 環境診断
mirel platform:doctor

# バージョン確認
mirel version

# 設定表示
mirel config show
```

## 🔧 開発

### セットアップ

```bash
# リポジトリクローン
git clone https://github.com/vemikrs/mirelplatform-cli.git
cd mirelplatform-cli

# 依存関係インストール
pnpm install

# ビルド
pnpm build

# 開発モードで実行
pnpm dev:cli -- --help
```

### ビルド順序

依存関係の順序でビルドする必要があります：

```bash
# 1. shared
pnpm --filter @vemijp/mirel-shared run build

# 2. cli
pnpm --filter @vemijp/mirelplatform-cli run build

# 3. plugin-promarker
pnpm --filter @vemijp/mirel-promarker run build
```

または一括ビルド：

```bash
pnpm build
```

### 型チェック

```bash
pnpm typecheck
```

## 📚 ドキュメント

詳細なドキュメントは `docs/` フォルダを参照してください：

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - アーキテクチャ設計
- [AUTHENTICATION.md](docs/AUTHENTICATION.md) - 認証設計
- [OAUTH2_DEVICE_FLOW.md](docs/OAUTH2_DEVICE_FLOW.md) - OAuth2デバイスフロー実装ガイド
- [GAP_ANALYSIS.md](docs/GAP_ANALYSIS.md) - 実装ギャップ分析

## 🏗️ アーキテクチャ

```
mirelplatform-cli/
├── packages/
│   ├── cli/              # コアCLI
│   │   ├── commands/     # CLIコマンド
│   │   ├── core/         # コア機能（認証、APIクライアント）
│   │   └── api/          # プラグイン向けAPI
│   ├── shared/           # 共通ユーティリティ
│   └── plugin-promarker/ # ProMarkerプラグイン
├── docs/                 # ドキュメント
└── templates/            # サンプルテンプレート
```

**設計思想**: 薄いコア + プラグイン拡張

- コア: 認証、設定管理、環境診断
- プラグイン: 機能別コマンド実装

## 🔐 認証

トークンは安全に保存されます：

1. **環境変数** `MIREL_API_TOKEN` (最優先)
2. **OS キーチェーン** (macOS Keychain / Windows Credential Manager / Linux Secret Service)
3. **ファイル** `~/.mirel/credentials` (600 パーミッション)

## 🤝 コントリビューション

現在アルファ版開発中です。コントリビューションガイドは今後整備予定です。

## 📄 ライセンス

Copyright © 2025 vemi/mirelplatform. All rights reserved.

---

**現在のバージョン**: v0.1.0 (アルファ版)  
**対応プラットフォーム**: mirelplatform v3.3+
