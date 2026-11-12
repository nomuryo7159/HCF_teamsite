export function GiftiaScope() {
  return (
    <section id="giftia-scope" aria-labelledby="giftia-scope-title">
      <h2 id="giftia-scope-title">今回の実装範囲</h2>
      <figure className="giftia-overview-flow">
        <figcaption>購入前から購入後まで</figcaption>
        <ol>
          <li><strong>検索・商品選び</strong><span>関連レビューと商品説明を表示。AIチャットで気になる点を質問（BR-01）</span></li>
          <li><strong>購入後に回答</strong><span>選んだ理由や利用場面をアンケートで集める（BR-02）</span></li>
          <li><strong>回答完了</strong><span>5%オフクーポンを付与する（BR-03）</span></li>
        </ol>
      </figure>
      <details>
        <summary>要求定義書のBR-01〜05と今回の範囲</summary>
      <ul className="guide-numbered">
        <li><strong>BR-01（優先）</strong> 商品を納得して選べるよう、検索結果では送別シーンとの関連性が高いレビューを優先表示する案Bを先に試します。</li>
        <li><strong>BR-02（優先）</strong> 購入後のアンケートで、他の購入者が商品を選んだ理由や利用場面を集め、次の購入者の判断材料にします。</li>
        <li><strong>BR-03（優先）</strong> アンケート回答者に5%オフクーポンを付与します。要求定義書ではリピート流入割合20%を事業目標としています。</li>
        <li><strong>BR-04（今回の実装対象外）</strong> 送別シーン全体の購入率1.7%→3.0%、購入までの日数5.3日→4.0日は要求定義書上の事業目標です。</li>
        <li><strong>BR-05（今回の実装対象外）</strong> 購入候補を共同購入者に通知する機能は今回の範囲から外します。</li>
      </ul>

      </details>
      <p>要求定義書は顧客課題と達成目標の出典です。以下の画面、API、ファイル配置は実装案です。</p>
      <p><a href="https://docs.google.com/document/d/1hWUxLIHkZCRGo4C8CAR-JIOYOnn9wm4G/edit">Giftia 要求定義書（第3〜7章）</a></p>
    </section>
  );
}

export function GiftiaVerification() {
  return (
    <section id="giftia-verification" aria-labelledby="giftia-verification-title">
      <h2 id="giftia-verification-title">動作確認と施策の検証</h2>
      <h3>手元で確認するケース（案）</h3>
      <ul className="guide-numbered">
        <li>送別に関連するレビューがある商品では、そのレビューを先に読める。</li>
        <li>関連レビューが少ない商品でも商品説明を確認でき、AIの補足と購入者のレビューを見分けられる。</li>
        <li>アンケート回答完了後に5%オフクーポンが発行され、同じ回答の再送で重複発行されない。</li>
      </ul>

      <p>チャット固有の確認ケースは <a href="#giftia-chatbot-checks">AIチャットボットの章</a> を参照してください。</p>
      <h3>3か月ごとに購入率を判定する</h3>
      <p>Exhibit 1 表4の「検索結果ページ」のセッション購入率で、2.4%を超えれば成功、2.4%以下なら仮説を見直します。レビュー表示や補足が判断材料として使われたかも、計測方法を決めて確認します。</p>

      <p>セッション購入率の分母・分子、購入を紐づける条件、比較方法は未決定です。算式は講師に確認します。チャットを開いた、回答を受け取った、購入した、の各時点を記録する案です。</p>
    </section>
  );
}
