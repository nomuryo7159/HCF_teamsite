const files = [
  ['修正', 'giftia-frontend/app/page.tsx', 'DB由来の選択肢でシーン選択欄を作り、選択値を管理する。BR-01の適用時にチャットを開けるようにし、商品変更・送別以外への切替・選択解除時は古い回答を表示しない。'],
  ['修正', 'giftia-frontend/app/ResultCard.tsx', 'BR-01の適用時に関連レビューと商品説明を表示し、「この商品について聞く」ボタンから商品IDを親画面に渡す。'],
  ['追加案', 'giftia-frontend/app/ProductChat.tsx', '質問入力、送信中、回答と出典、再試行を表示する。2つの観点と共有用の一文も表示する。画面のスタイルは既存の検索画面に合わせる。'],
  ['修正', 'giftia-frontend/lib/api.ts', 'シーンタグ一覧を取得する呼び出しを追加し、searchGifts で選択値を検索APIに渡す。チャット用の呼び出しでも選択値を送り、検索・チャットの追加応答項目を受け取る。'],
  ['修正', 'backend/main.py', 'product_scenes.scene_tag の重複を除いた一覧を返すAPIを追加する。GET /api/search で選択値を検証し、送別かつBR-01の適用条件を満たす場合に関連度順と追加表示用の情報を返す。POST /api/chat でも適用条件と入力を検証する。直接接続の開発構成では、許可済みオリジンからのPOSTを受け付ける。'],
  ['追加案', 'backend/product_evidence.py', '商品IDから商品説明、本文のあるレビュー、出典IDを取得する。既存の database.py の fetch_all を使い、検索とチャットに同じ形式で返す。'],
  ['追加案', 'backend/chat.py', '共通の取得処理を呼び、質問に関係する根拠を選ぶ。AIへの問い合わせ、回答と出典の照合、失敗時の処理を担当する。'],
  ['修正候補', 'backend/.env.example・backend/requirements.txt', '採用するモデルに応じて設定名と依存関係を追加する。キーの実値はサーバーの環境変数で管理する。'],
  ['追加案', 'backend/tests/test_chat.py', 'DBとモデルを差し替え、根拠がある場合、根拠がない場合、APIの異常系を再現する。'],
] as const;

export default function GiftiaChatbot() {
  return (
    <section id="giftia-br01" aria-labelledby="giftia-br01-title">
      <h2 id="giftia-br01-title">検索結果から購入判断まで（BR-01・実装案）</h2>
      <p>機能番号とBRの対応は要件定義書3章に従います。4.1節にはBR-04表記が残っています。候補と順位は6.2・6.4節に従い、6.1節の「絞り込みを選ばない」という説明との整合は要確認です。 <a href="https://docs.google.com/document/d/11c8bgBn7rv1tJakj185P-9IZt4PQ-Xo-/edit">Giftia要件定義書</a></p>
      <h3>1. シーンを選ぶ（FR-01）</h3>
      <p>検索画面のシーン選択肢には、DBの <code>product_scenes.scene_tag</code> の登録値を重複なく取得して使います。開発DBで確認した値は、お歳暮・お中元・お礼・結婚祝い・出産祝い・送別・誕生日・父の日・母の日の9種類です。BR-01一式を適用するのは「送別」を選んだ場合です。送別以外・未選択は今回の開発スコープ外とし、現行の評価順と商品カードを使います。「送別」を選ぶと、<code>scene_tag = '送別'</code> の商品を候補にします。未選択（ブランク）も選べます。</p>
      <p>要件定義書6.2・6.4に従い、BR-01適用時の候補は送別タグ付きの商品に限定します。検索語の一致数が多い順に並べ、上位5件まで返します。同点時の基準と、一致を数える対象項目・方法は要確認です。0件の場合は該当商品がない旨を表示します。</p>
      <p><strong>修正候補</strong>　<code>giftia-frontend/app/page.tsx</code> にシーンの選択欄を設け、<code>giftia-frontend/lib/api.ts</code> でDB由来の選択肢を取得し、選んだタグを検索APIに送ります。FastAPIは選択肢をDBから返し、検索時に受け取ったタグが登録値であることを確認します。<code>backend/main.py</code> の <code>GET /api/search</code> は、送別選択時にBR-01の適用条件を確認し、適用時のみ検索条件に合う候補を関連度順に並べてから表示件数を適用します。比較実験中は割付先も確認します。</p>
      <h4>実装手順と確認</h4>
      <ol className="guide-numbered">
        <li><code>backend/main.py</code> でタグ一覧を返し、<code>lib/api.ts</code> と <code>page.tsx</code> で未選択を含むプルダウンにつなぎます。</li>
        <li>送別の導入群で、送別タグ付きの候補を取得し、検索語の一致数順に最大5件を返します。6.4節の「相手」「好み」を検索に渡す方法、自由文をどこで扱うか、0件と判定する一致条件、同点時の順序は実装前に決めます。好みの列名は5.2節の <code>reviews.favorite</code> と6.2節の <code>reviews.favarite</code> を実DBと照合します。</li>
        <li>誕生日・未選択では既存結果を確認します。送別ではタグなしの商品が混ざらず、同じ入力を3回送っても順位が同じこと、該当なしの表示を確認します。</li>
      </ol>
      <h3>2. 商品カードに関連レビューと商品説明を表示する（FR-02）</h3>
      <p>レビューコメント欄は開閉式とします。各商品内のレビューは、商品のタグにかかわらず、送別での利用を本文から確認できるものを優先し、根拠になる一節と出典を示します。商品説明から確認できる仕様も表示し、関連レビューが不足する場合は説明を主な判断材料にします。入り数などの情報が見つからない場合は未確認と表示します。</p>
      <p><strong>修正候補</strong>　<code>backend/main.py</code> から商品仕様・レビュー本文・出典を返し、<code>giftia-frontend/lib/api.ts</code> と <code>giftia-frontend/app/ResultCard.tsx</code> で受け取って表示します。商品に付いたシーンタグと、個々のレビューに書かれた利用場面は別々に確認します。</p>
      <h4>実装手順と確認</h4>
      <ol className="guide-numbered">
        <li>共通取得処理から商品IDごとの <code>reviews.comment</code> と出典を返し、<code>lib/api.ts</code> の応答型を拡張します。</li>
        <li><code>ResultCard.tsx</code> に開閉式のレビュー欄を追加します。本文あり・なしで開閉と表示を確認し、送別以外・未選択では追加欄が出ないことを確認します。商品説明の補足表示はガイド上の追加案です。</li>
      </ol>
      <h4 id="giftia-shared-evidence">検索とチャットで共用する取得処理</h4>
      <p>FastAPI側の共通処理（配置例は <code>backend/product_evidence.py</code>）は、商品IDを受け取り、商品説明から確認できる仕様、同じ商品に紐づく本文のあるレビュー（reviews.comment）、出典IDを返します。BR-02の回答は、公開・再利用条件が決まった後に取得対象へ加える候補です。</p>
      <ul className="guide-numbered">
        <li><strong>検索</strong>　検索条件に合う商品候補を取得して並べます。共通処理で取得した情報から、カードに表示する送別向けのレビューを選びます。</li>
        <li><strong>チャット</strong>　選択された商品について共通処理を呼び、質問に関係する情報を選びます。<code>backend/chat.py</code> が生成AIを呼び、回答と出典を照合します。</li>
      </ul>
      <h3 id="giftia-chatbot">3. AIチャットで残った疑問に答える（FR-03）</h3>
      <p>BR-01が有効な商品カードから「職場で配りやすい？」「送別品として選ぶ根拠は？」と質問できるようにします。初版は商品1件・1問ずつを対象とし、商品説明と関連レビューから判断材料を示します。</p>

      <figure className="giftia-chat-flow">
        <figcaption>質問から回答までのデータの流れ</figcaption>
        <ol>
          <li><strong>検索結果のチャット（Next.js）</strong><span>商品ID・質問・選択中のシーンを送信</span></li>
          <li><strong>チャットAPI（FastAPI）</strong><span>送別選択と適用条件を確認し、共通処理で取得した情報から質問に関係する根拠を選択</span><small>Azure MySQL　→　商品説明、レビュー本文、出典の識別子</small></li>
          <li><strong>生成AI（FastAPIから呼び出し）</strong><span>質問と必要な根拠を受け取り、回答と出典の識別子を返す</span></li>
          <li><strong>チャットAPI → 検索結果のチャット</strong><span>出典を照合し、回答・出典・確認できなかった点を表示</span></li>
        </ol>
      </figure>

      <h3>APIと回答の方針</h3>
      <ul className="guide-numbered">
        <li><code>POST /api/chat</code> に <code>product_id</code>、<code>question</code>、<code>scene_tag</code> を送る案です。FastAPIは送別選択と、実験中は割付先を確認してから回答処理に進みます。送別以外に切り替えたり選択を解除したりしたときは、画面でチャットを閉じ、表示中・応答待ちの回答を破棄します。応答には <code>answer</code>、<code>sources</code>、<code>status</code> を含め、出典の本文や表示名はサーバーが実際の取得結果から組み立てます。</li>
        <li>商品IDはサーバー側で照合し、商品説明と本文のあるレビューを取得します。送別・質問との関連が高いものを少数選び、購入者名、注文情報、連絡先はモデルに送らない方針です。</li>
        <li>質問やレビュー本文は参照データとしてモデルに渡し、操作指示として扱いません。回答の出典IDを取得済みデータと照合し、出典IDの照合で確認できるのは参照先の存在です。根拠のない特徴や配送日の断定を避けるようモデルに指示し、根拠不足時は「商品情報からは確認できません」と返すケースをテストします。</li>
        <li>レビューがないときは商品説明で確認できる範囲を回答します。モデルのタイムアウトや応答不正時は商品説明への案内と再試行を表示し、検索結果は引き続き利用できるようにします。</li>
      </ul>

      <h4>レビューと商品説明のキーワードを使う手順</h4>
      <ol className="guide-numbered">
        <li><code>backend/chat.py</code> で、取得済みのレビューコメントと商品説明から質問に関係する語を抽出し、原文と出典IDに紐づけます。キーワード一覧を作る方法と保持先は要確認です。</li>
        <li>語の一致を根拠候補の選択に使い、原文とともにモデルへ渡します。否定的なレビューは肯定的な推薦理由に使わず、引用を原文と照合します。</li>
        <li>固定応答で <code>ProductChat.tsx</code> までつないでからモデルを接続します。根拠なし、予算の質問、ギフトと無関係な質問、送別の選択解除を確認します。</li>
      </ol>
      <h3>同僚に相談する前に、AIが2つの観点で確認する（追加案）</h3>
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

      <p>要件定義書6.4に沿い、同じ入力で順位が再現されること、否定的なレビューを推薦理由に使わないこと、引用が実在し、最上位や価格に関する断定に裏付けがあることを確認します。ギフトと無関係な質問は相談の範囲に戻します。</p>
      <h3 id="giftia-chatbot-checks">作る順番と確認するケース</h3>
      <ol className="guide-numbered">
        <li>商品IDで根拠を取得し、固定の応答で商品カードからチャットまでつなぎます。商品切替と存在しない商品IDを確認します。</li>
        <li>モデルを接続し、関連レビューあり、レビューなし、説明にも根拠なし、存在しない出典ID、タイムアウトを確認します。二つの観点で結論が分かれる場合や、一文に未確認の仕様を混ぜないことも確認します。</li>
      </ol>
      <p>要件定義書7章ではOpenAI APIが挙がっています。具体的なモデル、レビューの関連度と件数、応答時間・費用の上限、公開時の認証と利用制限、会話の保存は未決定です。初版案は会話履歴をDBに保存せず、検索と別のAPIで動かします。</p>
    </section>
  );
}
