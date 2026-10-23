# HCF Team Site

朝から健康的に活動するチームの公開サイトです。チーム名・目的・メンバーはログイン後の画面から変更できます。

## 機能

チーム紹介、活動ルール、工程・WBS・進捗、タスク、予定、週次スレッド、検索できる議事録、共有資料、実装ガイド（`/guide`）を備えます。公開内容は誰でも閲覧し、編集は登録したメンバーに限定します。

## 実行環境

Node.js 22.13以上、Next.js 16、React 19、Supabase、Vercel。

1. `npm ci` でパッケージをインストールします。
2. `.env.example` を `.env.local` にコピーし、利用するSupabaseプロジェクトの公開URLと公開キーを設定します。
3. 管理者が初回だけ `supabase/migrations/` 内のSQLをファイル名の順にSupabaseのSQL Editorで実行します。
4. HCF_ENROLLMENT_SECRETのSHA-256ハッシュをhcf_settingsへ登録し、管理者のメールを `public.hcf_editors` に `role='owner'` として登録します。実際のメールアドレスはGitに登録しません。
5. `npm run dev` で起動し、表示されたURLを開きます（通常 `http://127.0.0.1:5173/`）。

`.env.local` はGit無視対象です。サービスロールキーは使いません。従来のSites認証・Cloudflare D1・模擬ログインは使用しません。

同じSupabase接続先を設定したローカルと本番は、同じデータを使います。実DBの確認用SQLはトランザクション内で実行し、最後にロールバックします。

## ログイン

`/login` でメールアドレスを入力し、届いたリンクを同じブラウザーで開きます。Supabaseの認証設定に、サイトURLと `/auth/callback` のリダイレクトURLを登録します。既存プロジェクトのほかのリダイレクトURLは削除しません。

`hcf_editors` に登録され、このサイトのメール確認コールバックを完了した人だけが編集できます。管理者は画面から編集者を追加・解除できます。メールアドレスは公開APIに含めません。Supabaseの標準メール送信には制限があるため、チームの運用人数に応じてSMTP設定を確認してください。

## コマンドラインからの編集

Claude Codeやターミナルからも、登録済みの編集者として内容を変更できます。サイトと同じDB関数で保存するため、権限・入力チェック・改訂番号の照合はサイトと同じです。サービスロールキーは使いません。

```bash
npm run hcf -- login <編集者のメール>   # ログインメールを送信
npm run hcf -- verify                 # メール内のリンクを開かずにコピーし、表示に従って貼り付け
npm run hcf -- get nomurin
npm run hcf -- update nomurin '{"role":"..."}'
```

ログイン情報は `~/.config/hcf-teamsite/session.json`（本人のみ読み書き可）に保存します。リポジトリには含めません。不要になったら `npm run hcf -- logout` で削除します。

## 保存と権限

このサイトは `hcf_` 接頭辞の専用テーブル・関数だけを使用します。既存プロジェクトの無関係なテーブルは変更しません。

- `hcf_records`: 公開する活動記録。RLSで削除済みの記録を非公開にします。
- `hcf_editors`: 管理者・編集者の許可。匿名からの参照を拒否します。
- `hcf_verified_users`: このサイトでメール確認を完了したユーザーIDとメール。公開しません。
- `hcf_settings`: メール確認登録に使うサーバー秘密値のハッシュ。公開しません。
- `hcf_*` RPC: 認証済みユーザーの権限をDB側で確認してから保存します。
- 改訂番号の照合、工程参照、工程の並べ替えをトランザクションで保護します。

## 確認

```bash
npm test
npm run typecheck
npm run build
```

実DBでは `supabase/tests/hcf_transactions.sql` を実行し、RLS・権限・競合・参照・並べ替えを確認します。ファイル全体を一度に実行し、末尾のROLLBACKを省略しないでください。

## Google カレンダー連携

カレンダーには、サイトで登録した予定に加えて、Google カレンダー「チーム健康第一」の予定を「Google」ラベル付きで表示します。同期は Google → サイトの片方向です。Google の予定の追加・変更は Google カレンダー側で行い、サイト上では編集できません。

`/api/calendar` が `GOOGLE_CALENDAR_ICS_URL` の iCal を取得し、前後1年分を日本時間に変換して返します（最大5分キャッシュ）。繰り返し予定・除外日・個別に変更した回に対応します。サイトは誰でも閲覧できるため、Google の予定はタイトルと時刻だけを表示し、説明・場所・リンク（Google Meet の参加情報を含む）はサイトにも API にも出しません。公開設定を「非公開」にした予定は、タイトルも出さず「予定あり」とだけ表示します。変数が未設定ならサイトの予定だけを表示します。非公開アドレスが漏れたときは Google カレンダーで再発行し、Vercel の値を差し替えてください。

## Vercel

対象GitHubリポジトリは `nomuryo7159/HCF_teamsite`、Vercelのプロジェクト名は `hcf_teamsite` です。Application PresetはNext.js、ビルドは `npm run build`、インストールは `npm ci` を使用します。

VercelのProduction・Preview・Developmentに次の環境変数を設定します。

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `HCF_ENROLLMENT_SECRET`（サーバー専用のランダム値。公開変数にしない）
- `GOOGLE_CALENDAR_ICS_URL`（任意・サーバー専用。Google カレンダー「チーム健康第一」の設定 →「カレンダーの統合」→「iCal 形式の非公開アドレス」。知っていれば誰でも予定を読めるため公開変数にしない）

Previewからも同じDBへの編集を許可するかは、チームの運用に合わせて決めてください。Supabaseの許可済みリダイレクトURLにも対応するURLが必要です。

コードは作業ブランチで変更し、レビュー後にmainへ統合します。環境変数とローカルDB・接続情報はリポジトリへ含めません。
