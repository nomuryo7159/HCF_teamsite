const files = [
  ['修正', 'giftia-frontend/app/page.tsx', '開いているチャットと対象商品IDを管理。商品を切り替えたときは別の商品の回答が表示されないようにする。'],
  ['修正', 'giftia-frontend/app/ResultCard.tsx', '「この商品について聞く」ボタンから選択した商品IDを親画面に渡す。'],
  ['追加案', 'giftia-frontend/app/ProductChat.tsx', '質問入力、送信中、回答と出典、再試行を表示する。2つの観点と共有用の一文も表示する。画面のスタイルは既存の検索画面に合わせる。'],
  ['修正', 'giftia-frontend/lib/api.ts', 'チャット専用のAPI呼び出しと応答型を追加する。検索用の searchGifts は既存のまま使う。'],
  ['修正', 'backend/main.py', 'POST /api/chat の入口を追加し、商品ID・質問の形式と長さ、指定された表示モードを検証する。直接接続する開発構成では、許可済みオリジンからのPOSTも受け付ける。'],
  ['追加案', 'backend/product_evidence.py', '商品IDから商品説明、本文のあるレビュー、出典IDを取得する。既存の database.py の fetch_all を使い、検索とチャットに同じ形式で返す。'],
  ['追加案', 'backend/chat.py', '共通の取得処理を呼び、質問に関係する根拠を選ぶ。AIへの問い合わせ、回答と出典の照合、失敗時の処理を担当する。'],
  ['修正候補', 'backend/.env.example・backend/requirements.txt', '採用するモデルに応じて設定名と依存関係を追加する。キーの実値はサーバーの環境変数で管理する。'],
  ['追加案', 'backend/tests/test_chat.py', 'DBとモデルを差し替え、根拠がある場合、根拠がない場合、APIの異常系を再現する。'],
] as const;

export default function GiftiaChatbot() {
  return (
    <section id="giftia-br01" aria-labelledby="giftia-br01-title">
      <h2 id="giftia-br01-title">検索結果から購入判断まで（BR-01・実装案）</h2>
      <h3>1. 検索結果を送別シーンとの関連度で整理する</h3>
      <p>現行の条件で在庫のある商品候補を取得し、商品シーンタグや商品説明などを手がかりに、送別に関連する商品を上位にする案です。現行コードでは評価の降順です。商品一覧の順位付けは追加案で、関連度の算定、同順位の扱い、関連情報がない場合の並びは未決定です。</p>
      <p><strong>修正候補</strong>　<code>backend/main.py</code> の <code>GET /api/search</code> で、検索条件に合う候補全体を順位付けしてから表示件数を適用する案です。検索条件で除外された商品が順位付けで混ざらないことを確認します。</p>
      <h3>2. 商品カードに関連レビューと商品説明を表示する</h3>
      <p>商品ごとに、送別や職場での利用を本文から確認できるレビューを優先し、根拠になる一節と出典を示します。商品説明から確認できる仕様も表示し、関連レビューが不足する場合は説明を主な判断材料にします。入り数などの情報が見つからない場合は未確認と表示します。</p>
      <p><strong>修正候補</strong>　<code>backend/main.py</code> から商品仕様・レビュー本文・出典を返し、<code>giftia-frontend/lib/api.ts</code> と <code>giftia-frontend/app/ResultCard.tsx</code> で受け取って表示します。商品に付いたシーンタグと、個々のレビューに書かれた利用場面は別々に確認します。</p>
      <h4 id="giftia-shared-evidence">検索とチャットで共用する取得処理</h4>
      <p>FastAPI側の共通処理（配置例は <code>backend/product_evidence.py</code>）は、商品IDを受け取り、商品説明から確認できる仕様、同じ商品に紐づく本文のあるレビュー、出典IDを返します。BR-02の回答は、公開・再利用条件が決まった後に取得対象へ加える候補です。</p>
      <ul className="guide-numbered">
        <li><strong>検索</strong>　検索条件に合う商品候補を取得して並べます。共通処理で取得した情報から、カードに表示する送別シーン向けのレビューを選びます。</li>
        <li><strong>チャット</strong>　選択された商品について共通処理を呼び、質問に関係する情報を選びます。<code>backend/chat.py</code> が生成AIを呼び、回答と出典を照合します。</li>
      </ul>
      <h3 id="giftia-chatbot">3. AIチャットで残った疑問に答える</h3>
      <p>検索結果の商品カードから「職場で配りやすい？」「送別品として選ぶ根拠は？」と質問できるようにします。初版は商品1件・1問ずつを対象とし、商品説明と関連レビューから判断材料を示します。</p>

      <figure className="giftia-chat-flow">
        <figcaption>質問から回答までのデータの流れ</figcaption>
        <ol>
          <li><strong>検索結果のチャット（Next.js）</strong><span>選んだ商品IDと質問を送信</span></li>
          <li><strong>チャットAPI（FastAPI）</strong><span>入力を検証し、共通処理で取得した情報から質問に関係する根拠を選択</span><small>Azure MySQL　→　商品説明、レビュー本文、出典の識別子</small></li>
          <li><strong>生成AI（FastAPIから呼び出し）</strong><span>質問と必要な根拠を受け取り、回答と出典の識別子を返す</span></li>
          <li><strong>チャットAPI → 検索結果のチャット</strong><span>出典を照合し、回答・出典・確認できなかった点を表示</span></li>
        </ol>
      </figure>

      <h3>APIと回答の方針</h3>
      <ul className="guide-numbered">
        <li><code>POST /api/chat</code> に <code>product_id</code> と <code>question</code> を送る案です。応答には <code>answer</code>、<code>sources</code>、<code>status</code> を含め、出典の本文や表示名はサーバーが実際の取得結果から組み立てます。</li>
        <li>商品IDはサーバー側で照合し、商品説明と本文のあるレビューを取得します。送別・質問との関連が高いものを少数選び、購入者名、注文情報、連絡先はモデルに送らない方針です。</li>
        <li>質問やレビュー本文は参照データとしてモデルに渡し、操作指示として扱いません。回答の出典IDを取得済みデータと照合し、出典IDの照合で確認できるのは参照先の存在です。根拠のない特徴や配送日の断定を避けるようモデルに指示し、根拠不足時は「商品情報からは確認できません」と返すケースをテストします。</li>
        <li>レビューがないときは商品説明で確認できる範囲を回答します。モデルのタイムアウトや応答不正時は商品説明への案内と再試行を表示し、検索結果は引き続き利用できるようにします。</li>
      </ul>

      <h3>同僚に相談する前に、AIが2つの観点で確認する</h3>
      <p>商品カードに「同僚に相談する前に確認」を置く案です。「AIによる2つの観点」と明示し、各観点で選ぶ理由、気になる点、出典を表示します。見方が分かれた場合も両方を示します。</p>
      <figure className="giftia-overview-flow">
        <figcaption>表示例（架空の商品）</figcaption>
        <ol>
          <li><strong>受け取る人に合いそうか</strong><span>商品説明では常温保存できます。相手の好みは確認できません。</span></li>
          <li><strong>一緒に贈る同僚に説明しやすいか</strong><span>職場で配りやすかったという購入者レビューがあります。10人分の入り数は未確認です。</span></li>
          <li><strong>みんなに伝える一文</strong><span>「職場で配りやすかったというレビューがあるので候補にしています。人数分の入り数だけ確認したいです。」</span></li>
        </ol>
      </figure>
      <p><code>POST /api/chat</code> に二つの観点を指定する入力を追加し、1回の応答で各観点の理由・未確認点・出典と共有用の一文を返す案です。<code>ProductChat.tsx</code> が結果を表示します。一文は画面上に提示し、共同購入者への通知はBR-05として今回の対象外です。</p>

      <h3 id="giftia-chatbot-files">修正・追加するファイル</h3>
      <div className="guide-table-wrap"><table className="guide-table">
        <thead><tr><th scope="col">区分</th><th scope="col">Giftiaリポジトリ内の場所</th><th scope="col">修正方針</th></tr></thead>
        <tbody>{files.map(([status, path, change]) => (
          <tr key={path}><td>{status}</td><th scope="row"><code>{path}</code></th><td>{change}</td></tr>
        ))}</tbody>
      </table></div>

      <h3 id="giftia-chatbot-checks">作る順番と確認するケース</h3>
      <ol className="guide-numbered">
        <li>商品IDで根拠を取得し、固定の応答で商品カードからチャットまでつなぎます。商品切替と存在しない商品IDを確認します。</li>
        <li>モデルを接続し、関連レビューあり、レビューなし、説明にも根拠なし、存在しない出典ID、タイムアウトを確認します。二つの観点で結論が分かれる場合や、一文に未確認の仕様を混ぜないことも確認します。</li>
      </ol>
      <p>採用モデル、レビューの関連度と件数、応答時間・費用の上限、公開時の認証と利用制限、会話の保存は未決定です。初版案は会話履歴をDBに保存せず、検索と別のAPIで動かします。</p>
    </section>
  );
}
