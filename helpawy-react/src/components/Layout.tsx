import {useState} from "react";
import {Link,NavLink,Navigate,Outlet,useLocation,useNavigate} from "react-router-dom";
import {useAuth} from "../context/AuthContext";
import {useI18n} from "../lib/i18n";
const PUB:[string,string][]=[["/","Home"],["/about","About"],["/services","Services"],["/experts","Experts"],["/events","Events"],["/resources","Resources"],["/community","Community"]];
const USER:[string,string][]=[["/dashboard","Dashboard"],["/journey","My Journey"],["/recs","Recommendations"],["/services","Services"],["/resources","Resources"],["/events","Events"],["/experts","Experts"],["/ai","AI Assistant"],["/notifications","Notifications"],["/profile","Profile"]];
const ADMIN:[string,string][]=[["/admin","Admin dashboard"],["/","Public site"]];
export function Layout(){
  const {user,signOut}=useAuth();const {t,lang,toggle}=useI18n();const [open,setOpen]=useState(false);const go=useNavigate();
  const links=user?(user.role==="admin"?ADMIN:USER):PUB;
  return <>
    <header className={open?"open":""}><div className="w">
      <Link className="brand" to="/"><img src="/logo.jpg" alt=""/>Helpawy</Link>
      <button id="menu" onClick={()=>setOpen(o=>!o)}>{t("☰ Menu")}</button>
      <nav>{links.map(([to,l])=><NavLink key={to+l} to={to} end={to==="/"} onClick={()=>setOpen(false)} className={({isActive})=>isActive?"on":""}>{t(l)}</NavLink>)}
        <span className="sp"/>
        {user?<button className="btn s o lng" onClick={()=>void signOut()}>{t("Log out")}</button>
          :<><Link className="btn s" to="/signup">{t("Start Your Journey")}</Link><Link to="/login">{t("Log in")}</Link></>}
        <button className="btn s o lng" onClick={toggle}>{lang==="ar"?"English":"العربية"}</button></nav>
      <form className="srch" onSubmit={e=>{e.preventDefault();const q=String(new FormData(e.currentTarget).get("q")??"").trim();if(q){setOpen(false);go(`/search?q=${encodeURIComponent(q)}`)}}}><input name="q" type="search" placeholder={t("Search Helpawy")} aria-label={t("Global search")}/><button aria-label={t("Search")}>⌕</button></form>
    </div></header>
    <main><Outlet/></main>
    <footer><div className="w"><p><b style={{color:"#fff"}}>Helpawy</b> {t("– Technology & Solutions for the Future. A business support and growth platform.")}</p></div></footer>
  </>;
}
export function Guard({role}:{role?:"admin"}){
  const {user,loading}=useAuth();const loc=useLocation();
  if(loading)return <p className="w app mut">…</p>;
  if(!user)return <Navigate to="/login" replace/>;
  if(role==="admin"&&user.role!=="admin")return <Navigate to="/dashboard" replace/>;
  if(user.role==="user"&&!user.profile&&loc.pathname!=="/onboarding")return <Navigate to="/onboarding" replace/>;
  return <Outlet/>;
}
