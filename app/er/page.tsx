import type { Metadata } from 'next';
import Diagram from './diagram';
import './er.css';

export const metadata: Metadata = {
  title: 'Giftia ER図｜チーム健康第一',
  description: 'Giftiaの6テーブル・40項目と参照関係。正式なGiftia ER図に基づくER図と項目一覧。',
};

export default function ERPage() {
  return <Diagram />;
}
