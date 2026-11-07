import {Fragment,useEffect,useState,type FormEvent} from "react";
import {CATS,JOURNEY,SN,ini} from "../data/seed";
import type {Item,Kind,User} from "../types";
import {DATA,remoteDelete,remoteSetting,remoteUpsert,saveCatalog,site} from "../lib/catalog";
import {WEIGHTS,journeyFlags,pct} from "../lib/recommend";
import {useI18n} from "../lib/i18n";
import {repo} from "../services/repo";
import {Empty,Page,Progress} from "../components/ui";
type Tab="stats"|"users"|"rules"|"site"|Kind;
const TABS:[Tab,string][]=[["stats","Analytics"],["users","Users"],["s","Services"],["x","Experts"],["e","Events"],["r","Resources"],["rules","Recommendation rules"],["site","Content"]];
type F=[string,string,("cat"|"mode"|"date")?];
const CF:Record<Kind,F[]>={s:[["name","Name"],["d","Description"],["cat","Category","cat"],["ic","Icon"]],x:[["name","Name"],["title","Job title"],["ind","Industry"],["cat","Category","cat"],["d","Short bio"]],e:[["name","Name"],["d","Description"],["spk","Speaker"],["date","Date","date"],["time","Time"],["loc","Location"],["mode","Mode","mode"],["cat","Category","cat"]],r:[["name","Name"],["d","Description"],["type","Type"],["lvl","Level"],["cat","Category","cat"]]};
const row=(a:string,b:number):[string,number]=>[a,b];
const H=({children}:{children:string})=>{const {t}=useI18n();return <h2 style={{marginTop:24}}>{t(children)}</h2>};
function Bars({rows}:{rows:[string,number][]}){const {t}=useI18n();const m=Math.max(1,...rows.map(r=>r[1]));
  return <>{rows.map(r=><div className="bg" key={r[0]}><b>{t(r[0])}</b><div className="bar"><i style={{width:`${r[1]/m*100}%`}}/></div>{r[1]}</div>)}</>}
function Stats({users}:{users:User[]}){
  const {t}=useI18n();const avg=users.length?Math.round(users.reduce((a,u)=>a+pct(u),0)/users.length):0;
  const cnt=(k:"req"|"reg"|"used",id:string)=>users.filter(u=>u[k].includes(id)).length;
  return <><div className="grid">{[["Total users",String(users.length)],["Active users",String(users.filter(u=>u.log.length>1).length)],["Journey completion",avg+"%"]].map(k=><div className="card" key={k[0]}><div className="mut">{t(k[0])}</div><h2>{k[1]}</h2></div>)}</div>
    <H>Users by stage</H><Bars rows={SN.map(s=>row(s,users.filter(u=>u.profile?.stage===s).length))}/>
    <H>Most requested services</H><Bars rows={DATA.s.map(x=>row(x.name,cnt("req",x.id)))}/>
    <H>Most used resources</H><Bars rows={DATA.r.map(x=>row(x.name,cnt("used",x.id)))}/>
    <H>Most registered events</H><Bars rows={DATA.e.map(x=>row(x.name,cnt("reg",x.id)))}/>
    <H>Most common needs</H><Bars rows={CATS.map(c=>row(c,users.filter(u=>u.profile?.challenge===c).length))}/>
    <H>Drop-off by journey step</H><Bars rows={JOURNEY.map((j,i)=>row(j[0],users.filter(u=>u.profile&&journeyFlags(u)[i]).length))}/></>;
}
function Users({users,onDelete}:{users:User[];onDelete:(id:string)=>void}){
  const {t}=useI18n();const [q,setQ]=useState("");const [open,setOpen]=useState<string|null>(null);const l=users.filter(u=>`${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()));
  return <><div className="fl"><input type="search" placeholder={t("Search…")} aria-label={t("Search")} value={q} onChange={e=>setQ(e.target.value)}/></div>
    {l.length?<div className="tw"><table><thead><tr><th>{t("Name")}</th><th>{t("Email")}</th><th>{t("Stage")}</th><th>{t("Progress")}</th><th>{t("Actions")}</th></tr></thead>
      <tbody>{l.map(u=><Fragment key={u.id}><tr><td>{u.name}</td><td>{u.email}</td><td>{u.profile?t(u.profile.stage):"—"}</td><td>{u.profile?pct(u)+"%":"—"}</td>
        <td><button className="btn s o" onClick={()=>setOpen(open===u.id?null:u.id)}>{t("View")}</button> <button className="btn s o" onClick={()=>onDelete(u.id)}>{t("Delete")}</button></td></tr>
        {open===u.id&&<tr><td colSpan={5}>{u.profile?<><p>{t(`${u.profile.type} · ${u.profile.stage} · Goal: ${u.profile.goal}`)}</p><Progress value={pct(u)}/>
          <ul className="js">{JOURNEY.map((j,i)=><li key={j[0]}>{journeyFlags(u)[i]?"✓ ":"○ "}{t(j[0])}</li>)}</ul></>:<p>—</p>}</td></tr>}</Fragment>)}</tbody></table></div>:<Empty title="No users match" hint=""/>}</>;
}
function Cms({kind}:{kind:Kind}){
  const {t}=useI18n();const arr=DATA[kind];const [edit,setEdit]=useState<string|null>(null);const [adding,setAdding]=useState(false);const [,tick]=useState(0);const [err,setErr]=useState("");const fail=(x:unknown)=>setErr(x instanceof Error?x.message:String(x));
  const it:Item|undefined=edit?arr.find(x=>x.id===edit):undefined;
  const v=(k:string)=>it?String((it as unknown as Record<string,unknown>)[k]??""):"";
  const done=()=>{saveCatalog();setEdit(null);setAdding(false);tick(n=>n+1)};
  const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=new FormData(e.currentTarget);const o:Record<string,unknown>={};
    CF[kind].forEach(([k])=>{o[k]=String(f.get(k)??"")});const st=f.getAll("st").map(String);o.st=st.length?st:[...SN];
    if(kind==="x")o.ic=ini(String(o.name));if(kind==="s"&&!o.ic)o.ic="🧩";if(kind==="r"&&!it)o.min=10;
    let tgt:Item;if(it){tgt=Object.assign(it,o)}else{tgt={...o,id:kind+Date.now()} as unknown as Item;arr.push(tgt)}setErr("");remoteUpsert(kind,tgt).catch(fail);done()};
  const del=(id:string)=>{const i=arr.findIndex(x=>x.id===id);if(i>=0)arr.splice(i,1);remoteDelete(kind,id).catch(fail);done()};
  return <><button className="btn s" onClick={()=>{setAdding(true);setEdit(null)}}>{t("Add new")}</button>{err&&<p className="err" role="alert">{err}</p>}
    {(adding||it)&&<form className="fm" style={{maxWidth:"none",margin:"16px 0"}} key={edit??"new"} onSubmit={submit}>
      {CF[kind].map(([k,l,ty])=><label key={k}>{t(l)}{ty==="cat"?<select name={k} defaultValue={v(k)||CATS[0]}>{CATS.map(c=><option key={c} value={c}>{t(c)}</option>)}</select>
        :ty==="mode"?<select name={k} defaultValue={v(k)||"Online"}>{["Online","Offline"].map(m=><option key={m} value={m}>{t(m)}</option>)}</select>
        :<input name={k} type={ty==="date"?"date":"text"} defaultValue={v(k)} required={k==="name"}/>}</label>)}
      <fieldset><legend>{t("Business stages")}</legend>{SN.map(s=><label key={s} style={{display:"inline-flex",gap:6,marginInlineEnd:10}}><input type="checkbox" name="st" value={s} defaultChecked={!it||it.st.includes(s)}/>{t(s)}</label>)}</fieldset>
      <div className="row"><button className="btn">{t("Save changes")}</button><button type="button" className="btn o" onClick={()=>{setEdit(null);setAdding(false)}}>{t("Cancel")}</button></div></form>}
    <div className="tw"><table><thead><tr><th>{t("Name")}</th><th>{t("Category")}</th><th>{t("Actions")}</th></tr></thead>
      <tbody>{arr.map(x=><tr key={x.id}><td>{t(x.name)}</td><td>{t(x.cat)}</td><td><button className="btn s o" onClick={()=>{setEdit(x.id);setAdding(false)}}>{t("Edit")}</button> <button className="btn s o" onClick={()=>del(x.id)}>{t("Delete")}</button></td></tr>)}</tbody></table></div></>;
}
function Rules(){
  const {t}=useI18n();const [w,setW]=useState({...WEIGHTS});const [ok,setOk]=useState(false);const [err,setErr]=useState("");
  const field=(k:"c"|"s"|"i",l:string)=><label>{t(l)}<input type="number" value={w[k]} onChange={e=>setW({...w,[k]:Number(e.target.value)})}/></label>;
  return <form className="fm" style={{maxWidth:"none",margin:0}} onSubmit={e=>{e.preventDefault();Object.assign(WEIGHTS,w);saveCatalog();setErr("");remoteSetting("weights",WEIGHTS).then(()=>setOk(true)).catch(x=>setErr(String(x)))}}><h3>{t("Scoring weights")}</h3>
    {field("c","Matches the user’s biggest challenge")}{field("s","Matches the user’s stage")}{field("i","Matches an interest")}{ok&&<div className="ok" role="status">{t("Saved")}</div>}{err&&<p className="err" role="alert">{err}</p>}<button className="btn">{t("Save changes")}</button></form>;
}
function SiteForm(){
  const {t}=useI18n();const [h,setH]=useState(site.h);const [ok,setOk]=useState(false);const [err,setErr]=useState("");
  return <form className="fm" style={{maxWidth:"none",margin:0}} onSubmit={e=>{e.preventDefault();site.h=h;saveCatalog();setErr("");remoteSetting("site",site).then(()=>setOk(true)).catch(x=>setErr(String(x)))}}>
    <label>{t("Home headline")}<input value={h} onChange={e=>setH(e.target.value)}/></label>{ok&&<div className="ok" role="status">{t("Saved")}</div>}{err&&<p className="err" role="alert">{err}</p>}<button className="btn">{t("Save changes")}</button></form>;
}
export function Admin(){
  const {t}=useI18n();const [tab,setTab]=useState<Tab>("stats");const [users,setUsers]=useState<User[]|null>(null);const [err,setErr]=useState("");
  const fail=(e:unknown)=>setErr(e instanceof Error?e.message:String(e));
  const load=()=>repo.listUsers().then(setUsers).catch(fail);
  useEffect(()=>{void load()},[]);
  const remove=(id:string)=>{setErr("");repo.removeUser(id).then(load).catch(fail)};
  return <Page title="Admin dashboard"><div className="fl">{TABS.map(([k,l])=><button key={k} className={"btn s"+(tab===k?"":" o")} onClick={()=>setTab(k)}>{t(l)}</button>)}</div>
    {err&&<p className="err" role="alert">{err}</p>}
    {tab==="stats"&&(users?<Stats users={users}/>:<p className="mut">…</p>)}{tab==="users"&&users&&<Users users={users} onDelete={remove}/>}
    {tab==="rules"&&<Rules/>}{tab==="site"&&<SiteForm/>}{(tab==="s"||tab==="x"||tab==="e"||tab==="r")&&<Cms key={tab} kind={tab}/>}</Page>;
}
