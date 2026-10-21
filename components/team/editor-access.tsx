'use client';
import {useEffect,useState,type FormEvent} from 'react';
import {ShieldCheck,Plus,UserMinus} from 'lucide-react';
import {request} from './types';
export default function EditorAccess(){const [editors,setEditors]=useState<{email:string}[]>([]);const [email,setEmail]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [loaded,setLoaded]=useState(false);
 async function load(){const d=await request<{editors:{email:string}[]}>('/api/editors');setEditors(d.editors);setLoaded(true)}
 useEffect(()=>{void load().catch(e=>setError(e instanceof Error?e.message:'取得できませんでした。'))},[]);
 async function add(e:FormEvent){e.preventDefault();setBusy(true);setError('');try{await request('/api/editors','POST',{email});setEmail('');await load()}catch(e){setError(e instanceof Error?e.message:'追加できませんでした。')}finally{setBusy(false)}}
 async function remove(email:string){if(!confirm('このメンバーの編集権限を解除しますか？'))return;setBusy(true);setError('');try{await request('/api/editors','DELETE',{email});await load()}catch(e){setError(e instanceof Error?e.message:'解除できませんでした。')}finally{setBusy(false)}}
 return <section className="owner-panel panel" id="settings"><div className="panel-title"><h3><ShieldCheck size={19}/>編集メンバーの管理</h3><span className="pill">管理者限定</span></div><p className="muted small">管理者はのむりんさんです。追加する方のChatGPTログイン用メールアドレスを登録してください。登録すると、その方のログインと編集を承認します。メールは公開されず、招待メールも送信されません。</p><form className="access-form" onSubmit={add}><label className="sr-only" htmlFor="editor-email">追加するメンバーのメールアドレス</label><input id="editor-email" type="email" placeholder="member@example.com" required value={email} onChange={e=>setEmail(e.target.value)}/><button className="primary-button" disabled={busy}><Plus size={16}/>承認して編集者を追加</button></form>{loaded&&editors.length===0&&<p className="muted small">追加の編集者はまだいません。</p>}{editors.map(e=><div className="editor-row" key={e.email}><span>{e.email}</span><button className="text-button danger" disabled={busy} onClick={()=>void remove(e.email)}><UserMinus size={15}/>権限を解除</button></div>)}{error&&<p className="error-box" role="alert">{error}</p>}</section>
}
