# 国会ノート

10のテーマから国会の発言を探し、会議を質問と答弁の会話の形で読めるようにするアプリ。

## 必要な環境

- Node.js：`package.json` の `engines` の版
- pnpm：`package.json` の `packageManager` の版

## 起動方法

```sh
pnpm install
cp .env.example .env.local
pnpm dev
```

http://localhost:5173/kokkai-note/

## コマンド

| コマンド | 内容 |
| --- | --- |
| `pnpm dev` | 開発サーバーを起動する |
| `pnpm build` | 本番用にビルドする |
| `pnpm start` | ビルドした結果を本番と同じ状態で動かす |
| `pnpm lint` | ESLint を実行する |
| `pnpm typecheck` | 型検査を実行する |
| `pnpm test` | 単体テストを実行する |
| `pnpm test:e2e` | E2Eテストを実行する |
| `pnpm format` | 書式を整える |

## 環境変数

| 名前 | 内容 |
| --- | --- |
| `VITE_KOKKAI_API_BASE` | 国会会議録検索システムの検索用APIのベースURL |
