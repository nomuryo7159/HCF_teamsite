'use client';

import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { ArrowLeft, ArrowUpRight, Database, Maximize, Minus, Move, Plus, RotateCcw } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import schema from './schema.json';

const width = 1640;
const height = 1040;
const cardWidth = 306;
const rowHeight = 25;
const headerHeight = 67;
const initialPositions: Record<string, { x: number; y: number }> = {
  users: { x: 35, y: 80 }, orders: { x: 445, y: 80 }, order_items: { x: 855, y: 80 },
  products: { x: 855, y: 435 },
  product_scenes: { x: 1275, y: 435 }, reviews: { x: 445, y: 720 },
};
const relations = [
  { from: 'orders', column: 'user_id', to: 'users', side: 'left', minimum: 0 },
  { from: 'order_items', column: 'order_id', to: 'orders', side: 'left', minimum: 1 },
  { from: 'order_items', column: 'product_id', to: 'products', side: 'right', minimum: 0 },
  { from: 'reviews', column: 'user_id', to: 'users', side: 'left', minimum: 0 },
  { from: 'reviews', column: 'product_id', to: 'products', side: 'right', minimum: 0 },
  { from: 'product_scenes', column: 'product_id', to: 'products', side: 'left', minimum: 0 },
];

export default function Diagram() {
  const [positions, setPositions] = useState(initialPositions);
  const [zoom, setZoom] = useState(0.75);
  const [selected, setSelected] = useState<string | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ name: string; x: number; y: number; startX: number; startY: number } | null>(null);

  function move(name: string, x: number, y: number) {
    const table = schema.find(t => t.name === name)!;
    setPositions(old => ({ ...old, [name]: {
      x: Math.max(12, Math.min(width - cardWidth - 12, x)),
      y: Math.max(12, Math.min(height - headerHeight - table.columns.length * rowHeight - 24, y)),
    } }));
  }

  function startDrag(event: PointerEvent<SVGGElement>, name: string) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { name, x: event.clientX, y: event.clientY, startX: positions[name].x, startY: positions[name].y };
    setSelected(name);
  }

  function onDrag(event: PointerEvent<SVGGElement>) {
    if (!drag.current) return;
    const d = drag.current;
    move(d.name, d.startX + (event.clientX - d.x) / zoom, d.startY + (event.clientY - d.y) / zoom);
  }

  function onKey(event: KeyboardEvent<SVGGElement>, name: string) {
    const offsets: Record<string, [number, number]> = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] };
    if (offsets[event.key]) {
      event.preventDefault();
      const [x, y] = offsets[event.key];
      move(name, positions[name].x + x, positions[name].y + y);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelected(selected === name ? null : name);
    }
  }

  function fit() {
    if (viewport.current) setZoom(Math.max(0.2, Math.min(1, (viewport.current.clientWidth - 24) / width)));
  }

  return <div className="er-page">
    <a href="#er-main" className="skip-link">本文へ移動</a>
    <header className="er-header">
      <Link className="brand" href="/"><Image src="/favicon.svg" width="32" height="32" alt="" /><span>チーム健康第一<small>DESIGN DOCUMENTS</small></span></Link>
      <Link href="/#files" className="er-back"><ArrowLeft size={16} />共有資料へ戻る</Link>
    </header>
    <main id="er-main">
      <div className="er-intro">
        <div><p className="eyebrow">GIFTIA / DATABASE</p><h1>ER図<span>商品と注文のつながり</span></h1>
          <p>会員が商品を選び、注文し、レビューを残す。<br className="er-desktop-break" />正式なER図の6テーブルを、項目と参照関係から見渡せます。</p>
        </div>
        <a className="er-index-link" href="#table-list"><Database size={20} /><span>6 テーブル · 40 項目<small>項目一覧を読む</small></span><ArrowUpRight size={18} /></a>
      </div>

      <aside className="er-source-note"><strong>正式なGiftia ER図に基づいています。</strong><p>列の型、主キー、外部キー、参照関係は正式図の記載に従います。実際のMySQL上の定義は未確認です。</p></aside>

      <section className="er-diagram-section" aria-labelledby="diagram-title">
        <div className="er-toolbar">
          <div><h2 id="diagram-title">テーブルとリレーション</h2><p><Move size={14} />見出しをドラッグして移動 · 選択すると関係を強調</p></div>
          <div className="er-controls" aria-label="ER図の表示操作">
            <button aria-label="縮小" disabled={zoom <= 0.2} onClick={() => setZoom(z => Math.max(0.2, z - 0.15))}><Minus size={16} /></button>
            <output aria-live="polite">{Math.round(zoom * 100)}%</output>
            <button aria-label="拡大" disabled={zoom >= 1.5} onClick={() => setZoom(z => Math.min(1.5, z + 0.15))}><Plus size={16} /></button>
            <button onClick={fit}><Maximize size={15} /><span>全体を表示</span></button>
            <button onClick={() => { setPositions(initialPositions); setSelected(null); }}><RotateCcw size={15} /><span>配置を戻す</span></button>
          </div>
        </div>
        <div className="er-viewport" ref={viewport} tabIndex={0} aria-label="ER図。拡大時は縦横にスクロールできます。">
          <svg width={width * zoom} height={height * zoom} viewBox={`0 0 ${width} ${height}`} className="er-canvas" aria-labelledby="er-svg-title er-svg-description">
            <title id="er-svg-title">Giftiaの6テーブルのER図</title>
            <desc id="er-svg-description">注文ごとに注文明細が1件以上あります。会員から注文・レビュー、商品から注文明細・レビュー・シーンタグへの関係は0件以上です。見出しにフォーカスして矢印キーでも配置を変更できます。全項目は下の項目一覧でも読めます。</desc>
            <defs><pattern id="er-grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#dce6dd" /></pattern></defs>
            <rect width={width} height={height} fill="url(#er-grid)" />
            {relations.map((r, i) => {
              const from = positions[r.from]; const to = positions[r.to];
              const table = schema.find(t => t.name === r.from)!;
              const row = table.columns.findIndex(c => c[0] === r.column);
              const startY = from.y + headerHeight + row * rowHeight + 13;
              const endY = to.y + headerHeight + 13;
              const sameColumn = Math.abs(from.x - to.x) < cardWidth / 2;
              const left = r.side === 'left';
              const startX = from.x + (left ? 0 : cardWidth);
              const endX = to.x + (sameColumn ? (left ? 0 : cardWidth) : left ? cardWidth : 0);
              const bend = sameColumn ? startX + (left ? -55 : 55) : (startX + endX) / 2;
              const path = `M ${startX} ${startY} H ${bend} V ${endY} H ${endX}`;
              const active = !selected || r.from === selected || r.to === selected;
              return <g key={r.from + r.column} className={`er-relation ${active ? '' : 'er-dimmed'}`}>
                <title>{r.from}.{r.column} → {r.to}.{r.column}（{r.to}の1件に対して{r.minimum}件以上）</title>
                <path d={path} fill="none" stroke={selected && active ? '#b27835' : '#6e8f78'} strokeWidth={selected && active ? 2.8 : 1.7} strokeDasharray="6 4" />
                <circle cx={startX} cy={startY} r="4" fill="#b27835" /><circle cx={endX} cy={endY} r="4" fill="#467555" />
                <text x={startX + (left ? -21 : 21)} y={startY - 9} textAnchor="middle" className="er-cardinality">{r.minimum}..N</text>
                <text x={endX + (sameColumn ? (left ? -15 : 15) : left ? 15 : -15)} y={endY - 9 - (i === 3 ? 17 : 0)} textAnchor="middle" className="er-cardinality">1</text>
              </g>;
            })}
            {schema.map(table => {
              const p = positions[table.name]; const cardHeight = headerHeight + table.columns.length * rowHeight + 13;
              const connected = !selected || table.name === selected || relations.some(r => r.from === selected && r.to === table.name || r.to === selected && r.from === table.name);
              return <g key={table.name} transform={`translate(${p.x}, ${p.y})`} className={connected ? '' : 'er-dimmed'}>
                <rect width={cardWidth} height={cardHeight} rx="9" fill="white" stroke={selected === table.name ? '#b27835' : '#cfddd1'} strokeWidth={selected === table.name ? 2.5 : 1.5} />
                <g className="er-card-heading" role="button" tabIndex={0} aria-label={`${table.name}：${table.label}。選択で関係を強調、矢印キーで移動`} aria-pressed={selected === table.name}
                  onPointerDown={e => startDrag(e, table.name)} onPointerMove={onDrag} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}
                  onKeyDown={e => onKey(e, table.name)}>
                  <rect width={cardWidth} height={headerHeight} rx="9" fill={table.name === 'products' ? '#294d31' : '#edf4ee'} />
                  <rect y={headerHeight - 9} width={cardWidth} height="9" fill={table.name === 'products' ? '#294d31' : '#edf4ee'} />
                  <text x="16" y="27" className="er-table-name" fill={table.name === 'products' ? '#fff' : '#294d31'}>{table.name}</text>
                  <text x="16" y="49" className="er-table-label" fill={table.name === 'products' ? '#c5ddca' : '#637d69'}>{table.label}</text>
                  <text x={cardWidth - 17} y="28" textAnchor="end" fontSize="16" fill={table.name === 'products' ? '#c5ddca' : '#7c9581'}>⠿</text>
                </g>
                {table.columns.map(([column, label, key, type], index) => <g key={column}>
                  {index % 2 === 1 && <rect x="1" y={headerHeight + index * rowHeight} width={cardWidth - 2} height={rowHeight} fill="#f6f9f6" />}
                  <text x="12" y={headerHeight + index * rowHeight + 17} className="er-key">{key.includes('PK') ? 'P' : ''}{key.includes('FK') ? 'F' : ''}</text>
                  <text x="40" y={headerHeight + index * rowHeight + 17} className={`er-column ${key.includes('PK') ? 'er-pk' : ''} ${key.includes('FK') ? 'er-fk' : ''}`}>{column}</text>
                  <text x={cardWidth - 12} y={headerHeight + index * rowHeight + 17} textAnchor="end" className="er-column-label">{type}<title>{label}</title></text>
                </g>)}
              </g>;
            })}
          </svg>
        </div>
        <div className="er-legend"><span><b>P / 太字</b> 主キー</span><span><i>F / 斜体</i> 外部キー</span><span><em /> 0..N は0件以上、1..N は1件以上</span><span>移動した配置は保存されません</span></div>
        <p className="er-keyboard-note">キーボード：テーブルの見出しをTabで選択し、矢印キーで移動、Enterで関係を強調できます。スマートフォンでは図をスクロールするか、下の項目一覧をご覧ください。</p>
      </section>

      <section id="table-list" className="er-table-section" aria-labelledby="table-list-title">
        <div className="er-section-title"><p className="eyebrow">TABLES & COLUMNS</p><h2 id="table-list-title">テーブル・項目一覧</h2><p>列名、データ型、日本語の説明、キーの指定。テーブルを開くと、全項目を確認できます。</p></div>
        <div className="er-table-list">{schema.map(table => <details key={table.name} className="er-detail">
          <summary><span><code>{table.name}</code><strong>{table.label}</strong></span><span>{table.columns.length} 項目 <Plus size={16} /></span></summary>
          <div className="er-detail-content"><p>{table.description}</p><table><caption className="sr-only">{table.name}の項目</caption><thead><tr><th>列名</th><th>型</th><th>日本語の説明</th><th>キー</th></tr></thead><tbody>{table.columns.map(([column, label, key, type]) => <tr key={column}><td><code>{column}</code></td><td><code>{type}</code></td><td>{label}</td><td>{key.split(' ').filter(Boolean).map(k => k === 'PK' ? '主キー' : '外部キー').join(' / ') || '—'}</td></tr>)}</tbody></table></div>
        </details>)}</div>
      </section>

      <section className="er-reading-notes" aria-labelledby="notes-title"><div className="er-section-title"><p className="eyebrow">READING NOTES</p><h2 id="notes-title">項目を読むときに</h2></div>
        <div className="er-notes-grid"><article><span>01</span><h3>注文は、明細を通じて商品につながる</h3><p><code>orders → order_items → products</code>。購入時の単価は<code>order_items.unit_price</code>で、商品価格<code>products.price</code>とは別の項目です。</p></article>
          <article><span>02</span><h3>推定シーンと商品タグは別の情報</h3><p><code>orders.estimated_scene</code>は、用途タグと検索キーワードから分析部門が推定した値。<code>product_scenes.scene_tag</code>は、商品登録時に付けたタグです。</p></article>
          <article><span>03</span><h3>送り先のキーは、会員IDではない</h3><p><code>recipient_key</code>は送り先の匿名キー。同じ会員が同じ相手に送ると同じ値になります。元資料には、送り先の独立したテーブルはありません。</p></article></div>
      </section>
      <footer className="er-footer"><p>出典：正式なGiftia ER図（ER図.png）<br />項目の説明：ER図とDBのデータ（上位1000件）.xlsx</p><Link href="/#files"><ArrowLeft size={15} />共有資料へ戻る</Link></footer>
    </main>
  </div>;
}
