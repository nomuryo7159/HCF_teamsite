const files = [
  ['修正', 'giftia-frontend/app/page.tsx', '開いているチャットと対象商品IDを管理。商品を切り替えたときは別の商品の回答が表示されないようにする。'],
  ['修正', 'giftia-frontend/app/ResultCard.tsx', '「この商品について聞く」ボタンから選択した商品IDを親画面に渡す。'],
  ['追加案', 'giftia-frontend/app/ProductChat.tsx', '質問入力、送信中、回答と出典、再試行を表示する。画面のスタイルは既存の検索画面に合わせる。'],
  ['修正', 'giftia-frontend/lib/api.ts', 'チャット専用のAPI呼び出しと応答型を追加する。検索用の searchGifts は既存のまま使う。'],
  ['修正', 'backend/main.py', 'POST /api/chat の入口を追加し、商品ID・質問の形式と長さを検証する。直接接続する開発構成では、許可済みオリジンからのPOSTも受け付ける。'],
  ['追加案', 'backend/chat.py', '商品説明と関連レビューの取得、モデルへの入力、出力の検証と失敗時の処理を担当する。既存の database.py の fetch_all を再利用する。'],
  ['修正候補', 'backend/.env.example・backend/requirements.txt', '採用するモデルに応じて設定名と依存関係を追加する。キーの実値はサーバーの環境変数で管理する。'],
  ['追加案', 'backend/tests/test_chat.py', 'DBとモデルを差し替え、根拠がある場合、根拠がない場合、APIの異常系を再現する。'],
] as const;

export default function GiftiaChatbot() {
  return (
    <section id="giftia-chatbot" aria-labelledby="giftia-chatbot-title">
      <h2 id="giftia-chatbot-title">購入を後押しするAIチャットボット（BR-01・実装案）</h2>
      <p>検索結果の商品カードから「職場で配りやすい？」「送別品として選ぶ根拠は？」と質問できるようにします。初版は商品1件・1問ずつを対象とし、商品説明と関連レビューから判断材料を示します。</p>

      <figure className="giftia-chat-flow">
        <figcaption>質問から回答までのデータの流れ</figcaption>
        <ol>
          <li><strong>検索結果のチャット（Next.js）</strong><span>選んだ商品IDと質問を送信</span></li>
          <li><strong>チャットAPI（FastAPI）</strong><span>入力を検証し、商品IDで説明・関連レビューを取得</span><small>Azure MySQL　→　商品説明、レビュー本文、出典の識別子</small></li>
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
        <li>モデルを接続し、関連レビューあり、レビューなし、説明にも根拠なし、存在しない出典ID、タイムアウトを確認します。</li>
      </ol>
      <p>採用モデル、レビューの関連度と件数、応答時間・費用の上限、公開時の認証と利用制限、会話の保存は未決定です。初版案は会話履歴をDBに保存せず、検索と別のAPIで動かします。</p>
    </section>
  );
}
