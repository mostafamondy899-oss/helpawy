import {useState} from "react";
import {Link,useParams,useSearchParams} from "react-router-dom";
import {DATA,site} from "../lib/catalog";
import {CATS,EVENTS,EXPERTS,JOURNEY,RES,SERVICES,STAGES,SN} from "../data/seed";
import type {Item,Kind} from "../types";
const hay=(x:Item,t:(s:string)=>string)=>`${x.name} ${x.d} ${x.cat} ${t(x.name)} ${t(x.d)} ${t(x.cat)}`.toLowerCase();
import {useAuth} from "../context/AuthContext";
import {useI18n} from "../lib/i18n";
import {CardGrid,Empty,Page,Sec} from "../components/ui";
const TITLE:Record<Kind,[string,string]>={s:["Services","Support across seven categories, matched to your stage."],x:["Experts","Mentors and specialists. All profiles are sample data."],e:["Workshops & events","Learn and connect. Sample events."],r:["Resources","Guides, templates, checklists and tools."]};
export function Home(){
  const {t}=useI18n();const {user}=useAuth();
  return <>
    <section className="hero"><div className="w"><div>
      <h1>{site.h||t("Turn Your Business Idea Into Your Next Step.")}</h1>
      <p>{t("Helpawy connects entrepreneurs with the right services, experts, resources and learning based on their business stage and needs, then shows exactly what to do next.")}</p>
      <p><Link className="btn g" to={user?"/dashboard":"/signup"}>{t("Start Your Journey")}</Link> <Link className="btn o" style={{color:"#fff",borderColor:"#fff"}} to="/services">{t("Explore Services")}</Link></p>
      <div className="rib">{JOURNEY.map(j=><span key={j[0]}>{t(j[0])}</span>)}</div></div>
      <img className="logo" src="/logo.jpg" alt="Helpawy logo"/></div></section>
    <Sec title="How Helpawy works" sub="Seven steps from idea to progress."><div className="steps">{JOURNEY.map((j,i)=><div key={j[0]}><b>0{i+1}</b><h3>{t(j[0])}</h3><p className="mut">{t(j[1])}</p></div>)}</div></Sec>
    <Sec title="Business stages" sub="Pick where you are. Helpawy adapts."><div className="grid">{STAGES.map(s=><div className="card" key={s[0]}><h3>{t(s[0])}</h3><p className="mut">{t(s[1])}</p></div>)}</div></Sec>
    <Sec title="Services"><CardGrid kind="s" items={SERVICES.slice(0,6)}/></Sec>
    <Sec title="Experts"><CardGrid kind="x" items={EXPERTS.slice(0,3)}/></Sec>
    <Sec title="Workshops & events"><CardGrid kind="e" items={EVENTS.slice(0,2)}/></Sec>
    <Sec title="Resources"><CardGrid kind="r" items={RES.slice(0,3)}/></Sec>
    <Sec title="Testimonials" sub="Sample content – real testimonials will replace these"><div className="grid"><div className="card"><p>{t("“I finally knew which step came next.”")}</p><p className="mut">{t("Sample founder")}</p></div><div className="card"><p>{t("“The recommendations matched my stage.”")}</p><p className="mut">{t("Sample business owner")}</p></div></div></Sec>
  </>;
}
export function About(){const {t}=useI18n();const B=[["The problem","Founders struggle to know where to start, find reliable services and experts, and turn knowledge into action."],["Our vision","Help businesses access the right support at the right time."],["Our mission","Make business support simpler, personalized, accessible and actionable."],["Who it is for","Startups, small businesses, entrepreneurs, business owners and people with business ideas."]];
  return <Page title="About Helpawy" sub="Helpawy is a business support and growth platform that guides entrepreneurs from idea to implementation."><div className="grid">{B.map(b=><div className="card" key={b[0]}><h3>{t(b[0])}</h3><p className="mut">{t(b[1])}</p></div>)}</div></Page>}
export function ListPage({kind}:{kind:Kind}){
  const {t}=useI18n();const [q,setQ]=useState("");const [st,setSt]=useState("");const [cat,setCat]=useState("");
  const items=DATA[kind].filter(x=>(!q||hay(x,t).includes(q.toLowerCase()))&&(!st||x.st.includes(st))&&(!cat||x.cat===cat));
  return <Page title={TITLE[kind][0]} sub={TITLE[kind][1]}>
    <div className="fl"><input type="search" placeholder={t("Search…")} aria-label={t("Search")} value={q} onChange={e=>setQ(e.target.value)}/>
      <select aria-label={t("Business stage")} value={st} onChange={e=>setSt(e.target.value)}><option value="">{t("All stages")}</option>{SN.map(s=><option key={s} value={s}>{t(s)}</option>)}</select>
      <select aria-label={t("Category")} value={cat} onChange={e=>setCat(e.target.value)}><option value="">{t("All categories")}</option>{CATS.map(s=><option key={s} value={s}>{t(s)}</option>)}</select></div>
    <CardGrid kind={kind} items={items}/></Page>;
}
export function EventPage(){
  const {id}=useParams();const {user,update}=useAuth();const {t}=useI18n();const e=EVENTS.find(x=>x.id===id);
  if(!e)return <Page title="Event not found"><Empty title="This event does not exist" hint="Back to events"/></Page>;
  const on=!!user?.reg.includes(e.id);
  return <Page title={e.name} sub={e.d}><div className="card"><p>{t(`${e.date} at ${e.time} · ${e.loc} · ${e.mode}`)}</p><p>{t(`Speaker: ${e.spk}`)}</p>
    <div className="row">{user?<button className="btn" onClick={()=>update(u=>{if(!u.reg.includes(e.id)){u.reg.push(e.id);u.log=[`Registered: ${e.name}`,...u.log].slice(0,8)}})}>{t(on?"Registered ✓":"Register Now")}</button>:<Link className="btn" to="/login">{t("Log in to register")}</Link>}</div></div></Page>;
}

export function Community(){
  const {t}=useI18n();const B=[["Business owners circle","Peer discussions by industry."],["Collaboration board","Find partners for projects."],["Networking opportunities","Introductions to relevant people."],["Discussions","Questions answered by members and experts."]];
  return <Page title="Community" sub="Structured spaces for business owners."><div className="grid">{B.map(b=><div className="card" key={b[0]}><h3>{t(b[0])}</h3><p className="mut">{t(b[1])}</p><span className="demo">{t("Sample")}</span></div>)}</div>
    <h2 style={{marginTop:28}}>{t("Related events")}</h2><CardGrid kind="e" items={DATA.e.filter(e=>e.cat==="Networking")}/></Page>;
}
export function SearchPage(){
  const [sp]=useSearchParams();const {t}=useI18n();const q=(sp.get("q")??"").trim();const ql=q.toLowerCase();
  const kinds:Kind[]=["s","x","e","r"];const hits=kinds.map(k=>({k,l:ql?DATA[k].filter(x=>hay(x,t).includes(ql)):[]})).filter(h=>h.l.length);
  return <Page title="Search" sub={`Results for “${q}”`}>{hits.length?hits.map(h=><div key={h.k}><h2 style={{marginTop:24}}>{t(TITLE[h.k][0])}</h2><CardGrid kind={h.k} items={h.l}/></div>):<Empty title="Nothing found" hint="Try a topic like marketing, brand or launch."/>}</Page>;
}
