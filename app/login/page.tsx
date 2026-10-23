import type {Metadata} from 'next';
import Login from './login';
export const metadata:Metadata={title:'メンバーログイン｜チームサイト'};
const messages:Record<string,string>={approval_required:'ログインには管理者（のむりん）の承認が必要です。使用するメールアドレスを管理者に伝え、登録後にログインしてください。',invalid_link:'このブラウザーからログインメールを送信し直してください。',expired_link:'リンクが無効か、有効期限が切れています。送信し直してください。',configuration:'ログインの設定が完了していません。管理者にご確認ください。',verification_failed:'メールの確認を完了できませんでした。送信し直しても解消しない場合は管理者にご連絡ください。'};
export default async function LoginPage({searchParams}:{searchParams:Promise<{error?:string}>}){const params=await searchParams;return <Login initialError={messages[params.error??'']??''}/>}
