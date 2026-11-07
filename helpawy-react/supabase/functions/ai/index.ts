// Deploy: supabase functions deploy ai ; supabase secrets set ANTHROPIC_API_KEY=...  (the key never reaches the browser)
import {createClient} from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"};
const json=(b:unknown,status=200)=>new Response(JSON.stringify(b),{status,headers:{...cors,"content-type":"application/json"}});
Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  const sb=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_ANON_KEY")!,{global:{headers:{Authorization:req.headers.get("Authorization")??""}}});
  const {data:{user}}=await sb.auth.getUser();if(!user)return json({error:"unauthorized"},401);
  const {message,context}=await req.json();
  const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"x-api-key":Deno.env.get("ANTHROPIC_API_KEY")!,"anthropic-version":"2023-06-01","content-type":"application/json"},
    body:JSON.stringify({model:Deno.env.get("AI_MODEL")??"claude-sonnet-5-5",max_tokens:800,
      system:'You are Helpawy, a business growth guide for entrepreneurs. Use the user context (stage, goal, challenge, completed tasks). Reply in the user language. Reply ONLY with JSON: {"text":string,"recs":[{"recommendation_type":string,"title":string,"reason":string,"related_service":string,"related_resource":string,"next_action":string}],"task":null}',
      messages:[{role:"user",content:JSON.stringify({message,context})}]})});
  const j=await r.json();const raw:string=j?.content?.[0]?.text??"";
  try{return json(JSON.parse(raw))}catch{return json({text:raw||"Sorry, I could not answer.",recs:[],task:null})}
});
