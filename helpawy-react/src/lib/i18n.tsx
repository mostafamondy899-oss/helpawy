import {createContext,useContext,useEffect,useState,type ReactNode} from "react";
import {tr} from "./dict";
type Lang="en"|"ar";
const Ctx=createContext<{lang:Lang;toggle:()=>void;t:(s:string)=>string}>({lang:"en",toggle(){},t:s=>s});
export function I18nProvider({children}:{children:ReactNode}){
  const [lang,setLang]=useState<Lang>(()=>{try{return (localStorage.getItem("hw-lang") as Lang|null)??(navigator.language.startsWith("ar")?"ar":"en")}catch{return "en"}});
  useEffect(()=>{document.documentElement.lang=lang;document.documentElement.dir=lang==="ar"?"rtl":"ltr";try{localStorage.setItem("hw-lang",lang)}catch{/* storage unavailable */}},[lang]);
  const t=(s:string)=>lang==="ar"?tr(s):s;
  return <Ctx.Provider value={{lang,toggle:()=>setLang(l=>l==="ar"?"en":"ar"),t}}>{children}</Ctx.Provider>;
}
export const useI18n=()=>useContext(Ctx);
