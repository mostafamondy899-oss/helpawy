import {useEffect,useState} from "react";
import {Link,useNavigate} from "react-router-dom";
import {EVENTS,EXPERTS,JOURNEY,RES,SERVICES} from "../data/seed";
import type {ChatMsg,TaskState} from "../types";
import {useAuth} from "../context/AuthContext";
import {useI18n} from "../lib/i18n";
import {cycleTask,journeyFlags,nextTask,notifs,pct,plan,top} from "../lib/recommend";
import {askAI,type AIResult} from "../services/ai";
import {CardGrid,Empty,Page,Progress} from "../components/ui";
const H=({children}:{children:string})=>{const {t}=useI18n();return <h2 style={{marginTop:28}}>{t(children)}</h2>};
export function Dashboard(){
  const {user,update}=useAuth();const {t}=useI18n();const nav=useNavigate();
  if(!user?.profile)return null;const p=user.profile,next=nextTask(user),pc=pct(user);
  const col=(k:TaskState,l:string)=><div><b>{t(l)}</b>{plan(p).filter(x=>(user.tasks[x.id]??"todo")===k).map(x=><button key={x.id} className="tk" onClick={()=>update(u=>cycleTask(u,x.id))}>{t(x.t)}</button>)}</div>;
  return <Page title={t("Welcome back, ")+user.name} sub={`${p.type} — ${p.stage}`}>
    <div className="two"><div className="next"><h3>{t("Your next step")}</h3>{next?<><h2>{t(next.t)}</h2><p>{t(`Chosen from your ${p.challenge} challenge and ${p.stage} stage.`)}</p><button className="btn g" onClick={()=>{update(u=>{u.tasks[next.id]="doing"});nav("/journey")}}>{t("Continue")}</button></>:<><h2>{t("Your plan is complete")}</h2><p>{t("Ask Helpawy AI for new goals.")}</p></>}</div>
      <div className="card"><h3>{t("Journey progress")}</h3><h2>{pc}%</h2><Progress value={pc}/><Link to="/journey">{t("View my journey")}</Link></div></div>
    <H>Recommended services</H><CardGrid kind="s" items={top(SERVICES,p,3)}/><H>Recommended resources</H><CardGrid kind="r" items={top(RES,p,3)}/>
    <H>Upcoming events</H><CardGrid kind="e" items={top(EVENTS,p,2)}/><H>Recommended experts</H><CardGrid kind="x" items={top(EXPERTS,p,2)}/>
    <H>Tasks</H><div className="col">{col("todo","Pending")}{col("doing","In progress")}{col("done","Completed")}</div>
    <H>Recent activity</H>{user.log.length?<ul>{user.log.map((l,i)=><li key={i}>{t(l)}</li>)}</ul>:<Empty title="No activity yet" hint="Complete a task to see it here."/>}
    <p><Link className="btn" to="/ai">{t("Ask Helpawy AI")}</Link></p></Page>;
}
export function Journey(){
  const {user,update}=useAuth();const {t}=useI18n();if(!user?.profile)return null;const f=journeyFlags(user),cur=f.indexOf(false);
  return <Page title="My journey" sub="Where you are, what you finished, and what comes next."><Progress value={pct(user)}/>
    <ul className="js">{JOURNEY.map((j,i)=><li key={j[0]} className={f[i]?"d":i===cur?"c":""}>{f[i]?"✓ ":i===cur?"● ":"○ "}{i===cur&&t("Current:")+" "}<b>{t(j[0])}</b> — {t(j[1])}</li>)}</ul>
    <H>Your tasks</H>{plan(user.profile).map(x=><button key={x.id} className="tk" onClick={()=>update(u=>cycleTask(u,x.id))}>{({done:"✓ ",doing:"◐ ",todo:"○ "})[user.tasks[x.id]??"todo"]}{t(x.t)}</button>)}</Page>;
}
export function AIPage(){
  const {user,update}=useAuth();const {t}=useI18n();const nav=useNavigate();const [busy,setBusy]=useState(false);const [text,setText]=useState("");
  if(!user?.profile)return null;const p=user.profile,nt=nextTask(user);
  const hi:ChatMsg={r:"a",t:`Hi ${user.name}! I see you are in the ${p.stage} stage and want to “${p.goal}”. What would you like help with?`};
  const msgs=user.chat.length?user.chat:[hi];
  const send=async(m:string)=>{if(!m.trim()||busy)return;setText("");update(u=>{u.chat.push({r:"u",t:m})});setBusy(true);
    let r:AIResult;try{r=await askAI(user,m)}catch{r={text:"I could not answer right now. Please try again.",recs:[],task:null}}
    update(u=>{u.chat.push({r:"a",t:r.text,recs:r.recs,task:r.task});u.log=["Asked Helpawy AI",...u.log].slice(0,8)});setBusy(false)};
  return <Page title="Helpawy AI" sub="Your business growth guide."><div className="two"><div>
    <div className="chat" aria-live="polite">{msgs.map((m,i)=><div key={i} className={"m "+m.r}>{t(m.t)}{m.recs?.map(r=><div key={r.title} className="rc"><b>{t(r.title)}</b><br/>{t(r.reason)}<br/>{t(`Resource: ${r.related_resource}`)}<br/>{t(`Next: ${r.next_action}`)}{m.task&&<><br/><button className="btn s" onClick={()=>{update(u=>{u.tasks[m.task as string]="doing"});nav("/journey")}}>{t("Start Task")}</button></>}</div>)}</div>)}{busy&&<div className="m a">{t("Thinking…")}</div>}</div>
    <form className="fl" onSubmit={e=>{e.preventDefault();void send(text)}}><input style={{flex:1}} value={text} onChange={e=>setText(e.target.value)} placeholder={t("Ask about your next step…")} aria-label={t("Message")} required/><button className="btn" disabled={busy}>{t("Send")}</button></form></div>
    <div className="card"><h3>{t("Your context")}</h3><p>{t("Stage:")} <b>{t(p.stage)}</b></p><p>{t("Next step:")} <b>{nt?t(nt.t):t("All done")}</b></p><Progress value={pct(user)}/><h3>{t("Try asking")}</h3>
      {["How do I get my first customers?","What should I do about branding?","Which workshop fits me?"].map(s=><button key={s} className="opt" onClick={()=>void send(s)}>{t(s)}</button>)}</div></div></Page>;
}
export function Recs(){const {user}=useAuth();if(!user?.profile)return null;const p=user.profile;
  return <Page title="Recommended for you" sub="Based on your stage, goals and progress."><CardGrid kind="s" items={top(SERVICES,p,2)}/><CardGrid kind="x" items={top(EXPERTS,p,2)}/><CardGrid kind="r" items={top(RES,p,2)}/><CardGrid kind="e" items={top(EVENTS,p,2)}/></Page>}
export function Notifications(){const {user,update}=useAuth();const {t}=useI18n();
  useEffect(()=>{if(user&&!user.seen)update(u=>{u.seen=true})},[user,update]);
  const n=user?notifs(user):[];return <Page title="Notifications">{n.length?<ul>{n.map(x=><li key={x}>{t(x)}</li>)}</ul>:<Empty title="No notifications" hint="Complete your assessment to unlock personalized updates."/>}</Page>}
export function Profile(){const {user,update,signOut}=useAuth();const {t}=useI18n();const nav=useNavigate();if(!user?.profile)return null;const saved=RES.filter(r=>user.saved.includes(r.id));
  return <Page title="Profile"><div className="card"><p><b>{user.name}</b><br/>{user.email}</p><p>{t(`${user.profile.type} · ${user.profile.stage} · ${user.profile.challenge}`)}</p>
    <div className="row"><button className="btn o" onClick={()=>update(u=>{u.profile=null;nav("/onboarding")})}>{t("Retake assessment")}</button><button className="btn o" onClick={()=>void signOut()}>{t("Log out")}</button></div></div>
    <H>Saved resources</H>{saved.length?<CardGrid kind="r" items={saved}/>:<Empty title="No saved resources yet" hint="Save a resource to find it here."/>}</Page>}
