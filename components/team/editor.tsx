'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {X,LoaderCircle,Trash2} from 'lucide-react';
import {type Editing,type Entry,type Kind,labels,today} from './types';
type Field={name:string;label:string;type?:string;required?:boolean;options?:{value:string;label:string}[]};
export default function Editor({editing,records,onSave,onDelete,onClose}:{editing:Editing;records:Entry[];onSave:(data:Record<string,unknown>)=>Promise<void>;onDelete?:()=>Promise<void>;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null); const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const [confirmDelete,setConfirmDelete]=useState(false);
 useEffect(()=>{dialog.current?.showModal();return ()=>dialog.current?.close()},[]);
 const members=records.filter(r=>r.kind==='member').map(r=>({value:r.data.name,label:r.data.name}));
 const assignee:Field={name:'assignee',label:'担当',type:'select',options:[{value:'',label:'未定'},{value:'全員',label:'全員'},...members]};
 const title:Field={name:'title',label:'タイトル',required:true};
 const date:Field={name:'date',label:'日付',type:'date',required:true};
 const url:Field={name:'url',label:'リンク先URL',type:'url'};
 const fields:Record<Kind,Field[]>={
 team:[{name:'name',label:'チーム名',required:true},{name:'mission',label:'チームの目的',type:'textarea',required:true}],
 member:[{name:'name',label:'表示名',required:true},{name:'badge',label:'バッジ（名前の横に表示。例：班長）'},{name:'role',label:'肩書き・担当（例：IT法務・コンプラ）'},{name:'tags',label:'趣味タグ（カンマ区切り・絵文字可。例：🚃 ローカル線, 🐕 保護犬）'},{name:'mbti',label:'MBTI'},{name:'focus',label:'注力'},{name:'schedule',label:'時間（活動しやすい時間帯）'},{name:'values',label:'価値観'},{name:'bio',label:'ひとこと・自己紹介',type:'textarea'},{name:'url',label:'自己紹介ページのURL',type:'url'},{name:'status',label:'参加状況',type:'select',options:[{value:'active',label:'参加中'},{value:'pending',label:'参加予定'}]}],
 rule:[title,{name:'body',label:'内容',type:'textarea'}],
 phase:[title,assignee,{name:'startDate',label:'開始日',type:'date'},{name:'endDate',label:'終了日',type:'date'}],
 task:[title,assignee,{name:'phaseId',label:'工程',type:'select',options:[{value:'',label:'工程なし'},...records.filter(r=>r.kind==='phase').map(r=>({value:r.id,label:r.data.title}))]},{name:'dueDate',label:'期限',type:'date'},{name:'completed',label:'完了',type:'checkbox'}],
 event:[title,date,{name:'startTime',label:'開始時刻',type:'time'},{name:'endTime',label:'終了時刻',type:'time'},{name:'description',label:'詳細',type:'textarea'},url],
 thread:[title,{name:'startDate',label:'週の開始日',type:'date'},{name:'endDate',label:'週の終了日',type:'date'},{name:'summary',label:'週の要約',type:'textarea'},url],
 minute:[title,date,{name:'summary',label:'要約',type:'textarea'},{name:'body',label:'本文',type:'textarea',required:true},{name:'tags',label:'タグ（カンマ区切り）'}],
 resource:[title,{name:'category',label:'分類（例：共有フォルダ、GitHub、設計資料）'},{name:'description',label:'説明',type:'textarea'},{...url,required:true}]
 };
 const existing=(editing.entry?.data??{}) as Record<string,unknown>;
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const form=new FormData(e.currentTarget);const data:Record<string,unknown>={};for(const f of fields[editing.kind])data[f.name]=f.type==='checkbox'?form.has(f.name):f.name==='tags'?String(form.get(f.name)||'').split(/[,、]/).map(x=>x.trim()).filter(Boolean):String(form.get(f.name)||'').trim();
 if(editing.kind==='task')data.completedAt=data.completed?(existing.completedAt||today()):'';
 setBusy(true);setError('');try{await onSave(data)}catch(err){setError(err instanceof Error?err.message:'保存できませんでした。');}finally{setBusy(false)}}
 return <dialog ref={dialog} className="edit-dialog" onCancel={e=>{e.preventDefault();if(!busy)onClose()}} aria-labelledby="edit-heading"><form onSubmit={submit}>
 <div className="dialog-heading"><div><span className="eyebrow">TEAM WORKSPACE</span><h2 id="edit-heading">{labels[editing.kind]}を{editing.entry?'編集':'追加'}</h2></div><button type="button" className="icon-button" aria-label="閉じる" disabled={busy} onClick={onClose}><X size={20}/></button></div>
 <p className="form-note">保存した内容はすべて公開されます。連絡先などの非公開情報は入力しないでください。</p>
 <div className="form-fields">{fields[editing.kind].map(f=>{const current=existing[f.name]??(f.name==='date'?today():f.name==='status'?'active':'');const value=Array.isArray(current)?current.join(', '):String(current);return <label key={f.name} className={f.type==='checkbox'?'checkbox-field':''}><span>{f.label}{f.required&&<small>必須</small>}</span>{f.type==='textarea'?<textarea name={f.name} defaultValue={value} rows={f.name==='body'?8:3} maxLength={20000} required={f.required}/>:f.type==='select'?<select name={f.name} defaultValue={value}>{current&&!f.options?.some(o=>o.value===current)&&<option value={value}>{value}</option>}{f.options?.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>:f.type==='checkbox'?<input type="checkbox" name={f.name} defaultChecked={current===true}/>:<input name={f.name} type={f.type||'text'} defaultValue={value} required={f.required} maxLength={f.type==='url'?2000:200}/>}</label>})}</div>
 {error&&<p role="alert" className="error-box">{error}</p>}
 {confirmDelete&&<div className="delete-confirm"><p>この{labels[editing.kind]}を削除しますか？削除すると元に戻せません。</p><button type="button" className="danger-button" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await onDelete?.()}catch(err){setError(err instanceof Error?err.message:'削除できませんでした。')}finally{setBusy(false)}}}>削除する</button><button type="button" className="text-button" onClick={()=>setConfirmDelete(false)}>戻る</button></div>}
 <div className="dialog-footer">{onDelete&&!confirmDelete&&<button type="button" className="text-button danger" disabled={busy} onClick={()=>setConfirmDelete(true)}><Trash2 size={15}/>削除</button>}<div className="footer-actions"><button type="button" className="secondary-button" disabled={busy} onClick={onClose}>キャンセル</button><button className="primary-button" disabled={busy}>{busy&&<LoaderCircle size={16} className="spin"/>}{busy?'保存中…':'保存する'}</button></div></div>
 </form></dialog>
}
