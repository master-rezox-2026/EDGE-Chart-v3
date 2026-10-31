/* TV Auth - Supabase email/password login (REST, no library) + cloud sync of your chart state.
   Load AFTER tv-extras4.js. Needs window.MCP_CFG.supabaseUrl / supabaseKey (config.js) and the table from supabase.sql. */
(()=>{
const C=window.MCP_CFG||{},URL_=(C.supabaseUrl||'').replace(/\/$/,''),KEY=C.supabaseKey||'';
if(!URL_||!KEY){console.warn('tv-auth: supabaseUrl/supabaseKey missing in config.js - login disabled');return}
const D=document,SK='tv_sess',H=(tok)=>({'Content-Type':'application/json',apikey:KEY,Authorization:'Bearer '+(tok||KEY)});
const css=D.createElement('style');css.textContent=`
#tvau{position:fixed;inset:0;z-index:9999;background:#0b0e14;display:flex;align-items:center;justify-content:center;font:14px system-ui;color:#d1d4dc;padding:16px}
#tvau .bx{width:380px;max-width:100%;background:#141822;border:1px solid #232836;border-radius:12px;padding:28px;box-shadow:0 20px 60px #000}
#tvau h1{margin:0 0 4px;font-size:22px;color:#e6b422}#tvau p{margin:0 0 18px;color:#7b8194;font-size:13px}
#tvau input{width:100%;box-sizing:border-box;background:#1b2030;border:1px solid #2a3042;border-radius:8px;color:#fff;padding:12px;margin-bottom:10px;font-size:15px}
#tvau button.m{width:100%;background:#e6b422;color:#111;border:0;border-radius:8px;padding:12px;font-weight:700;font-size:15px;cursor:pointer}
#tvau .tabs{display:flex;gap:6px;margin-bottom:16px}#tvau .tabs button{flex:1;background:#1b2030;border:0;color:#9aa0b0;border-radius:8px;padding:9px;cursor:pointer}#tvau .tabs button.on{background:#2a3042;color:#fff}
#tvau a{color:#6ea8ff;cursor:pointer;font-size:13px}#tvau .msg{min-height:20px;margin:8px 0;font-size:13px;color:#ef5350}#tvau .msg.ok{color:#26a69a}
#tvuser{position:fixed;z-index:120;right:8px;bottom:8px;background:#141822;border:1px solid #232836;border-radius:16px;color:#9aa0b0;font:12px system-ui;padding:4px 10px;cursor:pointer;opacity:.75}#tvuser:hover{opacity:1;color:#fff}`;
D.head.appendChild(css);

const get=()=>{try{return JSON.parse(localStorage.getItem(SK))}catch(e){return null}},put=s=>s?localStorage.setItem(SK,JSON.stringify(s)):localStorage.removeItem(SK);
const mk=j=>({access:j.access_token,refresh:j.refresh_token,exp:Date.now()+(j.expires_in-60)*1000,email:(j.user||{}).email,uid:(j.user||{}).id});
async function api(path,body,tok){const r=await fetch(URL_+path,{method:'POST',headers:H(tok),body:JSON.stringify(body)}),j=await r.json().catch(()=>({}));if(!r.ok)throw Error(j.error_description||j.msg||j.message||('HTTP '+r.status));return j}
async function valid(){let s=get();if(!s)return null;if(Date.now()<s.exp)return s;
 try{const j=await api('/auth/v1/token?grant_type=refresh_token',{refresh_token:s.refresh});s=mk(j);put(s);return s}catch(e){put(null);return null}}

/* ---------- login UI ---------- */
function gate(){return new Promise(res=>{let mode='in';const o=D.createElement('div');o.id='tvau';
 o.innerHTML=`<div class=bx><h1>EDGE Charts</h1><p>Sign in to open your charts</p><div class=tabs><button data-m=in class=on>Login</button><button data-m=up>Sign up</button></div>
 <input id=au_e type=email placeholder="Email" autocomplete=username><input id=au_p type=password placeholder="Password (min 6 characters)" autocomplete=current-password>
 <div class=msg></div><button class=m>Login</button><div style="margin-top:12px;text-align:center"><a data-f>Forgot password?</a></div></div>`;D.body.appendChild(o);
 const e=o.querySelector('#au_e'),p=o.querySelector('#au_p'),msg=o.querySelector('.msg'),btn=o.querySelector('.m'),say=(t,ok)=>{msg.textContent=t;msg.className='msg'+(ok?' ok':'')};
 o.querySelector('.tabs').onclick=ev=>{const m=ev.target.dataset.m;if(!m)return;mode=m;o.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.m===m));btn.textContent=m==='in'?'Login':'Create account';p.autocomplete=m==='in'?'current-password':'new-password';say('')};
 const go=async()=>{if(!e.value||(!p.value&&1)){say('Enter email and password');return}btn.disabled=true;say('…',1);
  try{if(mode==='up'){const j=await api('/auth/v1/signup',{email:e.value.trim(),password:p.value});if(j.access_token){put(mk(j));o.remove();res(get());return}say('Account created. Check your email to confirm, then log in.',1);btn.disabled=false;return}
   const j=await api('/auth/v1/token?grant_type=password',{email:e.value.trim(),password:p.value});put(mk(j));o.remove();res(get())}catch(err){say(err.message);btn.disabled=false}};
 btn.onclick=go;p.onkeydown=ev=>{if(ev.key==='Enter')go()};
 o.querySelector('[data-f]').onclick=async()=>{if(!e.value){say('Type your email first');return}try{await api('/auth/v1/recover',{email:e.value.trim()});say('Password reset email sent.',1)}catch(err){say(err.message)}}})}

/* ---------- cloud sync (table user_state) ---------- */
let sess=null,timer=null,pushing=0;
const rest=(p,opt={})=>fetch(URL_+'/rest/v1/'+p,{...opt,headers:{...H(sess.access),...(opt.headers||{})}});
async function pull(){const r=await rest('user_state?select=data,updated_at&user_id=eq.'+sess.uid);if(!r.ok)return null;const a=await r.json();return a[0]||null}
async function push(){if(!sess||pushing)return;pushing=1;try{await valid();const raw=localStorage.getItem('mcp');if(raw)await rest('user_state?on_conflict=user_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates'},body:JSON.stringify({user_id:sess.uid,data:JSON.parse(raw),updated_at:new Date().toISOString()})})}catch(e){}pushing=0}
const si=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){si.call(this,k,v);if(k==='mcp'&&sess){clearTimeout(timer);timer=setTimeout(push,4000)}};
async function first(){const mk2='tv_sync_'+sess.uid;try{if(!localStorage.getItem(mk2)){const r=await pull();si.call(localStorage,mk2,'1');if(r&&r.data){si.call(localStorage,'mcp',JSON.stringify(r.data));location.reload();return}}push()}catch(e){}}

/* ---------- user chip / logout ---------- */
function chip(){const b=D.createElement('div');b.id='tvuser';b.textContent='👤 '+(sess.email||'account')+' · Logout';b.onclick=async()=>{if(!confirm('Log out?'))return;await push();try{await fetch(URL_+'/auth/v1/logout',{method:'POST',headers:H(sess.access)})}catch(e){}put(null);location.reload()};D.body.appendChild(b)}

(async()=>{sess=await valid()||await gate();chip();first();setInterval(async()=>{if(!(await valid())){location.reload()}},300000)})();
})();
