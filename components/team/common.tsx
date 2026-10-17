import {Plus,Pencil,ArrowUpRight} from 'lucide-react';
import type {ReactNode} from 'react';
export function Add({onClick,label='追加'}:{onClick:()=>void;label?:string}){return <button className="add-button" onClick={onClick}><Plus size={15}/>{label}</button>}
export function Edit({onClick,label}:{onClick:()=>void;label:string}){return <button className="icon-button" onClick={onClick} aria-label={label+'を編集'}><Pencil size={15}/></button>}
export function Empty({children,icon}:{children:ReactNode;icon?:ReactNode}){return <div className="empty-state">{icon&&<span className="empty-icon">{icon}</span>}<p>{children}</p></div>}
export function External({href,children}:{href:string;children:ReactNode}){return <a className="external-link" href={href} target="_blank" rel="noopener noreferrer">{children}<ArrowUpRight size={15}/></a>}
export function SectionHeading({number,title,description,action}:{number:string;title:string;description:string;action?:ReactNode}){return <div className="section-heading"><div><p className="eyebrow"><span className="section-number">{number}</span> TEAM WORKSPACE</p><h2>{title}</h2><p className="section-description">{description}</p></div>{action}</div>}
