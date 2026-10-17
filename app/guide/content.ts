export const sections=[
 {id:'start',label:'開発環境と起動'},
 {id:'architecture',label:'画面とデータの流れ'},
 {id:'files',label:'ファイルごとの説明'},
 {id:'database',label:'データと編集権限'},
 {id:'workflow',label:'変更するときの順番'},
 {id:'checks',label:'動作確認と困ったとき'},
];
export const checks={tests:'node --experimental-strip-types --test tests/*.test.ts',types:'npx tsc --noEmit',build:'npm run build'};
export const migration='node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_zippy_lila_cheney.sql';
export type GuideFile={path:string;category:'画面'|'保存・API'|'認証・権限'|'検証・設定';title:string;overview:string;depends:string[];steps:string[];verify:string;command:string};
export const files:GuideFile[]=[
 {path:'app/team-site.tsx',category:'画面',title:'チームサイト全体の表示と更新',overview:'チーム情報・メンバー・予定などをAPIから読み込み、各セクションへ渡す画面です。保存に成功したらAPIの返却レコードで表示を更新します。',depends:['components/team/','/api/data','/api/session'],steps:['表示の変更は対象セクションのJSXを編集します。','登録内容の追加は、先にデータの型とAPIの入力検証をそろえます。','チーム名やメンバー名を決めるだけなら、コードではなくログイン後の画面から編集できます。'],verify:'公開時の表示、ログイン後の編集ボタン、保存結果、検索を確認します。',command:checks.types},
 {path:'components/team/editor.tsx',category:'画面',title:'追加・編集フォーム',overview:'各種類の記録に合わせて入力欄を表示します。保存中の二重操作を止め、入力エラーと削除確認を表示します。',depends:['components/team/types.ts','lib/model.ts'],steps:['対象の種類のfieldsに入力欄を追加します。','入力名をデータの型とサーバーの検証に一致させます。','必須条件と文字数上限をサーバー側とそろえます。'],verify:'新規追加・既存編集・入力エラー・削除確認を、それぞれ確認します。',command:checks.types},
 {path:'components/team/tasks.tsx',category:'画面',title:'工程・タスク・進捗',overview:'工程ごとのタスクと進捗を表示し、担当や完了状態で絞り込みます。工程の移動は並び順の一覧を一度に保存します。',depends:['components/team/timeline.tsx','/api/data','/api/phases/order'],steps:['タスクの表示と絞り込みはこのファイルで変更します。','並べ替えは全工程のIDと改訂番号を送る仕組みを維持します。','日付の期間バーはtimeline.tsxで調整します。'],verify:'完了切り替え、担当フィルター、工程の展開、連続した上・下移動を確認します。',command:checks.tests},
 {path:'components/team/calendar.tsx',category:'画面',title:'月別の予定',overview:'日本時間の当日を基準にカレンダーを表示します。月を移動し、日付を選ぶとその日の予定に絞り込めます。',depends:['components/team/types.ts','eventの記録'],steps:['日付セルと予定一覧の表示を編集します。','予定の入力項目を変える場合はeditor.tsxとlib/model.tsも合わせます。'],verify:'前月・翌月・今月への移動、日付選択の解除、予定の追加と編集を確認します。',command:checks.types},
 {path:'app/globals.css',category:'画面',title:'色・文字・余白・スマートフォン表示',overview:'朝の光、若葉、やわらかなオレンジを使った画面のスタイルです。小さい画面への切り替えと、動きを抑える設定にも対応します。',depends:['public/favicon.svg','各画面のclassName'],steps:['色はCSS変数と該当するセレクターで変更します。','本文・ボタン・入力欄の文字と背景の明暗差を確認します。','700px以下の設定も合わせて確認します。'],verify:'トップ、一覧、カレンダー、フォームを広い画面と狭い画面で確認します。',command:checks.build},
 {path:'lib/model.ts',category:'保存・API',title:'記録の種類と入力検証',overview:'チーム情報やタスクなどのデータ型、初期表示、Zodによる入力検証を定義します。日付、URL、文字数、開始・終了の順序を確認します。',depends:['zod','tests/backend.test.ts'],steps:['種類や項目を変える前に、受け取る値と必須条件を決めます。','型・スキーマ・フォームを同時に変更します。','不正な値を拒否するテストを追加して確認します。'],verify:'正しい入力が通り、不正日付・危険なURL・空の必須項目が拒否されることを確認します。',command:checks.tests},
 {path:'app/api/data/route.ts',category:'保存・API',title:'公開データの取得と保存',overview:'GETで公開用の記録を返し、POST・PATCH・DELETEで追加・変更・削除を受け付けます。更新操作では権限・Origin・入力・改訂番号を確認します。',depends:['lib/model.ts','lib/permissions.ts','lib/store.ts'],steps:['公開データと管理用のメールを混ぜないようにします。','更新処理はrequirePermissionを通してから実行します。','保存済みのレコードを返し、画面側で結果を反映します。'],verify:'匿名の閲覧ができ、未ログインの更新が拒否されることを確認します。',command:checks.tests},
 {path:'lib/store.ts',category:'保存・API',title:'D1への保存と同時更新の確認',overview:'recordsテーブルを読み書きします。更新時は改訂番号を照合し、古い内容で上書きしません。工程の並べ替えも一括で処理します。',depends:['db/schema.ts','lib/model.ts','D1のDBバインディング'],steps:['値をSQL文字列へ直接埋め込まず、パラメーターで渡します。','初期表示の初回保存と、削除後の再表示防止を維持します。','工程とタスクの参照関係、競合時の処理を確認します。'],verify:'同時更新で一方だけが保存され、タスクが属する工程の削除が拒否されることを確認します。',command:checks.tests},
 {path:'lib/permissions.ts',category:'認証・権限',title:'編集権限のサーバー側確認',overview:'プラットフォームの認証情報と、管理者の環境変数・editorsテーブルから権限を判定します。画面上のボタン表示だけに頼らず、APIで検証します。',depends:['app/chatgpt-auth.ts','lib/access.ts','editors'],steps:['OWNER_EMAILはサーバー用の環境変数にだけ設定します。','管理者専用の操作ではownerOnlyを指定します。','ログイン中でも未登録の人は編集できない状態を維持します。'],verify:'未ログイン、権限のないアカウント、編集者、管理者の違いを確認します。',command:checks.tests},
 {path:'components/team/editor-access.tsx',category:'認証・権限',title:'編集メンバーの追加・解除',overview:'管理者だけが使う編集メンバーの管理画面です。登録するメールは公開データに含めず、招待メールの送信も行いません。',depends:['/api/editors','lib/permissions.ts'],steps:['管理者だけに画面を表示します。','API側でも管理者権限を確認する仕組みを維持します。','編集権限の解除時は確認を表示します。'],verify:'管理者以外からの一覧取得と変更が拒否されることを確認します。',command:checks.tests},
 {path:'db/schema.ts',category:'保存・API',title:'データベースのテーブル定義',overview:'公開する活動記録のrecordsと、非公開の編集許可のeditorsを定義します。スキーマを変えたら新しいマイグレーションを生成します。',depends:['drizzle/','drizzle.config.ts'],steps:['変更する列と、既存データの扱いを決めます。','npm run db:generateで追加のSQLを生成し、内容を確認します。','適用済みSQLを変更せず、ローカルで確認してから本番へ適用します。'],verify:'新規DBへの適用と、既存DBへの追加適用を確認します。ローカルDBと本番DBは別です。',command:'npm run db:generate'},
 {path:'app/guide/content.ts',category:'検証・設定',title:'この実装ガイドの内容',overview:'ファイルごとの説明、変更手順、確認方法をまとめたファイルです。表示はapp/guide/guide.tsxが担当します。',depends:['app/guide/guide.tsx','app/guide/page.tsx'],steps:['コードの変更に合わせて説明と確認コマンドを更新します。','今後開発するアプリの仕様・担当は、チームで決まってから追記します。','実際のメールアドレスやAPIキーなどの接続情報は掲載しません。'],verify:'検索、分類、説明の展開、タブ切り替え、コマンドのコピーを確認します。',command:checks.build},
 {path:'tests/',category:'検証・設定',title:'入力・権限・保存処理の自動テスト',overview:'backend.test.tsで入力検証と権限、store.test.tsでSQLを使う保存・競合・工程参照を確認します。',depends:['lib/model.ts','lib/access.ts','lib/store.ts'],steps:['修正する動作に対応するテストを実行します。','失敗した場合は理由を読み、動作と期待値のどちらを直すべきか確認します。','必要な確認が終わったら型チェックとビルドを実行します。'],verify:'成功件数だけでなく、失敗・スキップがないことと終了コードを確認します。',command:checks.tests},
];
export const endpoints=[
 ['/api/data','GET','誰でも','公開用の活動記録を取得'],
 ['/api/data','POST / PATCH / DELETE','管理者・登録済み編集者','記録の追加・変更・削除'],
 ['/api/session','GET','誰でも','ログイン状態と編集可否を確認。メールは返さない'],
 ['/api/phases/order','PATCH','管理者・登録済み編集者','全工程の並び順と改訂番号を一括確認して保存'],
 ['/api/editors','GET / POST / DELETE','管理者のみ','編集者の一覧・追加・解除'],
];
