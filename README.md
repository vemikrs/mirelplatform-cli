# mirelplatform-cli Monorepo (alpha)

薄いコア × プラグイン拡張で運用する CLI のモノレポひな形です。  
安定後はプラグイン/テンプレを分離していく想定。

## パッケージ
- `@vemi/mirelplatform-cli` … コアCLI（oclifベース）
- `@vemi/mirel-promarker` … 公式プラグイン例
- `@vemi/mirel-shared` … 共通ユーティリティ

## 開発
```bash
pnpm i
pnpm dev:cli -- --help
```
