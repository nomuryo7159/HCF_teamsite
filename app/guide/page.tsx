import type { Metadata } from 'next';
import Link from 'next/link';
import GiftiaDevelopment from './giftia-development';
import GiftiaGuide from './giftia';
import './giftia.css';

export const metadata: Metadata = {
  title: '実装ガイド — Giftia',
  description: 'Giftiaの開発環境、GitHubでの作業、担当と実装順、主要ファイルを確認できます。',
};

export default function GuidePage() {
  return (
    <div className="guide-page giftia-page">
      <header className="guide-header">
        <Link className="guide-back" href="/">← チームサイトへ戻る</Link>
        <Link className="guide-back" href="/guide/team-site">チームサイトの開発手順</Link>
      </header>
      <main id="giftia" className="guide-main giftia-main">
        <h1>実装ガイド — Giftia</h1>
        <p>暫定版（2026年11月12日の仮確定に基づく）。送別品を選ぶ人の購入判断を後押しする施策の開発手順です。</p>
        <GiftiaDevelopment />
        <GiftiaGuide />
      </main>
    </div>
  );
}
