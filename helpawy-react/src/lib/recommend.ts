import type {Item,Profile,User} from "../types";
import {EVENTS,SERVICES} from "../data/seed";
export const WEIGHTS={c:3,s:2,i:1};
export const score=(x:Item,p:Profile)=>(x.cat===p.challenge?WEIGHTS.c:0)+(x.st.includes(p.stage)?WEIGHTS.s:0)+(p.interests.includes(x.cat)?WEIGHTS.i:0);
export const reason=(x:Item,p:Profile)=>x.cat===p.challenge?`Recommended because ${p.challenge} is your biggest challenge.`:x.st.includes(p.stage)?`Recommended because you are in the ${p.stage} stage.`:p.interests.includes(x.cat)?`Recommended because you are interested in ${x.cat}.`:"";
export function top<T extends Item>(l:T[],p:Profile,n:number):T[]{return [...l].sort((a,b)=>score(b,p)-score(a,p)).slice(0,n)}
export const plan=(p:Profile)=>[{id:"g1",t:"Define your target customer"},{id:"g2",t:"Build your action plan"},{id:"c1",t:`Review your ${p.challenge} needs`},{id:"c2",t:`Book a ${p.challenge} session`},{id:"c3",t:`Complete one ${p.challenge} action`}];
export const pct=(u:User)=>{if(!u.profile)return 0;const t=plan(u.profile);return Math.round(t.filter(x=>u.tasks[x.id]==="done").length/t.length*100)};
export const nextTask=(u:User)=>u.profile?plan(u.profile).find(t=>u.tasks[t.id]!=="done"):undefined;
export const journeyFlags=(u:User)=>{const p=pct(u);return[true,true,true,u.saved.length+u.used.length>0,u.req.length+u.reg.length>0,p>=50,p===100]};
export const cycleTask=(u:User,id:string)=>{const c=u.tasks[id]??"todo";u.tasks[id]=c==="todo"?"doing":c==="doing"?"done":"todo"};
export const notifs=(u:User):string[]=>{const p=u.profile;if(!p)return[];const t=nextTask(u);return[`New recommended service: ${top(SERVICES,p,1)[0].name}`,`Relevant workshop: ${top(EVENTS,p,1)[0].name}`,...(t?[`Task reminder: ${t.t}`]:[]),`Journey update: you are ${pct(u)}% complete`,...(pct(u)>=50?["Milestone reached: halfway through your plan"]:[])]};
