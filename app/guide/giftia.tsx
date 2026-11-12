export function GiftiaScope() {
  return (
    <section id="giftia-scope" aria-labelledby="giftia-scope-title">
      <h2 id="giftia-scope-title">今回の実装範囲</h2>
      <h3>購入判断を後押しできると考える理由</h3>
      <p>要求定義書の顧客Aは10商品以上を比較し、同僚2人の賛同を得て購入を決めました。Giftiaでは、用途が近い購入者の体験と確認できる商品仕様があれば、選んだ理由を同僚に説明しやすくなり、購入を決めやすくなると仮定します。購入への効果は <a href="#giftia-verification">比較実験</a> で確かめます。</p>
      <figure className="giftia-overview-flow">
        <figcaption>購入前から購入後まで</figcaption>
        <ol>
          <li><strong>検索・商品選び</strong><span>「送別」選択時に関連度順、関連レビュー、商品説明、AIチャットを提供（BR-01）</span></li>
          <li><strong>購入後に回答</strong><span>選んだ理由や利用場面をアンケートで集める（BR-02）</span></li>
          <li><strong>回答完了</strong><span>5%オフクーポンを付与する（BR-03）</span></li>
        </ol>
      </figure>
      <details>
        <summary>要求定義書のBR-01〜05と今回の範囲</summary>
      <ul className="guide-numbered">
        <li><strong>BR-01（優先）</strong> シーン選択欄にはDB登録値を表示し、「送別」を選んだ場合にBR-01を適用します。送別以外・未選択は今回の開発スコープ外で、現行の検索結果と商品カードを使います。</li>
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
        <li>送別を選ぶと、送別タグ付きの商品が優先され、各カードでは送別に関連するレビューを先に読める。送別以外に切り替えるか選択を解除すると、既存表示に戻りチャットが閉じる。</li>
        <li>関連レビューが少ない商品でも商品説明を確認でき、AIの補足と購入者のレビューを見分けられる。</li>
        <li>発行に失敗してもアンケート回答が保存され、クーポン発行だけを再試行できる。同じ回答に5%オフクーポンが重複発行されない。</li>
      </ul>

      <p>チャット固有の確認ケースは <a href="#giftia-chatbot-checks">AIチャットボットの章</a> を参照してください。</p>
      <h3>現行表示とBR-01一式を比較する</h3>
      <p>両群に同じシーン選択欄を出し、初めて「送別」を選んだ利用者をランダムに割り付けます。期間中は同じ利用者の割付先を維持し、送別選択時に割付先の表示を出します。両群を同じ期間に比較し、BR-02のアンケートとBR-03のクーポンなど、BR-01以外の条件をそろえます。</p>
      <div className="guide-table-wrap"><table className="guide-table">
        <thead><tr><th scope="col">群</th><th scope="col">表示する内容</th></tr></thead>
        <tbody>
          <tr><th scope="row">現行表示</th><td>評価順の検索結果と既存の商品カード</td></tr>
          <tr><th scope="row">BR-01一式</th><td>送別シーンとの関連度順、関連レビュー、商品説明、AIチャット（2つの観点と共有用の一文を含む）</td></tr>
        </tbody>
      </table></div>
      <p>主指標は、チャットを使わなかったセッションも含めた割付先ごとの送別選択セッションの購入率です。群間差とその不確かさから、一式を提供した場合の効果を判断します。補助指標は「選んだ理由を同僚に説明できそうか」、カート追加、根拠不足で回答できなかった割合です。算式、購入を紐づける条件、検出したい差、必要セッション数は実験前に決めます。算式は講師に確認します。</p>

      <h3>3か月ごとに施策全体の目標を確認する</h3>
      <p>Exhibit 1 表4の「検索結果ページ」の全体のセッション購入率が2.4%を超えるかを確認します。2.4%以下なら仮説を見直します。BR-01一式の導入効果は、上の比較で得られる群間差を使って判断します。</p>

      <h3>後から機能を一つずつ検証できるようにする</h3>
      <ul className="guide-numbered">
        <li>検索順位、関連レビュー、商品説明、チャットの有効状態を別々に扱える構成にします。チャット内の「2つの観点と共有用の一文」も通常チャットと切り替えられるようにします。初回は現行表示と一式を割り付けます。</li>
        <li>実験ID、割付先、選択シーン（未選択を含む）、実際に有効だった機能、表示・チャット利用・カート追加・購入の各時点を紐づけて記録する案です。利用ログは、次に検証する機能を選ぶ手がかりにします。</li>
        <li>個別に検証する段階では、比較したい機能以外の条件をそろえて、改めてランダムに割り付けます。たとえば関連レビューだけを検証する場合は、商品順、商品説明、チャットを両群で共通にします。</li>
      </ul>
    </section>
  );
}
