import type {Rec,User} from "../types";
import {RES,SERVICES} from "../data/seed";
import {nextTask} from "../lib/recommend";
import {sb} from "./supabase";
export interface AIResult{text:string;recs:Rec[];task:string|null}
/** Real mode: calls the Supabase Edge Function `ai` (API key stays on the server). Fallback: local rules. */
export async function askAI(u:User,message:string):Promise<AIResult>{
  if(sb&&u.profile){
    const {data,error}=await sb.functions.invoke("ai",{body:{message,context:{profile:u.profile,completed:Object.keys(u.tasks).filter(k=>u.tasks[k]==="done"),current:nextTask(u)?.t}}});
    if(!error&&data)return data as AIResult;
  }
  return localAnswer(u,message);
}
const KEYS:[string,string][]=[["market","Marketing"],["brand","Branding & Identity"],["sale","Business Development"],["partner","Business Development"],["network","Networking"],["workshop","Training & Workshops"],["learn","Training & Workshops"],["template","Resources & Tools"],["tool","Resources & Tools"],["idea","Business Consulting"],["plan","Business Consulting"]];
async function localAnswer(u:User,m:string):Promise<AIResult>{
  await new Promise(r=>setTimeout(r,450));
  const p=u.profile;if(!p)return {text:"Complete your assessment first.",recs:[],task:null};
  const t=m.toLowerCase(),cat=KEYS.find(k=>t.includes(k[0]))?.[1]??p.challenge;
  const svc=SERVICES.find(s=>s.cat===cat)??SERVICES[0];
  const res=RES.find(r=>r.cat===cat&&r.st.includes(p.stage))??RES.find(r=>r.cat===cat)??RES[0];
  const nt=nextTask(u);
  return {text:`You are in the ${p.stage} stage and your goal is “${p.goal}”. For ${cat}, here is what I suggest.`,
    recs:[{recommendation_type:"service",title:svc.name,reason:`Matches your ${p.stage} stage and your question about ${cat}.`,related_service:svc.name,related_resource:res.name,next_action:nt?nt.t:"Review your journey"}],task:nt?nt.id:null};
}
