import type { Metadata } from 'next';
import Guide from '../guide';

export const metadata: Metadata = { title: 'チームサイトの開発手順' };

export default function TeamSiteGuidePage() {
  return <Guide />;
}
