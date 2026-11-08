/* TV Extras 2 - load AFTER tv-extras.js.
   Replay "cut here", dblclick -> Settings, centre symbol picker, magnet crosshair, movable toolbars,
   Footprint chart (Binance aggTrades) with Delta/Volume/Buy/Sell table. */
(()=>{
if(typeof S==='undefined'||typeof Ch==='undefined'||typeof charts==='undefined')return;
const D=document,$=s=>D.querySelector(s);
const V=S.tv=S.tv||{};V.pos=V.pos||{};
const T0='rgba(0,0,0,0)',say=m=>window.toast&&toast(m);
const css=D.createElement('style');css.textContent=`
.tvm2{position:fixed;inset:0;z-index:620;background:#0008;display:flex;align-items:flex-start;justify-content:center;padding-top:9vh;font:13px system-ui;color:#d1d4dc}
.tvm2 .bx{background:#141414;border-radius:10px;width:720px;max-width:94vw;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 10px 40px #000}
.tvm2 .tp{padding:14px 16px;display:flex;gap:8px;align-items:center;border-bottom:1px solid #2a2a2a}
.tvm2 input{flex:1;background:transparent;border:0;outline:0;color:#fff;font:16px system-ui}
.tvm2 .tb button{background:#222;border:0;color:#d1d4dc;border-radius:14px;padding:5px 12px;margin-left:6px;cursor:pointer}.tvm2 .tb button.on{background:#fff;color:#111}
.tvm2 .ls{overflow:auto;flex:1}.tvm2 .r{display:grid;grid-template-columns:1fr 110px 80px 90px;gap:8px;padding:9px 16px;cursor:pointer;font-variant-numeric:tabular-nums}
.tvm2 .r:hover{background:#262b36}.tvm2 .r b{color:#fff}.tvm2 .h{color:#6b7080;font-size:11px;cursor:default}.tvm2 .h:hover{background:none}
.up2{color:#26a69a}.dn2{color:#ef5350}
#dpfav,#ltb{--g:1}#ltb::before{content:'⋮⋮';display:block;text-align:center;color:#6a6f7d;font-size:11px;cursor:move;padding:2px 0;flex:none;letter-spacing:-2px;transform:rotate(90deg)}
#ltb.tvmv{position:fixed!important;z-index:130;height:auto!important;max-height:92vh;border:1px solid #363a45;border-radius:8px;box-shadow:0 6px 20px #0009}
.tvfp{position:absolute;left:0;top:0;z-index:5;pointer-events:none}
`;D.head.appendChild(css);

/* ================= 1. Replay: pick the cut candle ================= */
const rpOn0=Ch.prototype.rpOn,rpOff0=Ch.prototype.rpOff;
Ch.prototype.rpOn=function(){rpOn0.call(this);this._cut=true;say('Replay: chart එකේ පටන් ගන්න candle එක click කරන්න')};
Ch.prototype.rpOff=function(){this._cut=false;rpOff0.call(this)};
function hookClick(c){hookMag(c);if(c._h2||!c.c)return;c._h2=1;
 c.c.subscribeClick(p=>{if(!c._cut||!p||!p.time||c.rp==null)return;
  const i=c.ag.findIndex(x=>x.time>=p.time);if(i<0)return;
  c.rp=Math.min(c.ag.length,Math.max(30,i+1));c._cut=false;c.render(0);
  say('Replay start: '+new Date(c.ag[c.rp-1].time*1000).toLocaleString()+' (▶ / ⏩ වලින් ඉදිරියට)')});
 const cv=c.host.querySelector('.cv');
 if(cv)cv.addEventListener('dblclick',e=>{if(e.defaultPrevented||e.cancelBubble)return;if(typeof tvSettings==='function')tvSettings()})}

/* ================= 2. Magnet crosshair (body + wicks) while a drawing tool is active ================= */
/* weak = snaps only when the cursor is within 6px of an O/H/L/C level; strong = always snaps to nearest O/H/L/C */
function hookMag(c){return;if(c._hm||!c.c)return;c._hm=1;try{c.c.applyOptions({crosshair:{mode:0}})}catch(e){}
 c.c.subscribeCrosshairMove(p=>{if(c._sn||!p||!p.point||!(+S.set.mag>0)||!c.dpc||c.dpc.style.pointerEvents!=='auto')return;
  const a=c.view(),i=Math.round(c.c.timeScale().coordinateToLogical(p.point.x)),b=a[i],pr=c.s.coordinateToPrice(p.point.y);if(!b||pr==null)return;
  const nr=[b.open,b.high,b.low,b.close].reduce((q,v)=>Math.abs(v-pr)<Math.abs(q-pr)?v:q),yy=c.s.priceToCoordinate(nr);
  if(yy!=null&&(+S.set.mag===2||Math.abs(yy-p.point.y)<=6)){c._sn=1;try{c.c.setCrosshairPosition(nr,b.time,c.s)}catch(e){}c._sn=0}})}

/* ================= 3. Centre symbol picker ================= */
let PL=null,PT=0;
async function perps(){if(PL&&Date.now()-PT<60000)return PL;
 const[t,i]=await Promise.all([jget('https://fapi.binance.com/fapi/v1/ticker/24hr'),jget('https://fapi.binance.com/fapi/v1/exchangeInfo')]);
 const ok=new Set((i.symbols||[]).filter(x=>x.contractType==='PERPETUAL'&&x.quoteAsset==='USDT'&&x.status==='TRADING').map(x=>x.symbol));
 PL=t.filter(x=>ok.size?ok.has(x.symbol):x.symbol.endsWith('USDT')).map(x=>({s:'BF:'+x.symbol,n:x.symbol+'.P',p:+x.lastPrice,c:+x.priceChangePercent,v:+x.quoteVolume})).sort((a,b)=>b.v-a.v);PT=Date.now();return PL}
window.tvPerps=perps;
const fm=v=>v>=1e9?(v/1e9).toFixed(2)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(0)+'K':String(v|0);
const fp2=p=>p>=1000?p.toFixed(2):p>=1?p.toFixed(4):p.toPrecision(4);
async function picker(){let tab='perp',data=[];
 const m=D.createElement('div');m.className='tvm2';
 m.innerHTML=`<div class=bx><div class=tp>⌕<input placeholder="Symbol (BTCUSDT.P, XAUUSD ...)" spellcheck=false><span class=tb><button data-t=perp class=on>Crypto perps</button><button data-t=fx>Forex</button><button data-t=mt5>MT5</button></span></div><div class=fl style="display:flex;gap:8px;padding:8px 16px;border-bottom:1px solid #2a2a2a"><select id=tvfc></select><select id=tvfv></select><span style="flex:1"></span><button id=tvos style="background:#222;border:0;color:#d1d4dc;border-radius:14px;padding:5px 12px;cursor:pointer">Open Screener ↗</button></div><div class=ls></div></div>`;
 D.body.appendChild(m);const q=m.querySelector('input'),ls=m.querySelector('.ls'),fl=m.querySelector('.fl'),sc=m.querySelector('#tvfc'),sv=m.querySelector('#tvfv');q.focus();let sk='v',sd=-1;const F=window.TVF||{CHG:[],VOL:[]};
 sc.innerHTML='<option value="">Chg % (all)</option>'+F.CHG.map((p,i)=>`<option value=${i}>Chg: ${p[0]}</option>`).join('');sv.innerHTML='<option value="">Vol 24h (all)</option>'+F.VOL.map((p,i)=>`<option value=${i}>Vol: ${p[0]}</option>`).join('');
 sc.onchange=sv.onchange=()=>draw();m.querySelector('#tvos').onclick=()=>{m.remove();window.tvScreener&&tvScreener()};
 const go=s=>{m.remove();act.setSym(s)};
 const draw=()=>{const k=q.value.trim().toUpperCase();let L=data.filter(x=>!k||x.n.toUpperCase().includes(k));fl.style.display=tab==='perp'?'flex':'none';
  if(tab==='perp'){const c=F.CHG[sc.value],v=F.VOL[sv.value];if(c)L=L.filter(x=>x.c>=c[1]&&x.c<c[2]);if(v)L=L.filter(x=>x.v>=v[1]&&x.v<v[2]);L=L.slice().sort((a,b)=>sd*((a[sk]>b[sk])-(a[sk]<b[sk])))}
  L=L.slice(0,500);const ar=key=>sk===key?(sd<0?' ↓':' ↑'):'';
  ls.innerHTML=`<div class="r h" style="position:sticky;top:0;background:#141414"><span ${tab==='perp'?'data-sk=n style="cursor:pointer"':''}>Symbol${tab==='perp'?ar('n'):''}</span><span ${tab==='perp'?'data-sk=p style="cursor:pointer"':''}>Last${tab==='perp'?ar('p'):''}</span><span ${tab==='perp'?'data-sk=c style="cursor:pointer"':''}>Chg%${tab==='perp'?ar('c'):''}</span><span ${tab==='perp'?'data-sk=v style="cursor:pointer"':''}>Vol 24h${tab==='perp'?ar('v'):''}</span></div>`+(L.length?L.map(x=>`<div class=r data-s="${x.s}"><b>${x.n}</b><span>${x.p?fp2(x.p):''}</span><span class="${x.c>=0?'up2':'dn2'}">${x.p?(x.c>=0?'+':'')+x.c.toFixed(2)+'%':''}</span><span>${x.v?fm(x.v):''}</span></div>`).join(''):'<div class=r>Loading / no results…</div>')};
 const load=async()=>{data=[];draw();try{
  if(tab==='perp')data=await perps();
  else if(tab==='fx')data=FXLIST.map(s=>({s:'FX:'+s,n:s,p:0,c:0,v:0}));
  else{const n=await(await fetch(`${S.bridge}/symbols?q=`)).json();data=n.map(s=>({s:'MT5:'+s,n:s,p:0,c:0,v:0}))}}catch(e){ls.innerHTML='<div class=r>Load failed: '+(e.message||e)+'</div>';return}draw()};
 m.querySelector('.tb').onclick=e=>{if(!e.target.dataset.t)return;tab=e.target.dataset.t;m.querySelectorAll('.tb button').forEach(b=>b.classList.toggle('on',b===e.target));load()};
 ls.onclick=e=>{const h=e.target.closest('[data-sk]');if(h){const k2=h.dataset.sk;if(sk===k2)sd=-sd;else{sk=k2;sd=k2==='n'?1:-1}draw();return}const r=e.target.closest('[data-s]');if(r)go(r.dataset.s)};q.oninput=draw;
 q.onkeydown=e=>{if(e.key==='Escape')m.remove();if(e.key==='Enter'){let v=q.value.trim().toUpperCase();if(!v){const f=ls.querySelector('[data-s]');if(f)go(f.dataset.s);return}
  if(/\.P$/.test(v))v='BF:'+v.slice(0,-2);else if(/USDT$/.test(v)&&!v.includes(':'))v='BF:'+v;go(v)}};
 m.onmousedown=e=>{if(e.target===m)m.remove()};load()}
D.addEventListener('mousedown',e=>{const t=e.target;if(t.id==='esym'){e.preventDefault();e.stopPropagation();t.blur();picker()}},true);
const pb=$('#e_perp');if(pb)pb.textContent='Crypto';

/* ================= 4. Movable toolbars (drag the ⋮⋮ grip / panel edge; double-click grip = dock back) ================= */
function mv(id,hit){const el=$('#'+id);if(!el||el._mv)return;el._mv=1;
 const place=p=>{el.classList.add('tvmv');el.style.left=p.l+'px';el.style.top=p.t+'px';el.style.transform='none';el.style.right='auto'};
 if(V.pos[id])place(V.pos[id]);
 el.addEventListener('mousedown',e=>{if(!hit(e))return;e.preventDefault();const r=el.getBoundingClientRect(),dx=e.clientX-r.left,dy=e.clientY-r.top;
  const mm=ev=>{const p={l:Math.max(0,Math.min(innerWidth-40,ev.clientX-dx)),t:Math.max(0,Math.min(innerHeight-40,ev.clientY-dy))};V.pos[id]=p;place(p)};
  const up=()=>{D.removeEventListener('mousemove',mm);D.removeEventListener('mouseup',up);save()};D.addEventListener('mousemove',mm);D.addEventListener('mouseup',up)});
 el.addEventListener('dblclick',e=>{if(!hit(e))return;delete V.pos[id];el.classList.remove('tvmv');el.style.cssText=id==='dpfav'?'':'';save();dispatchEvent(new Event('resize'))})}
const grab=id=>e=>e.target.id===id;
setInterval(()=>{mv('ltb',e=>e.target.id==='ltb'||e.target.classList.contains('sep')||e.offsetY<14&&e.target.id==='ltb');mv('dpfav',e=>!!(e.target.closest&&e.target.closest('.dpgrip')))},800);

/* ================= 5. Footprint v2 =================
   * REAL trades: Binance aggTrades back-filled bar by bar (newest first, visible bars first, throttled), live bars from the WebSocket,
     finished bars cached in IndexedDB so reloads / revisits are instant.
   * Bars not yet back-filled are ESTIMATED from klines (finest interval that covers the whole loaded history, up to ~30k candles),
     using the real O-H-L-C path + taker-buy volume (not a flat spread). More history loads automatically when you scroll left.
   * Drawing is dirty-checked (only when view / data changed, live ticks max ~7 fps) with a linear price->pixel map. */
const nice=r=>{const e=Math.pow(10,Math.floor(Math.log10(r))),f=r/e;return(f<1.5?1:f<3.5?2:f<7.5?5:10)*e};
const fq=v=>v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v>=100?v.toFixed(0):v>=1?v.toFixed(1):v.toFixed(2);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const FP={tok:120,ts:Date.now(),pause:0,RATE:22,CAP:120,MAXP:30,MAXPG:12};
/* token bucket in Binance 'weight' units (22/s = ~1300/min, limit is 2400/min) shared by ALL footprint requests */
const gateW=async w=>{for(;;){const n=Date.now();FP.tok=Math.min(FP.CAP,FP.tok+(n-FP.ts)/1000*FP.RATE);FP.ts=n;if(n<FP.pause){await sleep(FP.pause-n);continue}if(FP.tok>=w){FP.tok-=w;return}await sleep(Math.ceil((w-FP.tok)/FP.RATE*1000)+25)}};
async function fpGet(u,w){w=w||20;for(let i=0;i<3;i++){await gateW(w);const r=await fetch(u);
  const used=+r.headers.get('x-mbx-used-weight-1m')||0;if(used>1650)FP.pause=Date.now()+(60000-Date.now()%60000)+800;
  if(r.status===429||r.status===418){const s=Math.max(5,+r.headers.get('retry-after')||30)*1000;FP.pause=Date.now()+s;continue}
  if(!r.ok)throw Error('HTTP '+r.status);return r.json()}throw Error('rate limited - waiting')}
/* ---- IndexedDB cache ---- */
let _db=null;const idb=()=>_db||(_db=new Promise(res=>{try{const q=indexedDB.open('edge-fp',1);q.onupgradeneeded=()=>q.result.createObjectStore('b');q.onsuccess=()=>res(q.result);q.onerror=()=>res(null)}catch(e){res(null)}}));
async function idbPut(key,val){const d=await idb();if(!d)return;try{d.transaction('b','readwrite').objectStore('b').put(val,key)}catch(e){}}
async function idbLoad(pfx){const d=await idb();if(!d)return[];return new Promise(res=>{const out=[];try{const r=d.transaction('b').objectStore('b').openCursor(IDBKeyRange.bound(pfx,pfx+'\uffff'));
  r.onsuccess=()=>{const c=r.result;if(c){out.push([c.key,c.value]);c.continue()}else res(out)};r.onerror=()=>res(out)}catch(e){res(out)}})}
const ser=B=>[B.b,B.s,[...B.lv].map(([k,v])=>[k,v[0],v[1]])];
const des=a=>{const B={lv:new Map(),b:a[0],s:a[1],mx:0};a[2].forEach(x=>{B.lv.set(x[0],[x[1],x[2]]);B.mx=Math.max(B.mx,x[1]+x[2])});return B};
const newB=()=>({lv:new Map(),b:0,s:0,mx:0});
function addTr(F,map,T,p,q,sell){const t=Math.floor(T/1000/F.per)*F.per;let B=map.get(t);if(!B){B=newB();map.set(t,B)}
 const k=Math.floor(p/F.step+1e-9);let L=B.lv.get(k);if(!L){L=[0,0];B.lv.set(k,L)}if(sell){L[0]+=q;B.s+=q}else{L[1]+=q;B.b+=q}const tt=L[0]+L[1];if(tt>B.mx)B.mx=tt;return t}
function fpBar(F,t){return(F.real.has(t)&&F.bars.get(t))||F.syn.get(t)||null}
/* ---- estimate one kline over the price path O->(L|H)->(H|L)->C; buyers dominate up-moves, sellers down-moves; totals match taker volume ---- */
function estK(F,B,k){const o=+k[1],h=+k[2],l=+k[3],cl=+k[4],vol=+k[5],tb=Math.min(vol,+k[9]||vol/2),st=F.step;if(!(vol>0))return;
 const pts=cl>=o?[o,l,h,cl]:[o,h,l,cl],wu=new Map(),wd=new Map();let any=0;
 for(let s=0;s<3;s++){const a=pts[s],b=pts[s+1],lo=Math.min(a,b),hi=Math.max(a,b),m=b>=a?wu:wd;if(hi<=lo)continue;
  for(let i=Math.floor(lo/st+1e-9),z=Math.floor(hi/st+1e-9);i<=z;i++){const ov=Math.min(hi,(i+1)*st)-Math.max(lo,i*st);if(ov>0){m.set(i,(m.get(i)||0)+ov);any=1}}}
 if(!any){const i=Math.floor(cl/st+1e-9);wu.set(i,1);wd.set(i,1)}
 const lv=new Set([...wu.keys(),...wd.keys()]);let sb=0,ss=0;const raw=new Map();
 lv.forEach(i=>{const u=wu.get(i)||0,d=wd.get(i)||0,b=u*.7+d*.3,s=u*.3+d*.7;raw.set(i,[b,s]);sb+=b;ss+=s});
 raw.forEach((r,i)=>{let L=B.lv.get(i);if(!L){L=[0,0];B.lv.set(i,L)}L[1]+=sb?tb*r[0]/sb:0;L[0]+=ss?(vol-tb)*r[1]/ss:0});B.b+=tb;B.s+=vol-tb}
const IVS=[[1,'1m'],[3,'3m'],[5,'5m'],[15,'15m'],[30,'30m'],[60,'1h'],[120,'2h'],[240,'4h']];
async function fpSynLoad(c,F,fromMs,toMs){const tf=Math.max(1,Math.round(c.tfm)),ps=1000,span=(toMs-fromMs)/60000;
 const L=IVS.filter(x=>tf%x[0]===0);let pick=L[L.length-1];for(const x of L){if(Math.ceil(span/(x[0]*ps))<=FP.MAXPG){pick=x;break}}
 const ivMs=pick[0]*60000,pages=Math.min(FP.MAXPG,Math.ceil((toMs-fromMs)/(ivMs*ps))),m=new Map();F.ivl=pick[1];
 for(let i=0;i<pages&&!F.dead;i+=6){const R=await Promise.all(Array.from({length:Math.min(6,pages-i)},(_,j)=>fpGet(`${F.base}/klines?symbol=${c.name}&interval=${pick[1]}&limit=${ps}&endTime=${toMs-(i+j)*ps*ivMs-1}`,F.fut?5:2).catch(()=>null)));
  R.forEach(j=>Array.isArray(j)&&j.forEach(k=>m.set(k[0],k)));await sleep(80)}
 const ks=[...m.values()].sort((a,b)=>a[0]-b[0]);if(F.dead)return 0;if(!ks.length){F.synMore=0;return 0}
 const first=Math.ceil(Math.max(ks[0][0],fromMs)/1000/F.per)*F.per,lim=Math.floor(toMs/1000/F.per)*F.per+F.per,tmp=new Map();
 ks.forEach(k=>{const bt=Math.floor(k[0]/1000/F.per)*F.per;if(bt<first||bt>=lim||F.syn.has(bt))return;let B=tmp.get(bt);if(!B){B=newB();tmp.set(bt,B)}estK(F,B,k)});
 tmp.forEach((B,t)=>{B.lv.forEach(v=>{B.mx=Math.max(B.mx,v[0]+v[1])});F.syn.set(t,B)});
 F.synFrom=Math.min(F.synFrom==null?Infinity:F.synFrom,first);if(ks[0][0]>fromMs+ivMs*ps)F.synMore=0;F.ver++;return 1}
/* ---- real trades for one bar [t, t+per) ---- */
async function fpFill(c,F,t){const end=(t+F.per)*1000,tmp=new Map();let ws=t*1000,fromId=null,done=false,pages=0;
 for(;pages<FP.MAXP&&!F.dead&&!done;pages++){
  const wend=Math.min(end-1,ws+3599999),u=fromId!=null?`${F.base}/aggTrades?symbol=${c.name}&fromId=${fromId}&limit=1000`:`${F.base}/aggTrades?symbol=${c.name}&startTime=${ws}&endTime=${wend}&limit=1000`;
  const j=await fpGet(u,F.fut?20:2);if(!Array.isArray(j))return false;
  if(pages===0&&fromId==null&&j.length>=1000){const sp=(j[j.length-1].T-j[0].T)||1;if((F.per*1000)/sp>FP.MAXP*.9){F.skip.set(t,Infinity);return false}}
  if(!j.length){if(fromId!=null){done=true;break}ws+=3600000;if(ws>=end){done=true;break}continue}
  for(const x of j){if(x.T>=end||x.a>F.bA){done=true;break}addTr(F,tmp,x.T,+x.p,+x.q,x.m)}
  if(done)break;fromId=j[j.length-1].a+1;
  if(j.length<1000&&wend===end-1&&u.indexOf('startTime')>0)done=true}
 if(!done||F.dead)return false;
 let B=F.bars.get(t);const T=tmp.get(t);
 if(!B)B=T||newB();else if(T){T.lv.forEach((v,k)=>{let L=B.lv.get(k);if(!L){L=[0,0];B.lv.set(k,L)}L[0]+=v[0];L[1]+=v[1];B.mx=Math.max(B.mx,L[0]+L[1])});B.b+=T.b;B.s+=T.s}
 F.bars.set(t,B);F.real.add(t);F.ver++;
 if(t+F.per<=Date.now()/1000-2&&t+F.per<=F.wsBar-F.per+0)idbPut(F.pfx+'|'+t,ser(B));return true}
function fpNext(c,F){const a=c.view();if(!a.length)return null;const ts=c.c.timeScale(),vr=ts.getVisibleLogicalRange();if(!vr)return null;
 const i0=Math.max(0,Math.floor(vr.from)),i1=Math.min(a.length-1,Math.ceil(vr.to)),now=Date.now(),ok=t=>t<F.wsBar&&!F.real.has(t)&&!F.cur.has(t)&&(F.skip.get(t)||0)<now;
 for(let i=i1;i>=i0;i--)if(ok(a[i].time))return a[i].time;
 for(let i=i0-1;i>=Math.max(0,i0-30);i--)if(ok(a[i].time))return a[i].time;return null}
async function fpWorker(c,F){while(!F.dead){const t=fpNext(c,F);if(t==null){await sleep(1200);continue}F.cur.add(t);
  try{const ok=await fpFill(c,F,t);if(!ok&&!F.dead)F.skip.set(t,Infinity)}catch(e){F.err=String(e.message||e);F.skip.set(t,Date.now()+60000);await sleep(2000)}F.cur.delete(t)}}
function fpStop(c){if(c._fp){const F=c._fp;F.dead=1;if(F.ws){F.ws.onmessage=null;F.ws.onclose=null;try{F.ws.close()}catch(e){}}c._fp=null;c._fs1=null}}
async function fpStart(c){const key=c.src+c.name+c.tfm;if(c._fp&&c._fp.key===key)return;
 if(!(c.src==='BF'||c.src==='BN')){fpStop(c);c._fp={key,none:1,bars:new Map(),syn:new Map(),real:new Set(),step:1,ver:0};return}
 const a0=c.view();if(a0.length<5)return;fpStop(c);
 const a=a0.slice(-30),avg=a.reduce((s,x)=>s+x.high-x.low,0)/a.length||1,fut=c.src==='BF',base=fut?'https://fapi.binance.com/fapi/v1':'https://api.binance.com/api/v3',per=c.tfm*60;
 const sk='fpstep|'+c.src+c.name+c.tfm,ns=nice(avg/9),old=+localStorage.getItem(sk);const step=old>0&&old/ns>.25&&old/ns<4?old:ns;try{localStorage.setItem(sk,step)}catch(e){}
 const F=c._fp={key,per,fut,base,step,bars:new Map(),syn:new Map(),real:new Set(),skip:new Map(),cur:new Set(),ver:0,maxA:0,bA:0,wsBar:Infinity,buf:[],ready:0,pfx:`${fut?'F':'S'}|${c.name}|${c.tfm}|${step}`,synFrom:null,synMore:1};
 const live=d=>{if(d.a<=F.maxA)return;F.maxA=d.a;const t=addTr(F,F.bars,d.T,+d.p,+d.q,d.m);if(t>=F.wsBar)F.real.add(t);F.ver++};
 F.ws=new WebSocket(`wss://${fut?'fstream.binance.com':'stream.binance.com:9443'}/ws/${c.name.toLowerCase()}@aggTrade`);
 F.ws.onmessage=e=>{const d=JSON.parse(e.data);if(!d||!d.p)return;if(!F.ready){F.buf.push(d);return}live(d)};
 F.ws.onclose=()=>{if(!F.dead)setTimeout(()=>{if(c._fp===F)fpStop(c)},2500)};
 /* estimates for the whole loaded history (fast, few requests) */
 const rc=a0[Math.max(0,a0.length-120)].time*1000;fpSynLoad(c,F,rc,Date.now()).then(()=>a0.length>120?fpSynLoad(c,F,a0[0].time*1000,rc):0).catch(e=>{F.err=String(e.message||e)});
 try{
  const cached=await idbLoad(F.pfx+'|');cached.forEach(([k,v])=>{const t=+k.split('|').pop();F.bars.set(t,des(v));F.real.add(t)});F.ver++;
  const j=await fpGet(`${base}/aggTrades?symbol=${c.name}&limit=1`,fut?20:2);
  if(Array.isArray(j)&&j[0]){F.bA=j[0].a;F.maxA=j[0].a;F.wsBar=Math.floor(j[0].T/1000/per)*per+per}
  F.real.forEach(t=>{if(t>=F.wsBar-per)F.real.delete(t)});
 }catch(e){F.err=String(e.message||e)}
 F.ready=1;F.buf.forEach(live);F.buf=[];
 fpWorker(c,F);fpWorker(c,F)}
const FPC=(()=>{const u=[],d=[];for(let i=0;i<12;i++){const al=(.15+.55*i/11).toFixed(3);u.push(`rgba(38,166,154,${al})`);d.push(`rgba(239,83,80,${al})`)}return{u,d}})();
function fpDraw(c){const cv=c.host.querySelector('.cv');if(!cv)return;let k=c._fk;
 if(!k||!k.isConnected){k=c._fk=D.createElement('canvas');k.className='tvfp';cv.style.position='relative';cv.appendChild(k);c._fs1=null}
 if(c.style!=='footprint'){if(c._fp)fpStop(c);if(k._on){k.getContext('2d').clearRect(0,0,k.width,k.height);k._on=0}return}
 if(D.hidden)return;
 fpStart(c);const F=c._fp;if(!F)return;const ts=c.c.timeScale(),a=c.view(),vr=ts.getVisibleLogicalRange();if(!vr||!a.length)return;
 const dpr=devicePixelRatio||1,w=cv.clientWidth,h=cv.clientHeight,last=a[a.length-1],sp=ts.options().barSpacing;
 const y1=c.s.priceToCoordinate(last.close),y2=c.s.priceToCoordinate(last.close+F.step*10);
 const s1=[w,h,dpr,vr.from.toFixed(1),vr.to.toFixed(1),y1,y2,a.length,last.time,sp,!!c.cfg.log,F.step,F.err||''].join(),now=Date.now();
 if(s1===c._fs1&&F.ver===c._fv)return;if(s1===c._fs1&&now-c._fkT<150)return;c._fs1=s1;c._fv=F.ver;c._fkT=now;k._on=1;
 /* scrolled past the estimated history -> load older klines */
 if(!F.none&&!F.synBusy&&F.synMore&&F.synFrom!=null&&a[0].time<F.synFrom-F.per){F.synBusy=1;fpSynLoad(c,F,a[0].time*1000,F.synFrom*1000).catch(e=>{F.err=String(e.message||e)}).then(()=>{F.synBusy=0})}
 if(k.width!==w*dpr||k.height!==h*dpr){k.width=w*dpr;k.height=h*dpr;k.style.width=w+'px';k.style.height=h+'px'}
 const g=k.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);
 let pw=56,th=26;try{pw=c.c.priceScale('right').width()||56;th=ts.height()||26}catch(e){}
 const bw=Math.max(2,sp*.92),H=h-th,RH=15,TH=RH*4,ty=H-TH,i0=Math.max(0,Math.floor(vr.from)),i1=Math.min(a.length-1,Math.ceil(vr.to));
 const lin=!c.cfg.log&&y1!=null&&y2!=null,sl=lin?(y2-y1)/(F.step*10):0,Y=lin?(p=>y1+(p-last.close)*sl):(p=>c.s.priceToCoordinate(p));
 g.fillStyle='rgba(19,23,34,.94)';g.fillRect(0,ty,w-pw,TH);g.textBaseline='middle';
 const labs=['Delta','Volume','Buy','Sell'],hh0=Math.abs(Y(F.step)-Y(0)),txt=hh0>=10&&sp>=44,small=sp<3;
 if(txt)g.font=Math.min(11,hh0-2)+'px system-ui';let nr=0,ne=0;
 for(let i=i0;i<=i1;i++){const x=ts.logicalToCoordinate(i);if(x==null||x<-bw||x>w-pw+bw)continue;const t=a[i].time,B=fpBar(F,t);if(!B)continue;F.real.has(t)?nr++:ne++;
  if(!small){const mx=B.mx||1;
   B.lv.forEach((v,kk)=>{const yt=Y((kk+1)*F.step),yb=Y(kk*F.step);if(yt==null||yb==null||yb<0||yt>ty)return;const hh=yb-yt,tt=v[0]+v[1],ci=Math.round(11*tt/mx);
    g.fillStyle=(v[1]>=v[0]?FPC.u:FPC.d)[ci];g.fillRect(x-bw/2,yt,bw,Math.max(1,hh-1));
    if(tt===mx){g.strokeStyle='#e6b422';g.lineWidth=1;g.strokeRect(x-bw/2,yt,bw,Math.max(1,hh-1))}
    if(txt){g.fillStyle='#fff';g.textAlign='right';g.fillText(fq(v[0]),x-2,yt+hh/2);g.textAlign='left';g.fillText(fq(v[1]),x+2,yt+hh/2)}})}
  const d=B.b-B.s,vals=[d,B.b+B.s,B.b,B.s];
  vals.forEach((v,r)=>{const yy=ty+r*RH;if(r===0){g.fillStyle=d>=0?'rgba(38,166,154,.55)':'rgba(239,83,80,.55)';g.fillRect(x-bw/2,yy+1,bw,RH-1)}
   if(sp>=30){g.fillStyle='#e5e5e5';g.textAlign='center';g.font='10px system-ui';g.fillText(fq(v),x,yy+RH/2+1)}})}
 g.textAlign='left';g.font='10px system-ui';labs.forEach((l,r)=>{g.fillStyle='rgba(19,23,34,.9)';g.fillRect(0,ty+r*RH,44,RH);g.fillStyle='#9aa0b0';g.fillText(l,4,ty+r*RH+RH/2+1)});
 g.strokeStyle='#2a2e39';for(let r=0;r<=4;r++){g.beginPath();g.moveTo(0,ty+r*RH);g.lineTo(w-pw,ty+r*RH);g.stroke()}
 g.textAlign='left';g.font='11px system-ui';
 if(F.none){g.fillStyle='#e6b422';g.fillText('Footprint: Binance symbols only (tick data needed)',52,ty-10)}
 else{const busy=F.cur.size||!F.ready;let m=`● Real trades: ${nr} bars`+(ne?` · ${ne} estimated (${F.ivl||'…'} klines)`:'')+(busy?' · loading…':'')+(FP.pause>now?' · rate-limit pause':'');
  g.fillStyle=ne||busy?'#e6b422':'#26a69a';if(F.err&&!nr&&!ne){m='Tick data error: '+F.err;g.fillStyle='#ef5350'}g.fillText(m,52,ty-10)}}

/* header: full coin name (ZECUSDT.P for Binance perps) + timeframe, width measured so nothing is cut */
const mctx=D.createElement('canvas').getContext('2d'),tw=(s,f)=>{mctx.font=f;return Math.ceil(mctx.measureText(s).width)};
setInterval(()=>charts.forEach(c=>{const i=c.host&&c.host.querySelector('.hd input.sy');if(!i||D.activeElement===i)return;
 const v=c.src==='BF'?c.name+'.P':String(i.value).replace(/^[A-Za-z0-9]+:/,'');if(i.value!==v)i.value=v;i.style.width=(tw(v,'600 11px "Segoe UI",system-ui')+16)+'px';
 const f=c.host.querySelector('.hd input.tf');if(f)f.style.width=(tw(f.value,'400 11px "Segoe UI",system-ui')+14)+'px'}),400);
/* selected drawing: highlight its price range on the price axis and its time range on the time axis (like TradingView) */
setInterval(()=>charts.forEach(c=>{const cv=c.host&&c.host.querySelector('.cv');if(!cv||!c.s)return;
 let bp=c._bp,bt=c._bt;if(!bp||!bp.isConnected){bp=c._bp=D.createElement('div');bt=c._bt=D.createElement('div');[bp,bt].forEach(e=>{e.style.cssText='position:absolute;z-index:6;pointer-events:none;background:rgba(41,98,255,.38);display:none';cv.appendChild(e)})}
 const o=window.DPX&&DPX.selo(),L=o&&o.p&&(S.dp[c.cfg.sym]||[]).includes(o)?o.p:null;if(!L||L.length<2||(o.k&&['brush','hilite'].includes(o.k))){bp.style.display=bt.style.display='none';return}
 try{const ts=c.c.timeScale(),a=c.view(),w=cv.clientWidth,h=cv.clientHeight;let pw=56,th=26;try{pw=c.c.priceScale('right').width()||56;th=ts.height()||26}catch(e){}
  const ys=L.map(q=>c.s.priceToCoordinate(q.p)).filter(v=>v!=null),xs=L.map(q=>{let i=a.findIndex(b=>b.time>=q.t);if(i<0)i=a.length-1;return ts.logicalToCoordinate(i)}).filter(v=>v!=null);
  if(!ys.length||!xs.length){bp.style.display=bt.style.display='none';return}
  const y1=Math.min(...ys),y2=Math.max(...ys),x1=Math.min(...xs),x2=Math.max(...xs);
  bp.style.cssText+=`;display:block;left:${w-pw}px;width:${pw}px;top:${y1}px;height:${Math.max(2,y2-y1)}px`;bt.style.cssText+=`;display:block;top:${h-th}px;height:${th}px;left:${x1}px;width:${Math.max(2,x2-x1)}px`}catch(e){}}),150);
const wrap=(n,fn)=>{const o=Ch.prototype[n];Ch.prototype[n]=function(...a){const r=o.apply(this,a);try{fn.call(this)}catch(e){console.warn('tv2',e)}return r}};
wrap('render',function(){hookClick(this);if(this.style==='footprint')fpDraw(this)});
wrap('setStyle',function(){if(this.style!=='footprint')fpDraw(this);else if(window.tvSettings)this.render(0)});
wrap('load',function(){if(this._fp)fpStop(this)});
wrap('destroy',function(){fpStop(this)});
setInterval(()=>charts.forEach(c=>{try{hookClick(c);if(c.style==='footprint'||(c._fk&&c._fk._on))fpDraw(c)}catch(e){}}),120);
/* ---- faster candle loading for Binance perps: 3 pages in PARALLEL + 20s cache (coin / timeframe switches) ---- */
const exb=exCandles,FC=new Map();
exCandles=async function(src,s,n,c){if(src!=='BF'||(c&&c<=3))return exb.apply(this,arguments);
 const key=s+'|'+n,hit=FC.get(key);if(hit&&Date.now()-hit.t<20000)return hit.d.map(x=>({...x}));
 const ms=n*60000,now=Date.now(),pg=k=>jget(`https://fapi.binance.com/fapi/v1/klines?symbol=${s}&interval=${BN[n]}&limit=1000`+(k?`&endTime=${now-k*1000*ms-1}`:''));
 const R=await Promise.all([pg(0),pg(1),pg(2)].map(p=>p.catch(()=>null)));
 if(!Array.isArray(R[0])||!R[0].length)throw Error('Binance futures: '+(R[0]&&R[0].msg||'no data for '+s));
 const m=new Map();R.forEach(j=>Array.isArray(j)&&j.forEach(k=>m.set(k[0],{time:k[0]/1000,open:+k[1],high:+k[2],low:+k[3],close:+k[4],volume:+k[5]})));
 const out=[...m.values()].sort((a,b)=>a.time-b.time);FC.set(key,{t:Date.now(),d:out});return out.map(x=>({...x}))};

/* ---- live price: if the kline WebSocket is silent for 3s, poll the last price every second (tick by tick) ---- */
wrap('tick',function(){if(!this._pp)this._lt=Date.now()});
async function pollPx(c){const j=await jget(c.src==='BF'?`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${c.name}`:`https://api.binance.com/api/v3/ticker/price?symbol=${c.name}`),p=+(j&&j.price);
 const r=c.raw,l=r&&r[r.length-1];if(!l||!p)return;const per=c.nat*60;
 if(Date.now()/1000>=l.time+per)c.tick({time:l.time+per*Math.floor((Date.now()/1000-l.time)/per),open:p,high:p,low:p,close:p,volume:0});
 else c.tick({...l,close:p,high:Math.max(l.high,p),low:Math.min(l.low,p)})}
setInterval(()=>charts.forEach(async c=>{if(!c.ok||c.rp!=null||c._wd||c.src==='MT5'||!c.raw)return;const idle=Date.now()-(c._lt||0),bin=c.src==='BF'||c.src==='BN';
 if(idle<(bin?3000:12000))return;c._wd=1;c._pp=1;
 try{if(bin)await pollPx(c);else{const d=await exCandles(c.src,c.name,c.nat,2);d.forEach(x=>c.tick(x))}}catch(e){}c._pp=0;c._wd=0}),1000);
charts.forEach(hookClick);
})();
