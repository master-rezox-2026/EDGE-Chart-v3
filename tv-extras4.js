/* TV Extras 4 - load AFTER tv-extras2.js.  Binance USDT/USDC perpetual Screener (filters + sortable columns). */
(()=>{
if(typeof charts==='undefined'||typeof jget==='undefined')return;
const D=document,$=s=>D.querySelector(s),I=Infinity;
const CHG=[['Above 30%',30,I],['Above 20%',20,I],['Above 10%',10,I],['Above 5%',5,I],['0% to 5%',0,5],['Above 0%',0,I],['Below 0%',-I,0],['-5% to 0%',-5,0],['Below -5%',-I,-5],['Below -10%',-I,-10],['Below -20%',-I,-20],['Below -30%',-I,-30]];
const VOL=[['1B USD and above',1e9,I],['100M USD and above',1e8,I],['10M USD and above',1e7,I],['1M USD and above',1e6,I],['1M USD and below',0,1e6]];
window.TVF={CHG,VOL};
const css=D.createElement('style');css.textContent=`
#tvsc{position:fixed;z-index:640;top:0;right:0;bottom:0;width:min(980px,62vw);background:#0f0f0f;border-left:1px solid #2a2a2a;color:#d1d4dc;font:13px system-ui;display:none;flex-direction:column;box-shadow:-10px 0 30px #000a}
#tvsc.full{width:100vw}#tvsc .hd2{display:flex;align-items:center;gap:10px;padding:14px 20px 4px;font-size:15px}#tvsc .hd2 .sp{flex:1}#tvsc .hd2 button{background:none;border:0;color:#9aa0b0;font-size:18px;cursor:pointer;padding:2px 8px}
#tvsc h2{margin:0;padding:4px 20px 10px;font-size:21px;font-weight:700;color:#fff}
#tvsc .fb{display:flex;flex-wrap:wrap;gap:8px;padding:0 20px 10px;align-items:center;position:relative}
#tvsc .ch{background:#fff;color:#111;border-radius:8px;padding:8px 14px;font-weight:600}
#tvsc .fbt{background:transparent;border:1px solid #363a45;color:#9aa0b0;border-radius:8px;padding:8px 14px;cursor:pointer;font:13px system-ui}.fbt.on{border-color:#2962ff;color:#fff}
#tvsc input.q{background:#1e222d;border:1px solid #363a45;border-radius:8px;color:#d1d4dc;padding:8px 12px;width:140px}
#tvsc .dd{position:absolute;z-index:5;background:#141414;border:1px solid #2a2a2a;border-radius:8px;padding:10px;min-width:240px;box-shadow:0 10px 30px #000;max-height:60vh;overflow:auto}
#tvsc .dd .o{padding:8px 10px;border-radius:6px;cursor:pointer}.dd .o:hover{background:#262b36}.dd .o.on{background:#1e3a8a}
#tvsc .dd input{width:80px;background:#1e222d;border:1px solid #363a45;border-radius:6px;color:#d1d4dc;padding:6px}.dd .m{display:flex;gap:6px;align-items:center;padding:8px 4px 2px;color:#8b91a3}
#tvsc .tb2{flex:1;overflow:auto;border-top:1px solid #2a2a2a}
#tvsc .gr{display:grid;grid-template-columns:1.7fr .9fr 1.1fr 1fr 1.1fr 1.1fr 1.2fr;gap:6px;align-items:center;padding:0 20px;min-height:40px;border-bottom:1px solid #1c1c1c}
#tvsc .gr.h{position:sticky;top:0;background:#0f0f0f;z-index:2;color:#9aa0b0;cursor:default;font-size:12px}.gr.h span{cursor:pointer;user-select:none}.gr.h span:hover{color:#fff}
#tvsc .gr:not(.h){cursor:pointer}#tvsc .gr:not(.h):hover{background:#1a1d27}
#tvsc .tk{background:#222;border-radius:6px;padding:5px 9px;font-weight:700;color:#fff;display:inline-block}
#tvsc .r{text-align:right}.sb{color:#26a69a}.ss{color:#ef5350}.sn{color:#9aa0b0}#tvsc .ft2{padding:6px 20px;color:#6b7080;font-size:11px;border-top:1px solid #2a2a2a}`;
D.head.appendChild(css);

const fm=v=>v>=1e9?(v/1e9).toFixed(2)+' B':v>=1e6?(v/1e6).toFixed(2)+' M':v>=1e3?(v/1e3).toFixed(1)+' K':v.toFixed(0);
const fp=p=>p>=1000?p.toFixed(2):p>=1?p.toFixed(4):p>=.01?p.toFixed(5):p.toPrecision(4);
const pct=v=>v==null?'—':(v>=0?'+':'')+v.toFixed(2)+'%';
let rows=[],sk='v',sd=-1,F={q:'',base:'',chg:null,vol:null,vc:null,rt:''},busy=0,loaded=0,total=0,el,tmr;

async function loadTicker(){const[t,i]=await Promise.all([jget('https://fapi.binance.com/fapi/v1/ticker/24hr'),jget('https://fapi.binance.com/fapi/v1/exchangeInfo')]);
 const info={};(i.symbols||[]).forEach(x=>{if(x.contractType==='PERPETUAL'&&x.status==='TRADING')info[x.symbol]=x});
 const old=new Map(rows.map(r=>[r.sym,r]));
 rows=t.filter(x=>info[x.symbol]).map(x=>{const o=old.get(x.symbol)||{},n=info[x.symbol];return{sym:x.symbol,n:x.symbol+'.P',base:n.baseAsset,q:n.quoteAsset,p:+x.lastPrice,c:+x.priceChangePercent,v:+x.quoteVolume,vc:o.vc!=null?o.vc:null,rs:o.rs!=null?o.rs:null}})}
const ema=(a,n)=>{const k=2/(n+1);let e=a[0];for(let i=1;i<a.length;i++)e=a[i]*k+e*(1-k);return e};
const sma=(a,n)=>a.slice(-n).reduce((s,x)=>s+x,0)/n;
function rate(c){const p=c[c.length-1];let sc=0;sc+=p>sma(c,20)?1:-1;sc+=p>sma(c,50)?1:-1;sc+=sma(c,20)>sma(c,50)?1:-1;sc+=ema(c,12)-ema(c,26)>0?1:-1;
 let g=0,l=0;for(let i=c.length-14;i<c.length;i++){const d=c[i]-c[i-1];d>0?g+=d:l-=d}const rsi=l?100-100/(1+g/l):100;sc+=rsi>55?1:rsi<45?-1:0;sc+=p>c[c.length-11]?1:-1;return sc/6}
async function enrich(limit){if(busy)return;busy=1;const q=rows.filter(r=>r.vc==null).sort((a,b)=>b.v-a.v).slice(0,limit);total=loaded+q.length;let i=0;
 const w=async()=>{while(i<q.length&&el&&el.style.display!=='none'){const r=q[i++];try{const k=await jget(`https://fapi.binance.com/fapi/v1/klines?symbol=${r.sym}&interval=1h&limit=100`);
  if(Array.isArray(k)&&k.length>=96){const qv=k.map(x=>+x[7]),a=qv.slice(-24).reduce((s,x)=>s+x,0),b=qv.slice(-48,-24).reduce((s,x)=>s+x,0);r.vc=b?(a-b)/b*100:null;r.rs=rate(k.map(x=>+x[4]))}}catch(e){}loaded++;if(!(loaded%6))draw()}};
 await Promise.all([w(),w(),w(),w(),w(),w()]);busy=0;draw()}

const RT=s=>s==null?'—':s>.5?'Strong buy':s>.1?'Buy':s<-.5?'Strong sell':s<-.1?'Sell':'Neutral';
const RC=s=>s==null?'sn':s>.1?'sb':s<-.1?'ss':'sn';
function pass(r){const f=(v,x)=>!x||(v!=null&&v>=x[0]&&v<x[1]);return(!F.q||r.q===F.q)&&(!F.base||r.base.includes(F.base.toUpperCase()))&&f(r.c,F.chg)&&f(r.v,F.vol)&&f(r.vc,F.vc)&&(!F.rt||RT(r.rs)===F.rt)}
function draw(){if(!el)return;const L=rows.filter(pass).sort((a,b)=>{const x=a[sk==='rt'?'rs':sk],y=b[sk==='rt'?'rs':sk];if(x==null&&y==null)return 0;if(x==null)return 1;if(y==null)return -1;return sd*((x>y)-(x<y))});
 const ar=k=>sk===k?(sd<0?' ↓':' ↑'):'';
 el.querySelector('.tb2').innerHTML=`<div class="gr h"><span data-k=n>Symbol <small>${L.length}</small>${ar('n')}</span><span>Exchange</span><span class=r data-k=p>Price${ar('p')}</span><span class=r data-k=c>Chg % 24h${ar('c')}</span><span class=r data-k=v>Vol in USD 24h${ar('v')}</span><span class=r data-k=vc>Vol chg % 24h${ar('vc')}</span><span data-k=rt>Tech rating${ar('rt')}</span></div>`+
  L.slice(0,600).map(r=>`<div class=gr data-s="${r.sym}"><span><span class=tk>${r.n}</span></span><span>Binance</span><span class=r>${fp(r.p)} <small style="color:#6b7080">${r.q}</small></span><span class="r ${r.c>=0?'sb':'ss'}">${pct(r.c)}</span><span class=r>${fm(r.v)}</span><span class="r ${r.vc==null?'sn':r.vc>=0?'sb':'ss'}">${pct(r.vc)}</span><span class="${RC(r.rs)}">${RT(r.rs)}</span></div>`).join('');
 el.querySelector('.ft2').textContent=`${rows.length} Binance perpetual contracts · Vol chg % and Tech rating are loaded for the top ${loaded}/${total||'…'} by volume (simple rating from 1h candles: MAs, MACD, RSI, momentum — not TradingView's own)`;
 const lb={chg:['Chg %',CHG],vol:['Vol in USD',VOL],vc:['Vol chg %',CHG]};for(const k in lb){const b=el.querySelector(`[data-f=${k}]`);b.classList.toggle('on',!!F[k]);const p=lb[k][1].find(x=>F[k]&&x[1]===F[k][0]&&x[2]===F[k][1]);b.textContent=F[k]?lb[k][0]+': '+(p?p[0]:'custom'):lb[k][0]+' ▾'}
 el.querySelector('[data-f=q]').textContent=F.q?'Quote: '+F.q:'Quote currency ▾';el.querySelector('[data-f=rt]').textContent=F.rt?'Rating: '+F.rt:'Tech rating ▾'}

function dd(btn,key){const old=el.querySelector('.dd');if(old){const same=old.dataset.k===key;old.remove();if(same)return}
 const d=D.createElement('div');d.className='dd';d.dataset.k=key;
 if(key==='q'||key==='rt'){const O=key==='q'?['','USDT','USDC']:['','Strong buy','Buy','Neutral','Sell','Strong sell'];d.innerHTML=O.map(o=>`<div class="o${F[key]===o?' on':''}" data-v="${o}">${o||'All'}</div>`).join('');d.onclick=e=>{const o=e.target.closest('[data-v]');if(o){F[key]=o.dataset.v;d.remove();draw()}}}
 else{const P=key==='vol'?VOL:CHG,u=key==='vol'?'M USD':'%',mul=key==='vol'?1e6:1;
  d.innerHTML=P.map((p,i)=>`<div class="o${F[key]&&F[key][0]===p[1]&&F[key][1]===p[2]?' on':''}" data-i=${i}>${p[0]}</div>`).join('')+`<div class=m>Min <input type=number data-m=min> Max <input type=number data-m=max> ${u}</div><div class=m><span class=o data-a=ok>Apply</span><span class=o data-a=clr>Clear</span></div>`;
  d.onclick=e=>{const o=e.target.closest('[data-i]'),a=e.target.dataset.a;if(o){const p=P[+o.dataset.i];F[key]=[p[1],p[2]];d.remove();draw()}else if(a==='clr'){F[key]=null;d.remove();draw()}else if(a==='ok'){const mn=d.querySelector('[data-m=min]').value,mx=d.querySelector('[data-m=max]').value;F[key]=(mn===''&&mx==='')?null:[mn===''?-I:+mn*mul,mx===''?I:+mx*mul];d.remove();draw()}}}
 const r=btn.getBoundingClientRect(),b=el.getBoundingClientRect();d.style.left=Math.max(8,r.left-b.left)+'px';d.style.top=(r.bottom-b.top+4)+'px';el.appendChild(d)}

function build(){el=D.createElement('div');el.id='tvsc';
 el.innerHTML=`<div class=hd2><b>CEX Screener</b><span class=sp></span><button data-a=ref title="Refresh">⟳</button><button data-a=full title="Expand">⤢</button><button data-a=x title="Close">✕</button></div><h2>Crypto</h2>
 <div class=fb><span class=ch>Binance</span><span class=ch>Perpetual</span><button class=fbt data-f=q>Quote currency ▾</button><input class=q placeholder="Base currency"><button class=fbt data-f=chg>Chg % ▾</button><button class=fbt data-f=vol>Vol in USD ▾</button><button class=fbt data-f=vc>Vol chg % ▾</button><button class=fbt data-f=rt>Tech rating ▾</button><button class=fbt data-a=loadall title="Load Vol chg % and rating for every contract">Load all</button></div>
 <div class=tb2></div><div class=ft2></div>`;D.body.appendChild(el);
 el.onclick=e=>{const t=e.target;if(!t.closest('.dd')&&!t.dataset.f){const o=el.querySelector('.dd');o&&o.remove()}
  const a=t.dataset.a,f=t.dataset.f,k=t.closest('[data-k]'),r=t.closest('[data-s]');
  if(a==='x')close();else if(a==='full')el.classList.toggle('full');else if(a==='ref')refresh();else if(a==='loadall')enrich(9999);
  else if(f)dd(t,f);else if(k&&k.closest('.h')){const key=k.dataset.k;if(sk===key)sd=-sd;else{sk=key;sd=key==='n'?1:-1}draw()}
  else if(r&&typeof act!=='undefined'&&act)act.setSym('BF:'+r.dataset.s)};
 el.querySelector('.q').oninput=e=>{F.base=e.target.value.trim();draw()}}
async function refresh(){try{await loadTicker();draw()}catch(e){el.querySelector('.ft2').textContent='Load failed: '+(e.message||e)}}
function close(){el.style.display='none';clearInterval(tmr)}
window.tvScreener=async function(){if(!el)build();el.style.display='flex';draw();await refresh();enrich(150);clearInterval(tmr);tmr=setInterval(refresh,20000)};

const bar=$('#eic');if(bar){const b=D.createElement('button');b.className='ib';b.title='Screener';b.textContent='📊';b.onclick=e=>{e.stopPropagation();tvScreener()};bar.prepend(b)}
})();
