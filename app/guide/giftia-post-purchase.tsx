export default function GiftiaPostPurchase() {
  return (
    <>
      <section id="giftia-survey" aria-labelledby="giftia-survey-title">
        <h2 id="giftia-survey-title">購入後アンケート（BR-02・実装案）</h2>
        <p>購入者から贈った場面と商品を選んだ理由を集め、次の購入者が同じ商品を検討するときの判断材料にします。</p>
        <figure className="giftia-overview-flow">
          <figcaption>購入から回答を活用するまで</figcaption>
          <ol>
            <li><strong>購入後に案内</strong><span>購入した商品をフォームに表示する</span></li>
            <li><strong>回答を保存</strong><span>購入を確認し、用途や選定理由を注文明細に紐づける</span></li>
            <li><strong>商品選びに活用</strong><span>公開条件を満たした回答を同じ商品の判断材料にする</span></li>
          </ol>
        </figure>
        <h3>画面・API・保存の方針</h3>
        <ul className="guide-numbered">
          <li>設問例は、贈った場面、相手との関係、選んだ理由です。自由記述には個人を特定できる情報を入力しないよう案内します。</li>
          <li><code>POST /api/surveys</code> の案では、FastAPIが回答者と対象の購入の対応、必須項目を確認します。回答の保存を確定してからクーポン発行に進みます。保存後に発行が失敗しても回答IDは保持します。初回の応答が途切れても同じ送信を識別し、保存済みの回答IDを返す設計にします。送信を識別する方法は未決定です。</li>
          <li>公開できる回答を商品IDで取得し、購入者アンケート由来と表示します。公開条件が確定するまでは、回答を検索結果やAIチャットの出典に使わない案です。</li>
        </ul>
        <p><strong>修正・追加候補</strong>　<code>giftia-frontend/app/survey/page.tsx</code> にフォームを追加し、<code>giftia-frontend/lib/api.ts</code> に送信処理、<code>backend/main.py</code> にAPIの入口を置きます。回答の保存先は <a href="/er">ER図</a> と要件定義書に照らして決めます。</p>
        <p><strong>確認するケース</strong>　購入済み商品の回答が保存される。他の購入者の注文明細や未購入の商品には回答できない。再送で回答が重複しない。</p>
        <p><strong>未決定</strong>　購入後の案内経路、モックでの購入確認、設問と必須項目、回答単位、保存先、公開・再利用条件。</p>
      </section>

      <section id="giftia-coupon" aria-labelledby="giftia-coupon-title">
        <h2 id="giftia-coupon-title">5%オフクーポンの付与（BR-03・実装案）</h2>
        <p>アンケートへの回答が完了した購入者に5%オフクーポンを付与し、再訪を促します。要求定義書の事業目標はリピート流入割合20%です。</p>
        <figure className="giftia-overview-flow">
          <figcaption>回答完了からクーポンの案内まで</figcaption>
          <ol>
            <li><strong>回答の保存を確認</strong><span>BR-02の回答IDを発行処理に渡す</span></li>
            <li><strong>発行を記録</strong><span>同じ回答への付与は1件にする</span></li>
            <li><strong>付与結果を案内</strong><span>初版は回答完了画面に表示する案</span></li>
          </ol>
        </figure>
        <h3>発行と再試行の方針</h3>
        <ul className="guide-numbered">
          <li>発行は、回答保存を確定した後の別処理です。初回の発行が失敗した場合は、画面に「回答は保存済みです。クーポン発行を再試行できます」と表示します。</li>
          <li>再試行では、保存済みの回答IDを指定します。FastAPIは回答者と対象回答の対応を確認し、発行だけを再実行します。すでに発行済みなら、既存の発行結果を返します。</li>
          <li>同じ回答IDで発行が重ならないようにします。DB内で発行を完結する場合は、発行記録の回答IDに一意制約を設け、発行側のトランザクションで確定します。外部で発行する場合は、回答IDを再試行の識別子として扱えるかを確認し、結果が不明なときは発行元に照会してから再試行します。</li>
        </ul>
        <p><strong>修正・追加候補</strong>　<code>giftia-frontend/app/survey/page.tsx</code> に回答の保存状態、付与結果、発行の再試行ボタンを表示します。<code>backend/main.py</code> で回答保存の確定後に初回発行を呼び出し、保存済み回答に対する発行再試行の入口も設けます。必要に応じて <code>backend/services/coupons.py</code> と発行記録のSQLを追加します。</p>
        <p><strong>確認するケース</strong>　有効な回答に5%オフを1件付与する。回答未完了では付与しない。発行失敗後も回答が残り、再試行では発行だけが行われる。応答途絶後の再試行や同時送信でも追加発行されない。</p>
        <p><strong>未決定</strong>　再試行APIの形式、コードの発行元、配布方法、有効期限、利用条件、購入時の適用方法とモックで再現する範囲。</p>
      </section>
    </>
  );
}
