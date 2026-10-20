import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Tech0 13期 チーム健康第一',description:'チームの計画、タスク、予定、議事録をひとつの場所に。のむりん・ゆきち・参加予定メンバーの公開チームサイト。',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ja"><body>{children}</body></html>}
