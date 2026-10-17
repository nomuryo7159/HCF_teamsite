# 新しいチームの公開サイト

のむりん・ゆきち・参加予定の1名の活動サイトです。チーム名と目的は画面から変更できます。

## 利用する機能

チーム紹介、メンバー、活動ルール、工程の期間・並び順・進捗、タスクの追加・編集・完了・担当フィルター、月別予定、週次スレッド、検索できる議事録、共有資料リンクを備えます。
全内容を公開し、登録した編集者だけが更新できます。管理者は編集メンバーを追加・解除できます。メールは公開APIには含まれず、招待メールも送信しません。

## 実行環境

Node.js 22.13以上、npm、React、Vinext、Cloudflare D1。Sitesの管理された認証・ホスティングを使用します。

1. `npm ci` で依存関係をインストールします。
2. `npm run build` でビルドします。
3. 初回だけ `node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_zippy_lila_cheney.sql` を実行し、ローカルDBを作成します。
4. ローカル専用の `.dev.vars` に `OWNER_EMAIL=seedy@sites.test` を設定します。
5. `npm run dev` を実行し、表示されたURLを開きます。ローカルの「メンバーログイン」はテスト専用アカウントです。

本番の `OWNER_EMAIL` はSitesの秘密の環境変数で設定します。実際のアドレスをソースに保存しません。本番ログインはプラットフォームが担当し、ローカルの模擬ログインは本番ビルドに含みません。

## 検証

- `node --experimental-strip-types --test tests/*.test.ts`
- `npx tsc --noEmit`
- `npm run build`

APIはサーバーでログイン・権限・Origin・入力・改訂番号を確認します。工程順序は一括で保存し、同時更新は409で拒否します。工程にタスクがある場合は工程を削除できません。先にタスクの工程を変更してください。

## 実装ガイド

ブラウザーで `/guide` を開くか、ヘッダー・共有資料欄の「実装ガイド」から閲覧できます。起動手順、設計、検索できるファイル一覧、説明のタブ切り替え、コマンドのコピーを備えます。内容は `app/guide/content.ts`、画面は `app/guide/guide.tsx` で管理します。

## データ

公開データは `records`、非公開の編集許可は `editors` に保存します。ローカルDBと本番DBは独立しています。テスト用の記録は本番に送信しません。ファイルそのもののアップロードやSlack・Driveの自動同期は含まず、共有URLを登録します。

## 設計と公開

`docs/referent-table.md` に実装前の対象・用語の対応表、`docs/superpowers/` に承認済み設計と実装計画があります。ソースは作業ブランチ `feat/team-site` で管理します。公開はSitesの公式ソース保存・パッケージ・デプロイ手順を使用します。
