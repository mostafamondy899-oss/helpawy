import {useState,type FormEvent} from "react";
import {Link,useNavigate} from "react-router-dom";
import {CATS,SN} from "../data/seed";
import type {Profile} from "../types";
import {useAuth} from "../context/AuthContext";
import {useI18n} from "../lib/i18n";
import {plan} from "../lib/recommend";
import {Progress} from "../components/ui";
import {repo} from "../services/repo";
import {sb} from "../services/supabase";
export function AuthForm({mode}:{mode:"login"|"signup"}){
  const {signIn,signUp}=useAuth();const nav=useNavigate();const {t}=useI18n();const [err,setErr]=useState("");const [busy,setBusy]=useState(false);
  const submit=async(ev:FormEvent<HTMLFormElement>)=>{ev.preventDefault();const f=new FormData(ev.currentTarget);const e=String(f.get("e")),p=String(f.get("p")),n=String(f.get("n")??"");setBusy(true);setErr("");
    try{const u=mode==="login"?await signIn(e,p):await signUp(n,e,p);nav(u.role==="admin"?"/admin":u.profile?"/dashboard":"/onboarding")}
    catch(x){setErr(x instanceof Error?x.message:"Something went wrong")}finally{setBusy(false)}};
  return <form className="fm" onSubmit={e=>void submit(e)}><img src="/logo.jpg" alt="Helpawy" width={64} height={64} style={{borderRadius:"50%",justifySelf:"center"}}/>
    <h2>{t(mode==="login"?"Log in":"Start your journey")}</h2>
    {mode==="signup"&&<label>{t("Name")}<input name="n" required autoComplete="name"/></label>}
    <label>{t("Email")}<input name="e" type="email" required autoComplete="email"/></label>
    <label>{t(mode==="login"?"Password":"Password (6+ characters)")}<input name="p" type="password" required minLength={mode==="signup"?6:undefined} autoComplete={mode==="login"?"current-password":"new-password"}/></label>
    {err&&<div className="err" role="alert">{t(err)}</div>}
    <button className="btn" disabled={busy}>{t(mode==="login"?"Log in":"Create account")}</button>
    {mode==="login"&&<Link to="/forgot">{t("Forgot password?")}</Link>}
    <Link to={mode==="login"?"/signup":"/login"}>{t(mode==="login"?"Create an account":"I already have an account")}</Link></form>;
}
const Q:[keyof Profile,string,string[]][]=[["type","What best describes you?",["Business Idea","Startup","Small Business","Entrepreneur"]],["stage","What stage are you in?",SN],["goal","What is your main goal?",["Get first customers","Increase sales","Launch my product","Build my brand","Find partners"]],["challenge","What is your biggest challenge?",CATS],["interests","Which areas interest you? (pick any)",CATS]];
export function Onboarding(){
  const {user,update}=useAuth();const {t}=useI18n();const [i,setI]=useState(0);const [warn,setWarn]=useState(false);const [done,setDone]=useState(false);
  const [a,setA]=useState<Record<string,string>>({});const [ints,setInts]=useState<string[]>([]);
  if(!user)return null;
  if(done&&user.profile){const p=user.profile;return <div className="fm"><h2>{t("Your Helpawy Journey Is Ready")}</h2><p>{t(`${p.type} · ${p.stage} · Goal: ${p.goal}`)}</p><p>{t(`Your starting plan has ${plan(p).length} tasks, focused on`)} <b>{t(p.challenge)}</b></p><Link className="btn" to="/dashboard">{t("Go to your dashboard")}</Link></div>}
  const [k,q,opts]=Q[i];const sel=(o:string)=>k==="interests"?ints.includes(o):a[k]===o;
  const pick=(o:string)=>k==="interests"?setInts(l=>l.includes(o)?l.filter(x=>x!==o):[...l,o]):setA(s=>({...s,[k]:o}));
  const next=()=>{if(k!=="interests"&&!a[k]){setWarn(true);return}if(i<4){setI(i+1);setWarn(false);return}
    update(u=>{u.profile={type:a.type,stage:a.stage,goal:a.goal,challenge:a.challenge,interests:ints.length?ints:[a.challenge]};u.tasks={};u.log=["Completed assessment",...u.log]});setDone(true)};
  return <div className="fm"><div className="mut">{t(`Step ${i+1} of 5`)}</div><Progress value={(i+1)*20}/><h2>{t(q)}</h2>
    <div>{opts.map(o=><button key={o} className={"opt"+(sel(o)?" on":"")} onClick={()=>pick(o)}>{t(o)}</button>)}</div>
    {warn&&<div className="err" role="alert">{t("Choose one option to continue")}</div>}
    <div className="row">{i>0&&<button className="btn o" onClick={()=>setI(i-1)}>{t("Back")}</button>}<button className="btn" onClick={next}>{t(i===4?"Finish":"Next")}</button></div></div>;
}

export function Forgot(){
  const {t}=useI18n();const [msg,setMsg]=useState("");const [err,setErr]=useState("");
  const go=async(ev:FormEvent<HTMLFormElement>)=>{ev.preventDefault();const e=String(new FormData(ev.currentTarget).get("e"));setErr("");
    try{await repo.requestReset(e);setMsg("If an account exists for that email, a reset link will be sent.")}catch(x){setErr(x instanceof Error?x.message:"Something went wrong")}};
  return <form className="fm" onSubmit={ev=>void go(ev)}><h2>{t("Reset password")}</h2><label>{t("Email")}<input name="e" type="email" required/></label>
    {msg&&<div className="ok" role="status">{t(msg)}{!sb&&<> <Link to="/reset">{t("Open the reset page (demo)")}</Link></>}</div>}{err&&<div className="err" role="alert">{t(err)}</div>}
    <button className="btn">{t("Send reset link")}</button></form>;
}
export function Reset(){
  const {t}=useI18n();const nav=useNavigate();const [err,setErr]=useState("");
  const go=async(ev:FormEvent<HTMLFormElement>)=>{ev.preventDefault();const p=String(new FormData(ev.currentTarget).get("p"));setErr("");
    try{await repo.resetPassword(p);nav("/login")}catch(x){setErr(x instanceof Error?x.message:"Something went wrong")}};
  return <form className="fm" onSubmit={ev=>void go(ev)}><h2>{t("Choose a new password")}</h2><label>{t("New password")}<input name="p" type="password" minLength={6} required autoComplete="new-password"/></label>
    {err&&<div className="err" role="alert">{t(err)}</div>}<button className="btn">{t("Save password")}</button></form>;
}
