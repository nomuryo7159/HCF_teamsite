import Link from 'next/link';
import GiftiaDetail from './giftia-detail';

const sections = [
  ['giftia-setup', '開発環境の準備'],
  ['giftia-github', 'GitHubでの作業の流れ'],
  ['giftia-order', '担当と作る順番'],
  ['giftia-files', 'ファイル一覧（フォルダ構成）'],
  ['giftia-scope', '今回の実装範囲と検証方法'],
] as const;

const setup = [
  ['共通', '班のAzure MySQLと開発用データを用意する。接続情報の受け渡し方法は未決定。'],
  ['各自', 'Git、Python 3.10以上、Node.jsとnpmを準備し、リポジトリを取得する。班でそろえるバージョンは未決定。'],
  ['各自', '接続設定を行い、APIと画面を起動して検索を試す。'],
];

const workflow = [
  ['最新を取り込む', '左下のブランチ名で main を選び、ソース管理の「…」からプルする。', 'git switch main\ngit pull --ff-only'],
  ['ブランチを作る', '左下のブランチ名から「新しいブランチの作成」を選ぶ。', 'git switch -c feat/review-display'],
  ['変更して確かめる', '変更を保存し、ブラウザーで該当機能を確認する。', 'npm run lint\nnpm run build'],
  ['コミットする', 'ソース管理で対象ファイルの「＋」を押し、メッセージを入力してコミットする。', 'git add <変更ファイル>\ngit commit -m "feat: describe change"'],
  ['プッシュする', '「ブランチの発行」を選ぶ。', 'git push -u origin HEAD'],
  ['PRを作る', 'GitHubで main 宛てにPRを開き、目的、変更内容、確認方法を書く。', 'gh pr create --base main'],
  ['マージされたら', 'main に戻り、最新の状態を取り込む。', 'git switch main\ngit pull --ff-only'],
];

const modules = [
  { title: '既存検索とデータの確認', reason: 'レビュー表示の実装に先立ち、検索で取得できる項目を把握する。', detail: '検索条件、レビューとシーンの対応、商品説明の取得可否を調べる。', check: 'APIと画面を起動し、条件に合う商品が返ることを確かめる。' },
  { title: 'レビュー表示とAI補足（BR-01）', reason: '候補商品の取得後に、送別シーンの判断材料を表示する。', detail: '関連度、表示件数、レビュー不足の条件、AI補足の形式は未決定。', check: 'レビューのある商品と少ない商品で表示を確かめる。' },
  { title: '購入後アンケート（BR-02）', reason: '回答を集め、次の購入者の判断材料にする。', detail: '購入との紐づけ、設問、回答の公開条件は未決定。', check: '回答が対象の購入に紐づき、保存されることを確かめる。' },
  { title: '5%オフクーポン（BR-03）', reason: '回答完了を判定できるようになってから付与する。', detail: '配布方法、有効期限、重複発行の防止方法は未決定。', check: '回答完了時に付与され、同じ回答の再送で重複しないことを確かめる。' },
];

const backendFiles = [
  ['main.py', '検索APIとDB接続確認APIの入口。', '検索条件と順位付けを確認する。現行は商品評価の降順で、同評価は商品ID順。', 'Swagger UIで GET /api/search を試す。'],
  ['database.py', 'Azure MySQLへの接続と読み取り。', '接続情報は backend/.env から読み込む。', 'GET /api/health で接続を確かめる。'],
  ['requirements.txt', 'API側のPython依存関係。', '仮想環境に依存関係を導入する。', 'APIを起動できることを確かめる。'],
];

const appFiles = [
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
        <p>VS Codeの画面操作かターミナルで進めます。<code>npm</code> の確認コマンドは <code>giftia-frontend</code> で実行します。<code>gh</code> を使うにはGitHub CLIへのログインが必要です。</p>
        <div className="guide-table-wrap"><table className="guide-table">
          <thead><tr><th scope="col">手順</th><th scope="col">VS Codeの画面で操作</th><th scope="col">ターミナルで操作</th></tr></thead>
          <tbody>{workflow.map(([step, visual, command], index) => <tr key={step}><th scope="row">{index + 1}. {step}</th><td>{visual}</td><td><pre><code>{command}</code></pre></td></tr>)}</tbody>
        </table></div>
        <h3>困ったとき</h3>
        <p>現在のブランチはVS Codeの左下か <code>git status --short --branch</code> で確認できます。main で変更を始めた場合は、コミット前に作業ブランチを作ると変更を引き継げます。</p>
        <p>ブランチ命名規則、レビューの最低基準、マージ担当、保護設定の担当は未決定です。班のルールはREADMEと <code>AGENTS.md</code> を参照してください。 <a href="https://github.com/HealthCareFirst/giftia-frontend-backend">Giftia開発リポジトリ</a></p>
      </section>

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
        <h3>後の作業が使うデータと処理</h3>
        <div className="guide-table-wrap"><table className="guide-table">
          <thead><tr><th scope="col">使う側</th><th scope="col">先に必要なもの</th><th scope="col">確認先</th></tr></thead>
          <tbody>
            <tr><td>レビュー表示・AI補足</td><td>検索結果の商品ID、商品説明、商品に紐づくレビュー</td><td><a href="#giftia-files">既存の検索APIとER図</a></td></tr>
            <tr><td>購入後アンケート</td><td>回答を対象の購入に紐づける方法</td><td>未決定</td></tr>
            <tr><td>クーポン付与</td><td>アンケート回答の保存と完了判定</td><td>未決定</td></tr>
          </tbody>
        </table></div>
        <p>要件定義書の第1章ではBR-01〜03が実装範囲です。第3〜4章にはBR-04を参照する機能が残っており、機能要件ID（FR）と要求ID（BR）の対応は未決定です。</p>
      </section>

      <section id="giftia-files">
        <h2>ファイル一覧（フォルダ構成）</h2>
        <p>ファイル名を選ぶと、役割・実装のヒント・確認方法を読めます。「既存」は開発リポジトリのmainで確認したファイルです。</p>
        <p>既存の検索は、Next.jsからFastAPIに検索条件を送り、FastAPIが班のAzure MySQLから商品候補を取得します。</p>
        <ul className="giftia-tree">
          <li><code>backend/</code><FileDetails files={backendFiles} /></li>
          <li><code>giftia-frontend/</code>
            <ul>
              <li><code>app/</code><FileDetails files={appFiles} /></li>
              <li><code>lib/</code><FileDetails files={[[ 'api.ts', '検索条件を組み立ててFastAPIを呼び出す。', '既定の接続先は http://localhost:8000。', '検索条件とAPIへの送信内容が一致することを確かめる。' ]]} /></li>
            </ul>
          </li>
        </ul>
        <p>レビュー表示・アンケート・クーポンの画面パス、APIの入出力、追加ファイルの配置は未決定です。追加データの案は要件定義書の第5章と <Link href="/er">GiftiaのER図</Link> を参照してください。</p>
        <p><a href="https://docs.google.com/document/d/11c8bgBn7rv1tJakj185P-9IZt4PQ-Xo-/edit">Giftia 要件定義書</a> · <a href="https://bts-tech0.netlify.app/guide.html">構成と表記の参考にした実装ガイド</a></p>
      </section>
    </>
  );
}
