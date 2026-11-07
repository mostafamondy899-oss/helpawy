import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from "react";
import type {User} from "../types";
import {repo} from "../services/repo";
interface A{user:User|null;loading:boolean;signIn(e:string,p:string):Promise<User>;signUp(n:string,e:string,p:string):Promise<User>;signOut():Promise<void>;update(f:(u:User)=>void):void}
const Ctx=createContext<A|null>(null);
export function AuthProvider({children}:{children:ReactNode}){
  const [user,setUser]=useState<User|null>(null);const [loading,setLoading]=useState(true);const cur=useRef<User|null>(null);
  const set=(u:User|null)=>{cur.current=u;setUser(u)};
  useEffect(()=>{repo.current().then(set).catch(()=>set(null)).finally(()=>setLoading(false))},[]);
  const api:A={user,loading,
    async signIn(e,p){const u=await repo.signIn(e,p);set(u);return u},
    async signUp(n,e,p){const u=await repo.signUp(n,e,p);set(u);return u},
    async signOut(){await repo.signOut();set(null)},
    update(f){const prev=cur.current;if(!prev)return;const n=structuredClone(prev);f(n);set(n);repo.save(n).catch(e=>console.error("Save failed:",e))}};
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
export function useAuth():A{const c=useContext(Ctx);if(!c)throw new Error("useAuth outside AuthProvider");return c}
