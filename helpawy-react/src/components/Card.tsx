import {Link,useNavigate} from "react-router-dom";
import type {EventItem,Expert,Item,Kind,Resource,Service} from "../types";
import {useAuth} from "../context/AuthContext";
import {useI18n} from "../lib/i18n";
import {reason} from "../lib/recommend";
type Any=Service&Expert&EventItem&Resource;
type Flag="req"|"saved"|"used";
export function ItemCard({kind,item}:{kind:Kind;item:Item}){
  const {user,update}=useAuth();const {t}=useI18n();const nav=useNavigate();const x=item as Any;
  const has=(k:Flag)=>!!user?.[k].includes(x.id);
  const flip=(k:Flag,msg:string)=>{if(!user){nav("/login");return}
    update(u=>{const on=u[k].includes(x.id);if(k==="used"){if(!on)u.used.push(x.id)}else u[k]=on?u[k].filter(i=>i!==x.id):[...u[k],x.id];if(msg&&!on)u.log=[msg,...u.log].slice(0,8)})};
  const sub=kind==="x"?`${x.title} · ${x.ind} · Available this week`:kind==="e"?`${x.date} ${x.time} · ${x.loc} · ${x.mode} · Speaker: ${x.spk}`:"";
  const why=user?.profile?reason(item,user.profile):"";
  const acts=kind==="s"||kind==="x"
    ?<button className="btn s" onClick={()=>flip("req",`Requested: ${x.name}`)}>{t(has("req")?(kind==="s"?"Added to plan ✓":"Requested ✓"):(kind==="s"?"Explore Service":"Request Consultation"))}</button>
    :kind==="e"?<Link className="btn s" to={`/event/${x.id}`}>{t("Register Now")}</Link>
    :<><button className="btn s o" onClick={()=>flip("saved","")}>{t(has("saved")?"Saved ✓":"Save")}</button><button className="btn s" onClick={()=>flip("used",`Used resource: ${x.name}`)}>{t(has("used")?"Used ✓":"Open Resource")}</button></>;
  return <article className="card"><div className="ic" aria-hidden="true">{x.ic}</div><h3>{t(x.name)}</h3>{sub&&<div className="mut">{t(sub)}</div>}<p className="mut">{t(x.d)}</p>
    <div><span className="chip">{t(x.cat)}</span>{x.st.map(s=><span key={s} className="chip">{t(s)}</span>)}</div>{why&&<p className="why">{t(why)}</p>}<div className="row">{acts}</div></article>;
}
