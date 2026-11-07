import type {ReactNode} from "react";
import type {Item,Kind} from "../types";
import {useI18n} from "../lib/i18n";
import {ItemCard} from "./Card";
export const Progress=({value}:{value:number})=><div className="bar" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><i style={{width:`${value}%`}}/></div>;
export function Page({title,sub,children}:{title:string;sub?:string;children:ReactNode}){const {t}=useI18n();return <div className="app"><div className="w"><h1 style={{fontSize:"1.9rem"}}>{t(title)}</h1>{sub&&<p className="mut">{t(sub)}</p>}{children}</div></div>}
export function Sec({title,sub,children}:{title:string;sub?:string;children:ReactNode}){const {t}=useI18n();return <section className="sec"><div className="w"><h2>{t(title)}</h2>{sub&&<p className="mut">{t(sub)}</p>}{children}</div></section>}
export function Empty({title,hint}:{title:string;hint:string}){const {t}=useI18n();return <div className="empty"><b>{t(title)}</b><br/>{t(hint)}</div>}
export function CardGrid({kind,items}:{kind:Kind;items:Item[]}){if(!items.length)return <Empty title="No matches" hint="Try changing your filters or search."/>;return <div className="grid">{items.map(x=><ItemCard key={x.id} kind={kind} item={x}/>)}</div>}
