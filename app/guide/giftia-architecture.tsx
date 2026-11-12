import Link from 'next/link';

export default function GiftiaArchitecture() {
  return (
    <section id="giftia-architecture" aria-labelledby="giftia-architecture-title">
      <h2 id="giftia-architecture-title">アーキテクチャ</h2>

      <figure className="giftia-overview-flow">
        <figcaption>現在の検索処理</figcaption>
        <ol>
          <li><strong>Next.js</strong><span><code>page.tsx</code> の検索条件を <code>lib/api.ts</code> から送信</span></li>
          <li><strong>FastAPI</strong><span><code>GET /api/search</code> が条件を受け取り、<code>database.py</code> に渡す</span></li>
          <li><strong>Azure MySQL</strong><span>在庫のある商品を評価の降順、同評価なら商品ID順に取得</span></li>
        </ol>
        <p>FastAPIから画面に商品名・価格・評価・レビュー件数などが戻り、<code>ResultCard.tsx</code> が表示します。</p>
      </figure>
      <p>Next.js側の <code>app/api/search/route.ts</code> は空ファイルです。データの関係は <Link href="/er">GiftiaのER図</Link> を参照してください。</p>

      <h3>既存の画面とAPIを使って機能を足す案</h3>
      <div className="guide-table-wrap"><table className="guide-table">
        <thead><tr><th scope="col">機能</th><th scope="col">画面（Next.js）</th><th scope="col">APIとデータ（FastAPI・MySQL）</th></tr></thead>
        <tbody>
          <tr><th scope="row">送別シーンの判断材料（BR-01）</th><td>商品カードで関連レビューを先に見せ、商品説明とAI補足の出典が分かるように表示する。</td><td>候補取得後、商品IDでレビューを取得して関連度順に整える。レビュー不足時は商品説明を返す。AI連携は <a href="#giftia-chatbot">チャットの構成図</a> を参照。</td></tr>
          <tr><th scope="row">購入後アンケート（BR-02）</th><td>購入後の導線からフォームを開き、回答を送る。</td><td>回答者が対象の購入について回答できることをサーバーで確認し、回答を注文明細に紐づけて保存する案。モックで購入をどう確認するか、回答をレビューとして表示する条件は未決定。</td></tr>
          <tr><th scope="row">5%オフクーポン（BR-03）</th><td>回答後に付与結果を案内する。配布方法は未決定。</td><td>保存した回答を起点に発行し、同じ回答が再送されても1件だけ付与する。回答と発行記録を同じDBで扱う場合は、一意制約とトランザクションで整合性を保つ案。</td></tr>
        </tbody>
      </table></div>
      <h3>商品カードに判断材料を表示する（BR-01）</h3>
      <p>FastAPIで商品IDに紐づく商品仕様、レビュー本文、出典IDを取得し、商品カードとチャットで同じ取得処理を使います。職場や送別での利用が本文から確認できるレビューを優先し、根拠になる一節と表示理由をカードに出します。商品タグは候補取得に使えます。個々のレビューの利用場面は本文などで確認します。</p>
      <p>関連レビューが少ない場合は商品説明で確認できる仕様を示し、入り数など判断に必要な項目が見つからなければ、その項目が未確認であることを表示します。</p>
      <h3>公開時にAPIの経路を見直す場合</h3>
      <p>手元の検証では既存の直接呼び出しを使えます。公開時にブラウザーからの接続先を同一オリジンにそろえる必要が出た場合は、Next.jsのサーバー側ルートを経由してFastAPIに転送する案もあります。その場合もDBアクセスとクーポン発行はFastAPIが担当します。公開構成と認証方式は未決定です。</p>
      <p>購入確認、APIの入出力、DBに追加する項目は未決定です。</p>
    </section>
  );
}
