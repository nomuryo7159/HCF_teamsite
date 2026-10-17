import type {Entry} from './types';
import {dateLabel,today} from './types';
export default function Timeline({phases}:{phases:Entry<'phase'>[]}){
 const scheduled=phases.filter(p=>p.data.startDate&&p.data.endDate);
 if(!scheduled.length)return null;
 const dayMs=86400000; const starts=scheduled.map(p=>Date.parse(p.data.startDate+'T00:00:00Z'));const ends=scheduled.map(p=>Date.parse(p.data.endDate+'T00:00:00Z'));
 const start=Math.min(...starts);const end=Math.max(...ends)+dayMs;const duration=Math.max(dayMs,end-start);const current=(Date.parse(today()+'T00:00:00Z')-start)/duration*100;
 const markers=Array.from({length:6},(_,i)=>new Date(start+duration*i/6).toISOString().slice(0,10));
 return <div className="timeline-wrap"><p className="list-caption">週ごとの計画 <span>工程の期間</span></p><div className="timeline"><div className="timeline-heading"><span>工程</span><div>{markers.map((m,i)=><span key={i}>{dateLabel(m)}</span>)}</div></div>{scheduled.map(p=>{const left=(Date.parse(p.data.startDate+'T00:00:00Z')-start)/duration*100;const width=(Date.parse(p.data.endDate+'T00:00:00Z')+dayMs-Date.parse(p.data.startDate+'T00:00:00Z'))/duration*100;return <div className="timeline-row" key={p.id}><span>{p.data.title}</span><div className="timeline-track">{current>=0&&current<=100&&<i className="timeline-today" style={{left:current+'%'}} title="今日"/>}<span className="timeline-bar" style={{left:left+'%',width:width+'%'}} title={`${p.data.title}: ${p.data.startDate} – ${p.data.endDate}`}/></div></div>})}</div></div>
}
