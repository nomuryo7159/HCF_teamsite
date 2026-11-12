import Link from 'next/link';

const developmentSections = [
  ['giftia-setup', '開発環境の準備'],
  ['giftia-github', 'GitHubでの作業手順'],
  ['giftia-order', '担当と作る順番'],
  ['giftia-files', 'フォルダ構成と主要ファイル'],
] as const;

export default function GiftiaDevelopment() {
  return (
    <>
      <nav aria-label="Giftia開発手順の目次">
        <ul className="guide-numbered">
          {developmentSections.map(([id, title]) => <li key={id}><a href={`#${id}`}>{title}</a></li>)}
        </ul>
      </nav>

      <h3 id="giftia-setup">開発環境の準備</h3>
      <p>Git、Python 3.10以上、Node.jsとnpm、班のAzure MySQLへの接続情報を用意します。班でそろえるPython・Node.jsのバージョンと、接続情報の受け渡し方法は未決定です。</p>
      <div className="guide-command"><pre><code>{`git clone https://github.com/HealthCareFirst/giftia-frontend-backend.git
cd giftia-frontend-backend`}</code></pre></div>
      <h4>ターミナル1でAPIを起動する</h4>
      <div className="guide-command"><pre><code>{`cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt`}</code></pre></div>
      <p>上記はmacOS・Linux用です。Windows PowerShellでは仮想環境の作成に <code>py -m venv .venv</code>、有効化に <code>{'.venv\\Scripts\\Activate.ps1'}</code> を使います。</p>
      <p><code>backend/.env</code> に <code>DB_HOST</code>、<code>DB_USER</code>、<code>DB_PASSWORD</code>、<code>DB_NAME</code>、<code>CORS_ORIGINS=http://localhost:3000</code> を設定します。必要に応じて <code>DB_PORT</code> と <code>DB_SSL_CA</code> を設定します。接続情報とAPIキーはサーバー側の環境変数で管理し、Gitへの追加や画面側への配置を避けます。</p>
      <div className="guide-command"><pre><code>python -m uvicorn main:app --reload</code></pre></div>
      <p><code>http://localhost:8000/api/health</code> でDB接続を確認し、<code>http://localhost:8000/docs</code> で検索APIを試せます。</p>
      <h4>ターミナル2で画面を起動する</h4>
      <p>リポジトリのルートから実行します。画面は既定で <code>http://localhost:8000</code> のAPIを呼びます。</p>
      <div className="guide-command"><pre><code>{`cd giftia-frontend
npm ci
npm run dev`}</code></pre></div>
      <p><code>http://localhost:3000</code> を開き、条件を入れて検索します。接続できないときはAPIの起動、DB接続、<code>CORS_ORIGINS</code> の順に確認します。</p>

      <h3 id="giftia-github">GitHubでの作業手順</h3>
      <ol className="guide-numbered">
        <li><code>git switch main</code> と <code>git pull --ff-only</code> で作業の起点を更新します。</li>
        <li><code>git switch -c feat/review-display</code> のように作業ブランチを作ります。ブランチ命名規則は未決定です。</li>
        <li>変更を手元で確認してコミットし、<code>git push -u origin HEAD</code> で共有します。</li>
        <li>GitHubで <code>main</code> 宛てのPRを開き、目的、変更内容、確認手順を記載します。レビューの最低基準、マージ担当、ブランチ保護の設定担当は未決定です。</li>
      </ol>
      <p>班のルールとAI利用時の手順は開発リポジトリのREADMEと <code>AGENTS.md</code> を参照してください。 <a href="https://github.com/HealthCareFirst/giftia-frontend-backend">Giftia開発リポジトリ</a></p>

      <h3 id="giftia-order">担当と作る順番（案）</h3>
      <div className="guide-table-wrap">
        <table className="guide-table">
          <thead><tr><th scope="col">順</th><th scope="col">作業</th><th scope="col">先に確認すること</th><th scope="col">担当</th></tr></thead>
          <tbody>
            <tr><td>1</td><td>既存検索を起動し、レビューと商品説明を確認</td><td>検索条件、取得できる項目、レビューとシーンの対応</td><td>未決定</td></tr>
            <tr><td>2</td><td>レビューの関連順表示と、レビュー不足時の商品説明・AI補足（BR-01）</td><td>関連度、表示件数、不足の条件、補足の形式</td><td>未決定</td></tr>
            <tr><td>3</td><td>購入後アンケートと回答の保存（BR-02）</td><td>購入との紐づけ、設問、回答をレビューとして表示する条件</td><td>未決定</td></tr>
            <tr><td>4</td><td>回答者に5%オフクーポンを付与（BR-03）</td><td>回答完了の判定、重複発行防止、配布方法と期限</td><td>未決定</td></tr>
          </tbody>
        </table>
      </div>
      <p>要件定義書の第1章ではBR-01〜03が実装範囲です。第3〜4章にBR-04を参照する機能が残っているため、機能要件ID（FR）と要求ID（BR）の対応は未決定です。</p>

      <h3 id="giftia-files">フォルダ構成と主要ファイル</h3>
      <p>既存の検索は、Next.jsの画面からFastAPIに条件を渡し、FastAPIが班のMySQLから商品候補を取得して返します。</p>
      <div className="guide-table-wrap">
        <table className="guide-table">
          <thead><tr><th scope="col">ファイル</th><th scope="col">現在の役割</th></tr></thead>
          <tbody>
            <tr><td><code>giftia-frontend/app/page.tsx</code></td><td>検索条件の入力、結果一覧、検索失敗時の表示</td></tr>
            <tr><td><code>giftia-frontend/app/ResultCard.tsx</code></td><td>検索結果の商品カード</td></tr>
            <tr><td><code>giftia-frontend/lib/api.ts</code></td><td>検索条件を組み立ててFastAPIを呼び出す</td></tr>
            <tr><td><code>backend/main.py</code></td><td><code>GET /api/search</code> と <code>GET /api/health</code>。現行の検索結果は商品評価の降順で、同評価は商品ID順</td></tr>
            <tr><td><code>backend/database.py</code></td><td>Azure MySQLへの接続と読み取り</td></tr>
          </tbody>
        </table>
      </div>
      <p>レビュー表示・アンケート・クーポン用の画面パス、APIの入出力、追加ファイルの配置は未決定です。追加データの案は要件定義書の第5章と <Link href="/er">GiftiaのER図</Link> を参照してください。</p>
      <p><a href="https://docs.google.com/document/d/11c8bgBn7rv1tJakj185P-9IZt4PQ-Xo-/edit">Giftia 要件定義書</a> · <a href="https://bts-tech0.netlify.app/guide.html">章立ての参考にした実装ガイド</a></p>
    </>
  );
}
