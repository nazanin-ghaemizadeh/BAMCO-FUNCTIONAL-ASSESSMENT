// Account creation and credential changes are one Auth operation, including the app-owned grants.
const supabase = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const publicKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const allowed = new Set(["active","history","weighting","observer","setup","drive","durability","static","comprehensive","results"]);
const cors = {"Access-Control-Allow-Origin":"https://nazanin-ghaemizadeh.github.io","Access-Control-Allow-Headers":"authorization,apikey,content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
function reply(data: object, status: number) {
  return Response.json(data,{status,headers:{...cors,"Cache-Control":"no-store"}});
}
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null,{status:204,headers:cors});
  if (req.method !== "POST") return reply({error:"method"},405);
  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return reply({error:"unauthorized"},401);
  const caller = await fetch(supabase+"/rest/v1/rpc/bamco_access_profile",{method:"POST",headers:{apikey:publicKey,Authorization:authorization,"Content-Type":"application/json"},body:"{}"});
  if (!caller.ok || (await caller.json())?.admin !== true) return reply({error:"forbidden"},403);
  const data = await req.json().catch(()=>null);
  if (!data || typeof data.name !== "string" || !data.name.trim() || data.name.trim().length>80 ||
      typeof data.email !== "string" || data.email.length>254 || !/^\S+@[^\s@]+\.[^\s@]+$/.test(data.email) ||
      !Array.isArray(data.grants) || data.grants.length>allowed.size || !data.grants.every((g: string)=>allowed.has(g)) ||
      ((!data.id || data.password) && (typeof data.password !== "string" || data.password.length<8 || new TextEncoder().encode(data.password).length>72)))
    return reply({error:"invalid_input"},400);
  const headers = {apikey:serviceKey,Authorization:"Bearer "+serviceKey,"Content-Type":"application/json"};
  const attrs = {name:data.name.trim(),admin:false,grants:[...new Set(data.grants)]};
  let endpoint = supabase+"/auth/v1/admin/users";
  if (data.id) {
    if (typeof data.id !== "string" || !/^[0-9a-f-]{36}$/i.test(data.id)) return reply({error:"invalid_id"},400);
    endpoint += "/"+data.id;
    const existing = await fetch(endpoint,{headers});
    if (!existing.ok) return reply({error:"unavailable"},404);
    const access = (await existing.json()).app_metadata?.bamco_functional;
    if (!access || access.admin) return reply({error:"forbidden"},403);
  }
  const body = {email:data.email.trim().toLowerCase(),email_confirm:true,app_metadata:{bamco_functional:attrs},...(data.password ? {password:data.password} : {})};
  const result = await fetch(endpoint,{method:data.id?"PUT":"POST",headers,body:JSON.stringify(body)});
  if (!result.ok) {
    const problem = await result.json().catch(()=>({}));
    const duplicate = ["email_exists","user_already_exists","email_address_already_exists"].includes(problem.code) || /already registered|already been registered|already exists/i.test(problem.msg||"");
    return reply({error:duplicate?"duplicate_email":"auth_rejected"},duplicate?409:400);
  }
  return reply({ok:true},200);
});
