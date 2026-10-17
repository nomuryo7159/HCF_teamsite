import {Plus,Pencil,ArrowUpRight,Sunrise,Footprints,CalendarDays,Leaf,NotebookPen,FolderHeart} from 'lucide-react';
import type {ReactNode} from 'react';
export function Add({onClick,label='追加'}:{onClick:()=>void;label?:string}){return <button className="add-button" onClick={onClick}><Plus size={15}/>{label}</button>}
export function Edit({onClick,label}:{onClick:()=>void;label:string}){return <button className="icon-button" onClick={onClick} aria-label={label+'を編集'}><Pencil size={15}/></button>}
export function Empty({children,icon}:{children:ReactNode;icon?:ReactNode}){return <div className="empty-state">{icon&&<span className="empty-icon">{icon}</span>}<p>{children}</p></div>}
export function External({href,children}:{href:string;children:ReactNode}){return <a className="external-link" href={href} target="_blank" rel="noopener noreferrer">{children}<ArrowUpRight size={15}/></a>}
const sectionIcons={'01':Sunrise,'02':Footprints,'03':CalendarDays,'04':Leaf,'05':NotebookPen,'06':FolderHeart};
export function SectionHeading({number,title,description,action}:{number:string;title:string;description:string;action?:ReactNode}){const Icon=sectionIcons[number as keyof typeof sectionIcons]||Sunrise;return <div className="section-heading"><div><p className="eyebrow"><span className="section-number">{number}</span><span className="section-symbol"><Icon size={17} strokeWidth={1.7} aria-hidden="true"/></span> TEAM WORKSPACE</p><h2>{title}</h2><p className="section-description">{description}</p></div>{action}</div>}
