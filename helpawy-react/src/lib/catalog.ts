import {EVENTS,EXPERTS,RES,SERVICES,ini} from "../data/seed";
import type {Item,Kind} from "../types";
import {sb} from "../services/supabase";
import {WEIGHTS} from "./recommend";
/** Editable catalog. Arrays are mutated in place so every page sees admin edits.
 *  With Supabase configured it reads/writes the real tables; otherwise it persists to localStorage. */
export const DATA:Record<Kind,Item[]>={s:SERVICES,x:EXPERTS,e:EVENTS,r:RES};
export const site={h:""};
type Row=Record<string,unknown>;
const MAP:Record<Kind,{table:string;cols:[string,string][]}>={
  s:{table:"services",cols:[["id","id"],["name","name"],["d","description"],["ic","icon"],["cat","category"],["st","stages"]]},
  x:{table:"experts",cols:[["id","id"],["name","name"],["title","title"],["ind","industry"],["cat","category"],["d","bio"],["st","stages"]]},
  e:{table:"events",cols:[["id","id"],["name","name"],["d","description"],["spk","speaker"],["date","event_date"],["time","event_time"],["loc","location"],["mode","mode"],["cat","category"],["st","stages"]]},
  r:{table:"resources",cols:[["id","id"],["name","name"],["d","description"],["type","type"],["lvl","level"],["min","minutes"],["cat","category"],["st","stages"]]}};
const toRow=(k:Kind,it:Item):Row=>Object.fromEntries(MAP[k].cols.map(([a,b])=>[b,(it as unknown as Row)[a]]));
const fromRow=(k:Kind,r:Row):Item=>{const o:Row={};MAP[k].cols.forEach(([a,b])=>{o[a]=r[b]??(a==="min"?10:"")});if(!Array.isArray(r.stages))o.st=[];if(k==="x")o.ic=ini(String(o.name));return o as unknown as Item};
const KEY="hw-catalog";
export function loadCatalog(){
  if(sb)return;
  try{const c=JSON.parse(localStorage.getItem(KEY)||"null");if(!c)return;
    (Object.keys(DATA) as Kind[]).forEach(k=>{if(Array.isArray(c[k])){DATA[k].length=0;DATA[k].push(...c[k])}});
    Object.assign(WEIGHTS,c.w);Object.assign(site,c.site)}catch{/* ignore corrupt storage */}
}
export function saveCatalog(){if(sb)return;try{localStorage.setItem(KEY,JSON.stringify({...DATA,w:WEIGHTS,site}))}catch{/* storage unavailable */}}
/** Replaces seed data with table contents. An empty table keeps the built-in seed until you run supabase/seed.sql. */
export async function loadRemote(){
  if(!sb)return;
  for(const k of Object.keys(DATA) as Kind[]){
    const {data,error}=await sb.from(MAP[k].table).select("*").order("id");
    if(!error&&data&&data.length){DATA[k].length=0;DATA[k].push(...(data as Row[]).map(r=>fromRow(k,r)))}
  }
  const {data}=await sb.from("settings").select("*");
  (data as {key:string;value:Record<string,unknown>}[]|null)?.forEach(r=>{if(r.key==="weights")Object.assign(WEIGHTS,r.value);if(r.key==="site")Object.assign(site,r.value)});
}
export async function remoteUpsert(k:Kind,it:Item){if(!sb)return;const {error}=await sb.from(MAP[k].table).upsert(toRow(k,it));if(error)throw new Error(error.message)}
export async function remoteDelete(k:Kind,id:string){if(!sb)return;const {error}=await sb.from(MAP[k].table).delete().eq("id",id);if(error)throw new Error(error.message)}
export async function remoteSetting(key:string,value:object){if(!sb)return;const {error}=await sb.from("settings").upsert({key,value});if(error)throw new Error(error.message)}
