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
#dpfav{cursor:move}.tvfp{position:absolute;left:0;top:0;z-index:5;pointer-events:none}
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
setInterval(()=>{mv('ltb',e=>e.target.id==='ltb'||e.target.classList.contains('sep')||e.offsetY<14&&e.target.id==='ltb');mv('dpfav',grab('dpfav'))},800);

/* ================= 5. Footprint ================= */
const nice=r=>{const e=Math.pow(10,Math.floor(Math.log10(r))),f=r/e;return(f<1.5?1:f<3.5?2:f<7.5?5:10)*e};
const fq=v=>v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v>=100?v.toFixed(0):v>=1?v.toFixed(1):v.toFixed(2);
function fpAdd(c,F,T,p,q,sellAgg){const per=c.tfm*60,t=Math.floor(T/1000/per)*per;let B=F.bars.get(t);if(!B){B={lv:new Map(),b:0,s:0};F.bars.set(t,B)}
 const k=Math.floor(p/F.step+1e-9);let L=B.lv.get(k);if(!L){L=[0,0];B.lv.set(k,L)}if(sellAgg){L[0]+=q;B.s+=q}else{L[1]+=q;B.b+=q}}
/* real trades are used where fully covered (t0..now); older bars are ESTIMATED from 1m klines (exact volume + taker-buy split, spread over the candle's price range) */
function fpBar(F,t){return(F.t0!=null&&t>=F.t0&&F.bars.get(t))||F.syn.get(t)||null}
function fpSyn(c,F,ks,from){const per=c.tfm*60,m=new Map();
 ks.forEach(k=>{const bt=Math.floor(k[0]/1000/per)*per;if(from!=null&&bt<from)return;const lo=+k[3],hi=+k[2],vol=+k[5],tb=+k[9]||0;let B=m.get(bt);if(!B){B={lv:new Map(),b:0,s:0};m.set(bt,B)}
  const a=Math.floor(lo/F.step+1e-9),z=Math.floor(hi/F.step+1e-9),n=z-a+1,buy=tb/n,sell=(vol-tb)/n;
  for(let i=a;i<=z;i++){let L=B.lv.get(i);if(!L){L=[0,0];B.lv.set(i,L)}L[0]+=sell;L[1]+=buy}B.s+=vol-tb;B.b+=tb});
 m.forEach((B,t)=>F.syn.set(t,B))}
async function fpSynLoad(c,F,mins){const fut=c.src==='BF',base=fut?'https://fapi.binance.com/fapi/v1':'https://api.binance.com/api/v3',ps=fut?1500:1000,pages=Math.min(6,Math.ceil(mins/ps)),now=Date.now(),per=c.tfm*60;
 const R=await Promise.all(Array.from({length:pages},(_,i)=>jget(`${base}/klines?symbol=${c.name}&interval=1m&limit=${ps}&endTime=${now-i*ps*60000}`).catch(()=>null)));
 const m=new Map();R.forEach(j=>Array.isArray(j)&&j.forEach(k=>m.set(k[0],k)));const ks=[...m.values()].sort((a,b)=>a[0]-b[0]);if(F.dead||!ks.length)return;
 fpSyn(c,F,ks,Math.ceil(ks[0][0]/1000/per)*per)}
function fpStop(c){if(c._fp){c._fp.dead=1;clearInterval(c._fp.sy);if(c._fp.ws){c._fp.ws.onmessage=null;c._fp.ws.close()}c._fp=null}}
async function fpStart(c){const key=c.src+c.name+c.tfm;if(c._fp&&c._fp.key===key)return;
 if(!(c.src==='BF'||c.src==='BN')){fpStop(c);c._fp={key,none:1,bars:new Map(),syn:new Map(),step:1};return}
 const a0=c.view();if(a0.length<5)return;fpStop(c);
 const a=a0.slice(-30),avg=a.reduce((s,x)=>s+x.high-x.low,0)/a.length||1,fut=c.src==='BF',base=fut?'https://fapi.binance.com/fapi/v1':'https://api.binance.com/api/v3';
 const F=c._fp={key,bars:new Map(),syn:new Map(),step:nice(avg/9),t0:null,buf:[],ready:0,maxA:0};
 F.ws=new WebSocket(`wss://${fut?'fstream.binance.com':'stream.binance.com:9443'}/ws/${c.name.toLowerCase()}@aggTrade`);
 F.ws.onmessage=e=>{const d=JSON.parse(e.data);if(!d||!d.p)return;if(!F.ready){F.buf.push(d);return}if(d.a<=F.maxA)return;F.maxA=d.a;fpAdd(c,F,d.T,+d.p,+d.q,d.m)};
 fpSynLoad(c,F,Math.min(c.tfm*70,9000)).catch(e=>{F.err=String(e.message||e)});F.sy=setInterval(()=>fpSynLoad(c,F,c.tfm*2+3).catch(()=>{}),20000);
 try{let j=await jget(`${base}/aggTrades?symbol=${c.name}&limit=1000`);
  for(let p=0;p<15&&!F.dead&&Array.isArray(j)&&j.length;p++){if(!F.ready){F.maxA=j[j.length-1].a}j.forEach(t=>fpAdd(c,F,t.T,+t.p,+t.q,t.m));F.t0=Math.ceil(j[0].T/1000/(c.tfm*60))*(c.tfm*60);
   if(!F.ready){F.ready=1;F.buf.forEach(d=>{if(d.a>F.maxA){F.maxA=d.a;fpAdd(c,F,d.T,+d.p,+d.q,d.m)}});F.buf=[]}
   const from=j[0].a-1000;if(from<0)break;j=await jget(`${base}/aggTrades?symbol=${c.name}&fromId=${from}&limit=1000`)}}catch(e){F.err=String(e.message||e)}
 if(!F.ready){F.ready=1;F.buf=[]}}
function fpDraw(c){const cv=c.host.querySelector('.cv');if(!cv)return;let k=c._fk;
 if(!k||!k.isConnected){k=c._fk=D.createElement('canvas');k.className='tvfp';cv.style.position='relative';cv.appendChild(k)}
 const dpr=devicePixelRatio||1,w=cv.clientWidth,h=cv.clientHeight;if(k.width!==w*dpr||k.height!==h*dpr){k.width=w*dpr;k.height=h*dpr;k.style.width=w+'px';k.style.height=h+'px'}
 const g=k.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);
 if(c.style!=='footprint'){if(c._fp)fpStop(c);return}
 fpStart(c);const F=c._fp;if(!F)return;const ts=c.c.timeScale(),a=c.view(),vr=ts.getVisibleLogicalRange();if(!vr||!a.length)return;
 let pw=56,th=26;try{pw=c.c.priceScale('right').width()||56;th=ts.height()||26}catch(e){}
 const sp=ts.options().barSpacing,bw=Math.max(2,sp*.92),H=h-th,RH=15,TH=RH*4,ty=H-TH,i0=Math.max(0,Math.floor(vr.from)),i1=Math.min(a.length-1,Math.ceil(vr.to));
 g.fillStyle='rgba(19,23,34,.94)';g.fillRect(0,ty,w-pw,TH);g.textBaseline='middle';
 const labs=['Delta','Volume','Buy','Sell'];g.font='10px system-ui';
 for(let i=i0;i<=i1;i++){const x=ts.logicalToCoordinate(i);if(x==null||x<-bw||x>w-pw+bw)continue;const B=fpBar(F,a[i].time);if(!B)continue;
  let mx=0;B.lv.forEach(v=>{mx=Math.max(mx,v[0]+v[1])});
  B.lv.forEach((v,kk)=>{const y0=c.s.priceToCoordinate((kk+1)*F.step),y1=c.s.priceToCoordinate(kk*F.step);if(y0==null||y1==null||y1<0||y0>ty)return;const hh=y1-y0,t=v[0]+v[1];
   g.fillStyle=`rgba(${v[1]>=v[0]?'38,166,154':'239,83,80'},${.15+.55*t/mx})`;g.fillRect(x-bw/2,y0,bw,Math.max(1,hh-1));
   if(t===mx){g.strokeStyle='#e6b422';g.lineWidth=1;g.strokeRect(x-bw/2,y0,bw,Math.max(1,hh-1))}
   if(hh>=10&&sp>=44){g.font=Math.min(11,hh-2)+'px system-ui';g.fillStyle='#fff';g.textAlign='right';g.fillText(fq(v[0]),x-2,y0+hh/2);g.textAlign='left';g.fillText(fq(v[1]),x+2,y0+hh/2)}});
  const d=B.b-B.s,vals=[d,B.b+B.s,B.b,B.s];
  vals.forEach((v,r)=>{const yy=ty+r*RH;if(r===0){g.fillStyle=d>=0?'rgba(38,166,154,.55)':'rgba(239,83,80,.55)';g.fillRect(x-bw/2,yy+1,bw,RH-1)}
   if(sp>=30){g.fillStyle='#e5e5e5';g.textAlign='center';g.font='10px system-ui';g.fillText(fq(v),x,yy+RH/2+1)}})}
 g.textAlign='left';g.fillStyle='#8b91a3';g.font='10px system-ui';labs.forEach((l,r)=>{g.fillStyle='rgba(19,23,34,.9)';g.fillRect(0,ty+r*RH,44,RH);g.fillStyle='#9aa0b0';g.fillText(l,4,ty+r*RH+RH/2+1)});
 g.strokeStyle='#2a2e39';for(let r=0;r<=4;r++){g.beginPath();g.moveTo(0,ty+r*RH);g.lineTo(w-pw,ty+r*RH);g.stroke()}
 if(F.none||(F.err&&!F.syn.size)||(!F.bars.size&&!F.syn.size)){g.fillStyle='#e6b422';g.textAlign='left';g.font='11px system-ui';g.fillText(F.none?'Footprint: Binance symbols only (tick data needed)':F.err?'Tick data error: '+F.err:'Loading tick data…',52,ty-10)}else if(F.syn.size){g.fillStyle='#8b91a3';g.textAlign='left';g.font='10px system-ui';g.fillText('Older bars: estimated from 1m klines · recent bars: real trades',52,ty-10)}}

/* header: full coin name (ZECUSDT.P for Binance perps) + timeframe, width measured so nothing is cut */
const mctx=D.createElement('canvas').getContext('2d'),tw=(s,f)=>{mctx.font=f;return Math.ceil(mctx.measureText(s).width)};
setInterval(()=>charts.forEach(c=>{const i=c.host&&c.host.querySelector('.hd input.sy');if(!i||D.activeElement===i)return;
 const v=c.src==='BF'?c.name+'.P':String(i.value).replace(/^[A-Za-z0-9]+:/,'');if(i.value!==v)i.value=v;i.style.width=(tw(v,'600 11px "Segoe UI",system-ui')+16)+'px';
 const f=c.host.querySelector('.hd input.tf');if(f)f.style.width=(tw(f.value,'400 11px "Segoe UI",system-ui')+14)+'px'}),400);
const wrap=(n,fn)=>{const o=Ch.prototype[n];Ch.prototype[n]=function(...a){const r=o.apply(this,a);try{fn.call(this)}catch(e){console.warn('tv2',e)}return r}};
wrap('render',function(){hookClick(this);if(this.style==='footprint')fpDraw(this)});
wrap('setStyle',function(){if(this.style!=='footprint')fpDraw(this);else if(window.tvSettings)this.render(0)});
wrap('load',function(){if(this._fp)fpStop(this)});
wrap('destroy',function(){fpStop(this)});
setInterval(()=>charts.forEach(c=>{try{hookClick(c);if(c.style==='footprint'||c._fk)fpDraw(c)}catch(e){}}),120);
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
