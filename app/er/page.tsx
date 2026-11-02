import type { Metadata } from 'next';
import Diagram from './diagram';
import './er.css';

export const metadata: Metadata = {
  title: 'Giftia ER図｜チーム健康第一',
  description: 'Giftiaの7テーブル・44項目と参照関係。提供されたExcelをもとに整理したER図と項目一覧。',
};

export default function ERPage() {
  return <Diagram />;
}
