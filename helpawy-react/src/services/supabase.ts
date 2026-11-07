import {createClient,type SupabaseClient} from "@supabase/supabase-js";
import type {Repo} from "./repo";
import type {User} from "../types";
import {journeyFlags,notifs,pct} from "../lib/recommend";
const url=import.meta.env.VITE_SUPABASE_URL as string|undefined;
const key=import.meta.env.VITE_SUPABASE_ANON_KEY as string|undefined;
export const sb:SupabaseClient|null=url&&key?createClient(url,key):null;
interface Row{id:string;email:string;name:string;role:"user"|"admin";profile:User["profile"];state:Partial<User>|null}
const toUser=(r:Row):User=>({tasks:{},saved:[],used:[],req:[],reg:[],chat:[],log:[],seen:false,...(r.state??{}),id:r.id,name:r.name,email:r.email,role:r.role,profile:r.profile});
/** Role is read from the database; clients cannot grant themselves admin (see supabase/schema.sql). */
export class SupabaseRepo implements Repo{
  private prev=new Map<string,User>();
  constructor(private c:SupabaseClient){}
  async current(){const {data:{session}}=await this.c.auth.getSession();if(!session)return null;
    const {data}=await this.c.from("profiles").select("*").eq("id",session.user.id).single();if(!data)return null;const u=toUser(data as Row);this.prev.set(u.id,structuredClone(u));return u}
  async signUp(name:string,email:string,password:string){
    const {error}=await this.c.auth.signUp({email:email.trim(),password,options:{data:{name}}});if(error)throw new Error(error.message);
    const u=await this.current();if(!u)throw new Error("Check your email to confirm your account, then log in.");return u}
  async signIn(email:string,password:string){
    const {error}=await this.c.auth.signInWithPassword({email:email.trim(),password});if(error)throw new Error(error.message);
    const u=await this.current();if(!u)throw new Error("Profile not found.");return u}
  async signOut(){await this.c.auth.signOut()}
  /** `profiles.state` stays the read model; changes are also mirrored into the normalized tables (used for reporting). */
  async save(u:User){
    const {id:_i,name:_n,email:_e,role:_r,profile,...state}=u;
    const {error}=await this.c.from("profiles").update({profile,state}).eq("id",u.id);if(error)throw new Error(error.message);
    try{await this.mirror(u)}catch(e){console.error("Mirror to normalized tables failed (did you run schema.sql and seed.sql?):",e)}
  }
  private async mirror(u:User){
    const c=this.c,uid=u.id,p=this.prev.get(uid);this.prev.set(uid,structuredClone(u));
    const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
    const must=(e:{message:string}|null)=>{if(e)throw new Error(e.message)};
    const set=async(table:string,col:string,rows:Record<string,unknown>[])=>{
      let q=c.from(table).delete().eq("user_id",uid);
      if(rows.length)q=q.not(col,"in",`(${rows.map(r=>`"${String(r[col])}"`).join(",")})`);
      must((await q).error);
      if(rows.length)must((await c.from(table).upsert(rows)).error)};
    if(!p||!same(p.reg,u.reg))await set("registrations","event_id",u.reg.map(event_id=>({user_id:uid,event_id})));
    const rs=[...new Set([...u.saved,...u.used])];
    if(!p||!same([p.saved,p.used],[u.saved,u.used]))await set("saved_resources","resource_id",rs.map(resource_id=>({user_id:uid,resource_id,used:u.used.includes(resource_id)})));
    if(!p||!same(p.tasks,u.tasks))await set("user_tasks","task_id",Object.entries(u.tasks).map(([task_id,status])=>({user_id:uid,task_id,status})));
    if(u.profile){
      if(!p||!same(p.profile,u.profile))must((await c.from("business_profiles").upsert({user_id:uid,...u.profile})).error);
      must((await c.from("progress").upsert({user_id:uid,percent:pct(u),current_step:(journeyFlags(u).indexOf(false)+1)||7})).error);
      const msgs=notifs(u);
      if(!p||!same(notifs(p),msgs)||p.seen!==u.seen){
        must((await c.from("notifications").delete().eq("user_id",uid)).error);
        if(msgs.length)must((await c.from("notifications").insert(msgs.map(message=>({user_id:uid,message,read:u.seen})))).error)}}
    if(!p)return;
    const fresh=u.chat.slice(p.chat.length);
    if(fresh.length)must((await c.from("ai_conversations").insert(fresh.map(m=>({user_id:uid,role:m.r==="u"?"user":"assistant",content:m})))).error);
    const recs=fresh.flatMap(m=>m.recs??[]);
    if(recs.length)must((await c.from("recommendations").insert(recs.map(r=>({user_id:uid,kind:r.recommendation_type,item_id:r.title,reason:r.reason})))).error);
    const added=(a:string[],b:string[])=>b.filter(x=>!a.includes(x));
    const ev=[...added(p.reg,u.reg).map(id=>["event_registered",id]),...added(p.saved,u.saved).map(id=>["resource_saved",id]),...added(p.used,u.used).map(id=>["resource_used",id]),...added(p.req,u.req).map(id=>["service_requested",id]),...Object.keys(u.tasks).filter(k=>u.tasks[k]==="done"&&p.tasks[k]!=="done").map(id=>["task_completed",id])];
    if(ev.length)must((await c.from("analytics_events").insert(ev.map(([event,id])=>({user_id:uid,event,props:{id}})))).error);
  }
  async requestReset(email:string){await this.c.auth.resetPasswordForEmail(email.trim(),{redirectTo:`${window.location.origin}/reset`})}
  async resetPassword(password:string){const {error}=await this.c.auth.updateUser({password});if(error)throw new Error(error.message)}
  async removeUser(_id:string):Promise<void>{throw new Error("Deleting an account needs the service-role key. Delete the user in the Supabase dashboard (Authentication > Users).")}
  async listUsers(){const {data,error}=await this.c.from("profiles").select("*").eq("role","user");if(error)throw new Error(error.message);return (data as Row[]).map(toUser)}
}
