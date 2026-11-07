import type {User} from "../types";
import {sb,SupabaseRepo} from "./supabase";
export const ADMIN_EMAIL="mostafamondy79@gmail.com";
export interface Repo{current():Promise<User|null>;signUp(n:string,e:string,p:string):Promise<User>;signIn(e:string,p:string):Promise<User>;signOut():Promise<void>;save(u:User):Promise<void>;listUsers():Promise<User[]>;requestReset(e:string):Promise<void>;resetPassword(p:string):Promise<void>;removeUser(id:string):Promise<void>}
type Rec=User&{pass:string};interface Store{users:Rec[];session:string|null;rst?:string|null}
const KEY="hw-react";
const read=():Store=>{try{return JSON.parse(localStorage.getItem(KEY)||"") as Store}catch{return {users:[],session:null}}};
const write=(s:Store)=>{try{localStorage.setItem(KEY,JSON.stringify(s))}catch{/* storage unavailable */}};
const blank=(name:string,email:string,pass:string,role:"user"|"admin"):Rec=>({id:crypto.randomUUID(),name,email,pass,role,profile:null,tasks:{},saved:[],used:[],req:[],reg:[],chat:[],log:["Joined Helpawy"],seen:false});
const strip=(r:Rec):User=>{const {pass:_p,...u}=r;return u};
/** Browser-only demo backend. Replaced by SupabaseRepo when VITE_SUPABASE_URL is set. */
class LocalRepo implements Repo{
  async current(){const s=read();const u=s.users.find(x=>x.email===s.session);return u?strip(u):null}
  async signUp(n:string,e:string,p:string){e=e.trim().toLowerCase();const s=read();
    if(e===ADMIN_EMAIL)throw new Error("This email is reserved for the administrator. Log in instead.");
    if(!n.trim()||!e||p.length<6)throw new Error("Enter a name, an email and a password of 6+ characters.");
    if(s.users.some(x=>x.email===e))throw new Error("This email already has an account. Log in instead.");
    const u=blank(n.trim(),e,p,"user");s.users.push(u);s.session=e;write(s);return strip(u)}
  async signIn(e:string,p:string){e=e.trim().toLowerCase();const s=read();
    if(e===ADMIN_EMAIL&&p==="123"&&!s.users.some(x=>x.email===e))s.users.push(blank("Admin",e,p,"admin"));
    const u=s.users.find(x=>x.email===e&&x.pass===p);if(!u)throw new Error("Email or password is incorrect.");s.session=e;write(s);return strip(u)}
  async signOut(){const s=read();s.session=null;write(s)}
  async save(u:User){const s=read();const i=s.users.findIndex(x=>x.id===u.id);if(i>=0)s.users[i]={...u,pass:s.users[i].pass};write(s)}
  async requestReset(e:string){const s=read();const u=s.users.find(x=>x.email===e.trim().toLowerCase());s.rst=u?u.email:null;write(s)}
  async resetPassword(p:string){const s=read();const u=s.users.find(x=>x.email===s.rst);if(!u||p.length<6)throw new Error("Reset link expired. Request a new one.");u.pass=p;s.rst=null;write(s)}
  async removeUser(id:string){const s=read();s.users=s.users.filter(x=>x.id!==id);write(s)}
  async listUsers(){return read().users.filter(x=>x.role==="user").map(strip)}
}
export const repo:Repo=sb?new SupabaseRepo(sb):new LocalRepo();
