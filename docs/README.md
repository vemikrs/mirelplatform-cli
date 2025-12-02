# mirelplatform-cli ドキュメント

## 📚 目次

### 設計ドキュメント

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - 全体アーキテクチャ設計
  - システム構成
  - パッケージ構成
  - 主要コンポーネント
  - 技術スタック
  - 設計原則

- **[AUTHENTICATION.md](AUTHENTICATION.md)** - 認証設計
  - OAuth2 デバイスフロー
  - API トークン方式
  - 環境変数方式
  - トークン保存方式（keychain/ファイル）
  - セキュリティ考慮事項

- **[OAUTH2_DEVICE_FLOW.md](OAUTH2_DEVICE_FLOW.md)** - OAuth2デバイスフロー実装ガイド
  - フロー詳細図
  - CLI側実装例
  - サーバー側実装例
  - フロントエンド実装例
  - セキュリティ対策
  - GitHub CLI 参考実装

### 開発ドキュメント

- **[GAP_ANALYSIS.md](GAP_ANALYSIS.md)** - 実装ギャップ分析
  - 現状 vs あるべき姿
  - 詳細ギャップ分析（機能別）
  - 実装優先順位（フェーズ1〜3）
  - 依存関係の変更
  - テスト計画
  - リスクと緩和策

## 📖 読む順序

### はじめて読む場合

1. [ARCHITECTURE.md](ARCHITECTURE.md) - 全体像を理解
2. [AUTHENTICATION.md](AUTHENTICATION.md) - 認証の仕組みを理解
3. [GAP_ANALYSIS.md](GAP_ANALYSIS.md) - 実装状況を確認

### 実装する場合

1. [GAP_ANALYSIS.md](GAP_ANALYSIS.md) - 何を実装すべきか確認
2. [OAUTH2_DEVICE_FLOW.md](OAUTH2_DEVICE_FLOW.md) - 認証の実装方法
3. [AUTHENTICATION.md](AUTHENTICATION.md) - トークン管理の実装

## 🎯 クイックリンク

### よくある質問

**Q: mirelplatform-cli とは何ですか？**  
A: mirelplatform（汎用業務アプリケーションプラットフォーム）の利用者向けCLIツールです。主にProMarkerのコード生成機能をコマンドラインから操作します。

**Q: 認証はどうやって行いますか？**  
A: `mirel login` でブラウザ経由のOAuth2デバイスフローを使います。または `mirel auth:token` で手動設定も可能です。詳細は [AUTHENTICATION.md](AUTHENTICATION.md) を参照。

**Q: どこから実装を始めればいいですか？**  
A: [GAP_ANALYSIS.md](GAP_ANALYSIS.md) のフェーズ1（認証システム、APIクライアント、設定管理）から始めてください。

**Q: プラグインはどうやって作りますか？**  
A: [ARCHITECTURE.md](ARCHITECTURE.md) のプラグインシステムセクションと、既存の `packages/plugin-promarker` を参考にしてください。

## 🔄 更新履歴

- **2025年12月2日**: 初版作成
  - アーキテクチャ設計
  - 認証設計
  - OAuth2デバイスフロー実装ガイド
  - ギャップ分析

---

**メンテナ**: vemi/mirelplatform team  
**最終更新**: 2025年12月2日
