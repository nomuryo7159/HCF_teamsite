import Link from 'next/link';
import GiftiaDetail from './giftia-detail';
import GiftiaArchitecture from './giftia-architecture';
import GiftiaChatbot from './giftia-chatbot';
import GiftiaPostPurchase from './giftia-post-purchase';
import { GiftiaScope, GiftiaVerification } from './giftia';

const sections = [
  ['giftia-scope', '今回の実装範囲'],
  ['giftia-setup', '開発環境の準備'],
  ['giftia-github', 'GitHubでの作業の流れ'],
  ['giftia-architecture', 'アーキテクチャ'],
  ['giftia-order', '担当と作る順番'],
  ['giftia-br01', '検索結果から購入判断まで（BR-01）'],
  ['giftia-survey', '購入後アンケート（BR-02）'],
  ['giftia-coupon', 'クーポン付与（BR-03）'],
  ['giftia-files', 'ファイル一覧'],
  ['giftia-verification', '動作確認と施策の検証'],
] as const;

const setup = [
  ['共通', '班のAzure MySQLと開発用データを用意する。接続情報の受け渡し方法は未決定。'],
  ['各自', 'Git、Python 3.10以上、Node.jsとnpmを準備し、リポジトリを取得する。班でそろえるバージョンは未決定。'],
  ['各自', '接続設定を行い、APIと画面を起動して検索を試す。'],
];

const workflow = [
  ['最新を取り込む', 'Sourcetree', 'ローカルの main に切り替え、ツールバーの「プル」で取得元に origin、ブランチに main を選ぶ。'],
  ['ブランチを作る', 'Sourcetree', '最新の main から「ブランチ」で作業ブランチを作成し、作成したブランチに切り替える。'],
  ['変更して確かめる', 'ブラウザー・Sourcetree', '変更した機能をブラウザーで試し、Sourcetreeのファイルステータスで差分を確認する。'],
  ['コミットする', 'Sourcetree', '対象ファイルをステージし、変更内容が分かるメッセージを入力して「コミット」を選ぶ。'],
  ['プッシュする', 'Sourcetree', '「プッシュ」で origin を選び、ローカルとリモートの両方に作業ブランチを指定する。'],
  ['PRを作る', 'GitHub', '「Compare & pull request」などから、base に main、compare に作業ブランチを指定する。目的、変更内容、確認方法を書いてPRを作成する。レビューとマージもGitHubで行う。'],
  ['マージ後に更新する', 'Sourcetree', 'ローカルの main に切り替え、origin の main をプルする。'],
];

const modules = [
  { title: '既存検索とデータの確認', reason: 'レビュー表示の実装に先立ち、検索で取得できる項目を把握する。', detail: '検索条件、レビューとシーンの対応、商品説明の取得可否を調べる。', check: 'APIと画面を起動し、条件に合う商品が返ることを確かめる。' },
  { title: '検索結果の整理・レビュー表示・AI補足（BR-01）', reason: '候補商品の取得後に、送別シーンの判断材料を表示する。', detail: '検索結果の商品IDから商品説明とレビューを取得できることが前提。関連度、同順位、表示件数、レビュー不足の条件は未決定。', check: 'レビューのある商品と少ない商品で表示を確かめる。' },
  { title: '購入後アンケート（BR-02）', reason: '回答を集め、次の購入者の判断材料にする。', detail: '購入との紐づけ、設問、回答の公開条件は未決定。', check: '回答が対象の購入に紐づき、保存されることを確かめる。' },
  { title: '5%オフクーポン（BR-03）', reason: '回答完了を判定できるようになってから付与する。', detail: '回答の保存を先に確定し、失敗時は発行だけを再試行する。配布方法、有効期限、発行元は未決定。', check: '回答完了時に付与され、同じ回答の再送で重複しないことを確かめる。' },
];

const rootFiles = [
  ['README.md', '班の開発ルールと参照先。', 'レビューとマージのルールは未決定。', '作業前に班の最新ルールを確認する。'],
  ['AGENTS.md', 'AIを使って開発するときのルール。', '画面側の指示は giftia-frontend/AGENTS.md も確認する。', '変更内容がリポジトリのルールに沿うか確認する。'],
];

const backendFiles = [
  ['.env.example', 'API側の環境変数の設定例。', '実際の接続情報は backend/.env に置く。', '接続情報がコミット対象に含まれていないことを確認する。'],
  ['main.py', '検索APIとDB接続確認APIの入口。', '検索条件と順位付けを確認する。現行は商品評価の降順で、同評価は商品ID順。', 'Swagger UIで GET /api/search を試す。'],
  ['database.py', 'Azure MySQLへの接続と読み取り。', '接続情報は backend/.env から読み込む。', 'GET /api/health で接続を確かめる。'],
  ['requirements.txt', 'API側のPython依存関係。', '仮想環境に依存関係を導入する。', 'APIを起動できることを確かめる。'],
];

const frontendFiles = [
  ['package.json / package-lock.json', '画面の起動・ビルド・lintのコマンドと依存関係。', '依存関係の導入は giftia-frontend で npm ci を使う。', 'npm run build でビルドを確認する。'],
  ['next.config.ts', 'Next.jsの設定。', '画面の開発・ビルド設定を変更するときに確認する。', '開発起動とビルドを確認する。'],
];

const appFiles = [
  ['layout.tsx', '全ページ共通のレイアウト。', '共通の表示設定を変更するときに確認する。', '検索画面が開くことを確認する。'],
  ['globals.css / page.module.css', '全体と検索画面のスタイル。', '共通の指定と画面固有の指定の場所を確認する。', 'PC幅とスマートフォン幅で表示を確認する。'],
  ['page.tsx', '検索条件の入力、結果一覧、検索失敗時の表示。', '既存の検索条件と結果の状態を確認する。', '画面で条件を変更し、検索結果が更新されるかを見る。'],
  ['ResultCard.tsx', '検索結果の商品カード。', '商品情報の表示箇所を確認する。レビューの表示形式は未決定。', '商品名、価格、評価が表示されるかを見る。'],
];

function FileDetails({ files }: { files: string[][] }) {
  return (
    <ul>
      {files.map(([name, role, hint, check]) => (
        <li key={name}>
          <GiftiaDetail label={<code>{name}</code>} title={name}>
            <h3>概要</h3><p>{role}</p>
            <h3>実装のヒント</h3><p>{hint}</p>
            <h3>確認方法</h3><p>{check}</p>
          </GiftiaDetail>
          <span className="giftia-status">既存</span>
        </li>
      ))}
    </ul>
  );
}

function SetupDetails({ windows }: { windows: boolean }) {
  return (
    <GiftiaDetail label={windows ? '手順を開く（Windows）' : '手順を開く（Mac）'} title={windows ? 'Windowsの開発環境' : 'Macの開発環境'}>
      <h3>リポジトリを取得する</h3>
      <pre><code>{'git clone https://github.com/HealthCareFirst/giftia-frontend-backend.git\ncd giftia-frontend-backend'}</code></pre>
      <h3>ターミナル1でAPIを起動する</h3>
      <pre><code>{windows
        ? 'cd backend\npy -m venv .venv\n.\\.venv\\Scripts\\Activate.ps1\npython -m pip install -r requirements.txt'
        : 'cd backend\npython3 -m venv .venv\nsource .venv/bin/activate\npython -m pip install -r requirements.txt'}</code></pre>
      <p><code>backend/.env</code> に <code>DB_HOST</code>、<code>DB_USER</code>、<code>DB_PASSWORD</code>、<code>DB_NAME</code>、<code>CORS_ORIGINS=http://localhost:3000</code> を設定します。必要に応じて <code>DB_PORT</code> と <code>DB_SSL_CA</code> も設定します。接続情報とAPIキーはサーバー側の環境変数で管理します。</p>
      <pre><code>python -m uvicorn main:app --reload</code></pre>
      <p><code>http://localhost:8000/api/health</code> でDB接続を確認し、<code>http://localhost:8000/docs</code> で検索APIを試します。</p>
      <h3>ターミナル2で画面を起動する</h3>
      <p>リポジトリのルートから実行します。</p>
      <pre><code>{'cd giftia-frontend\nnpm ci\nnpm run dev'}</code></pre>
      <p><code>http://localhost:3000</code> を開き、検索します。接続できないときはAPIの起動、DB接続、<code>CORS_ORIGINS</code> を順に確認します。</p>
    </GiftiaDetail>
  );
}

export default function GiftiaDevelopment() {
  return (
    <>
      <nav aria-label="Giftia実装ガイドの目次">
        {sections.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
      </nav>
      <GiftiaScope />

      <section id="giftia-setup">
        <h2>開発環境の準備</h2>
        <div className="guide-table-wrap"><table className="guide-table">
          <thead><tr><th scope="col">段</th><th scope="col">誰が</th><th scope="col">内容</th></tr></thead>
          <tbody>{setup.map(([who, task], index) => <tr key={task}><th scope="row">{index + 1}</th><td>{who}</td><td>{task}</td></tr>)}</tbody>
        </table></div>
        <div className="giftia-actions"><SetupDetails windows={false} /><SetupDetails windows /></div>
      </section>

      <section id="giftia-github">
        <h2>GitHubでの作業の流れ</h2>
        <p>ブランチの作成、コミット、プル、プッシュはSourcetreeで行います。PRはGitHubの画面で扱います。ボタン名はOSや表示言語によって異なる場合があります。</p>
        <div className="guide-table-wrap"><table className="guide-table">
          <thead><tr><th scope="col">手順</th><th scope="col">操作する場所</th><th scope="col">操作内容</th></tr></thead>
          <tbody>{workflow.map(([step, tool, instruction], index) => <tr key={step}><th scope="row">{index + 1}. {step}</th><td>{tool}</td><td>{instruction}</td></tr>)}</tbody>
        </table></div>
        <h3>困ったとき</h3>
        <p>現在のブランチはSourcetreeのサイドバーの「ブランチ」で確認できます。main で変更を始めた場合は、コミット前に main の現在位置から作業ブランチを作成して切り替え、変更が引き継がれたことを確認します。</p>
        <p>ブランチ命名規則、レビューの最低基準、マージ担当、保護設定の担当は未決定です。班のルールはREADMEと <code>AGENTS.md</code> を参照してください。 <a href="https://github.com/HealthCareFirst/giftia-frontend-backend">Giftia開発リポジトリ</a></p>
      </section>

      <GiftiaArchitecture />

      <section id="giftia-order">
        <h2>担当と作る順番（案）</h2>
        <div className="guide-table-wrap"><table className="guide-table">
          <thead><tr><th scope="col">順</th><th scope="col">モジュール（クリックで説明）</th><th scope="col">担当</th><th scope="col">この順で作る理由</th></tr></thead>
          <tbody>{modules.map(({title, reason, detail, check}, index) => (
            <tr key={title}><th scope="row">{index + 1}</th><td>
              <GiftiaDetail label={title} title={title}>
                <h3>実装前に決めること・確認すること</h3><p>{detail}</p>
                <h3>動作の確認方法</h3><p>{check}</p>
              </GiftiaDetail>
            </td><td>未決定</td><td>{reason}</td></tr>
          ))}</tbody>
        </table></div>
        <p>要件定義書の第1章ではBR-01〜03が実装範囲です。第3〜4章にはBR-04を参照する機能が残っており、機能要件ID（FR）と要求ID（BR）の対応は未決定です。</p>
      </section>

      <GiftiaChatbot />
      <GiftiaPostPurchase />

      <section id="giftia-files">
        <h2>ファイル一覧（フォルダ構成）</h2>
        <p>ファイル名を選ぶと、役割・実装のヒント・確認方法を読めます。「既存」は開発リポジトリのmainで確認したファイルです。</p>
        <h3>既存の主なファイル（main · 6f4eb14）</h3>
        <FileDetails files={rootFiles} />
        <ul className="giftia-tree">
          <li><code>backend/</code><FileDetails files={backendFiles} /></li>
          <li><code>giftia-frontend/</code>
            <ul>
              <li><FileDetails files={frontendFiles} /></li>
              <li><code>app/</code><FileDetails files={appFiles} />
                <ul><li><code>api/search/route.ts</code><span className="giftia-status">空ファイル</span></li></ul>
              </li>
              <li><code>public/</code>　ロゴなどの画像素材</li>
              <li><code>lib/</code><FileDetails files={[[ 'api.ts', '検索条件を組み立ててFastAPIを呼び出す。', '既定の接続先は http://localhost:8000。', '検索条件とAPIへの送信内容が一致することを確かめる。' ]]} /></li>
            </ul>
          </li>
        </ul>
        <h3>機能を追加するときの配置例（未決定）</h3>
        <div className="guide-table-wrap"><table className="guide-table">
          <thead><tr><th scope="col">場所</th><th scope="col">置く処理・変更内容</th></tr></thead>
          <tbody>
            <tr><th scope="row"><code>giftia-frontend/app/ResultCard.tsx</code>・<code>lib/api.ts</code></th><td>既存ファイルを拡張してレビューと補足を表示し、APIの応答項目を受け取る。</td></tr>
            <tr><th scope="row"><code>giftia-frontend/app/survey/page.tsx</code></th><td>購入後アンケートの入力・送信・付与結果の表示を担当する画面の例。</td></tr>
            <tr><th scope="row"><code>backend/main.py</code>・<code>backend/services/</code></th><td>既存の <code>main.py</code> にAPIの入口を置く。回答保存やクーポン付与の処理が増えた段階で <code>services/</code> に分ける案。</td></tr>
            <tr><th scope="row"><code>backend/product_evidence.py</code></th><td><a href="#giftia-shared-evidence">検索とチャットが共用する取得処理</a>の配置例。商品説明、レビュー本文、出典IDを取得する。</td></tr>
            <tr><th scope="row"><code>backend/migrations/</code>・<code>backend/tests/</code></th><td>スキーマ変更のSQLと、レビュー不足・重複送信などを確かめるテストの置き場所の例。</td></tr>
          </tbody>
        </table></div>
        <p>チャット固有の変更は <a href="#giftia-chatbot-files">チャットの修正・追加ファイル</a> を参照してください。パスと分割単位は例です。DBの変更内容は要件定義書の第5章と <Link href="/er">GiftiaのER図</Link> を参照し、実装時に決めます。</p>
        <p><a href="https://docs.google.com/document/d/11c8bgBn7rv1tJakj185P-9IZt4PQ-Xo-/edit">Giftia 要件定義書</a> · <a href="https://bts-tech0.netlify.app/guide.html">構成と表記の参考にした実装ガイド</a></p>
      </section>
      <GiftiaVerification />
    </>
  );
}
