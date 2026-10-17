import type {Metadata} from 'next';
import Guide from './guide';
export const metadata:Metadata={title:'実装ガイド｜チームサイト',description:'チームサイトの起動手順、画面とデータの流れ、ファイルごとの説明と確認方法。'};
export default function GuidePage(){return <Guide/>}
