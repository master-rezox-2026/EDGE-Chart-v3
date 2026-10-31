/* EDGE Charts UI add-on - makes MultiChart Pro look and behave like the EDGE Charts screenshot.
   Load it LAST (after pro-addons.js). It only re-skins / re-arranges the existing app and adds:
   top bar (search + layout 1-8 + TF buttons + Indicators + Sync toggles + clock), left drawing toolbar,
   overlay OHLC header with day change %, volume bars, countdown on the price axis,
   crosshair sync, and right panel tabs: Favorites / Crypto perps / Crypto spot / MT5 / Futures / News / Alerts. */
(()=>{
if(typeof S==='undefined'||typeof charts==='undefined'||typeof Ch==='undefined')return;
const D=document,$=s=>D.querySelector(s),$$=s=>[...D.querySelectorAll(s)];
const E=S.edge=Object.assign({vol:1,xh:1,dr:1},S.edge||{});
const UP='#26a69a',DN='#ef5350',GOLD='#e6b422';
D.title='EDGE Charts';

/* toast() is private to multichart-addons.js, but the OrderFlow Scalper calls it as a global */
if(typeof window.toast!=='function')window.toast=m=>{const d=D.createElement('div');d.textContent='🔔 '+m;
 d.style.cssText='position:fixed;right:14px;bottom:14px;z-index:300;background:#1e222d;color:#e6e8ee;border:1px solid #2a2e39;border-radius:6px;padding:8px 12px;font:12px system-ui;max-width:360px';
 D.body.appendChild(d);setTimeout(()=>d.remove(),6000)};

/* no symbol watermark in the reference screenshot (one-time default change) */
if(!E.init){E.init=1;S.set=S.set||{};S.set.wm=0;save()}

/* ---------- month timeframes: M, 3M (approximated as 30-day buckets) ---------- */
const pt0=parseTf;
parseTf=function(s){const m=String(s).trim().match(/^(\d*)M$/);return m?(+m[1]||1)*43200:pt0(s)};

/* ---------- Binance USDT-M perpetuals as venue "BF" (shown as BTCUSDT.P) ---------- */
XTF.BF=BN;
const ex0=exCandles;
exCandles=async function(src,s,n,c){
 if(src!=='BF')return ex0.apply(this,arguments);
 const want=c||1000,lim=Math.min(want,1000),pages=want>2?3:1;let out=[],end='';
 for(let p=0;p<pages;p++){
  const j=await jget(`https://fapi.binance.com/fapi/v1/klines?symbol=${s}&interval=${BN[n]}&limit=${lim}${end}`);
  if(!Array.isArray(j)){if(!out.length)throw Error('Binance futures: '+(j&&j.msg||'no data for '+s));break}
  if(!j.length)break;
  out=j.map(k=>({time:k[0]/1000,open:+k[1],high:+k[2],low:+k[3],close:+k[4],volume:+k[5]})).concat(out);
  end='&endTime='+(j[0][0]-1);if(j.length<lim)break}
 return out};
const live0=Ch.prototype.live;
Ch.prototype.live=function(){
 if(this.src==='BF'&&this.ok){
  const w=this.ws=new WebSocket(`wss://fstream.binance.com/ws/${this.name.toLowerCase()}@kline_${BN[this.nat]}`);
  w.onmessage=e=>{const k=JSON.parse(e.data).k;if(k)this.tick({time:k.t/1000,open:+k.o,high:+k.h,low:+k.l,close:+k.c,volume:+k.v})};return}
 return live0.call(this)};

/* ================= CSS ================= */
const css=D.createElement('style');css.textContent=`
#etop{display:flex;align-items:center;gap:3px;height:38px;padding:0 8px;background:#131722;border-bottom:1px solid #232836;overflow-x:auto;white-space:nowrap;scrollbar-width:none;flex:none}
#etop::-webkit-scrollbar{display:none}#etop>*{flex:none}
#etop .brand{color:#d1d4dc;font-weight:600;margin-right:6px;font-size:13px}#etop .brand b{color:${GOLD}}
#etop button,#etop select{background:transparent;border:1px solid transparent;color:#c9ccd6;padding:0 7px;border-radius:3px;height:26px}
#etop button:hover,#etop select:hover{background:#1e2433;border-color:transparent}
#etop button.on{background:${GOLD};color:#111;font-weight:600}
#etop select{max-width:150px;border-color:#232836}
#etop .sbox{display:flex;align-items:center;gap:6px;background:#1b2030;border:1px solid #232836;border-radius:4px;height:26px;padding:0 6px;width:200px}
#etop .sbox input{background:transparent;border:0;outline:0;flex:1;min-width:0;font-weight:600;padding:0;height:22px}
#etop .sbox .bd{font-size:9px;color:#4c8dff;background:rgba(76,141,255,.15);border-radius:2px;padding:1px 4px}
#etop .sep{width:1px;height:18px;background:#232836;margin:0 5px}
#etop .lbl{color:#7b8194;margin:0 3px}
#etop .nb{width:22px;padding:0;text-align:center}
#etop #tfb{display:flex;gap:1px}#etop #tfb button{padding:0 6px}
#etop .ib{width:28px;padding:0;text-align:center;font-size:14px}
#etop .st{color:#9aa0b0;margin:0 6px}#etop .st i{display:inline-block;width:7px;height:7px;border-radius:50%;background:${DN};margin-right:5px}#etop .st i.ok{background:${UP}}
#etop .clk{color:#c9ccd6;font-variant-numeric:tabular-nums;margin:0 8px}
#etop #rpc{display:inline-flex;gap:2px}#etop #rpc[hidden]{display:none}
#emenu{position:fixed;z-index:150;background:#1b2030;border:1px solid #2a2e39;border-radius:5px;padding:4px;min-width:200px;display:none;box-shadow:0 6px 18px #0008}
#emenu div{padding:6px 10px;border-radius:3px;cursor:pointer;display:flex;justify-content:space-between;gap:14px}#emenu div:hover{background:#262c3d}#emenu .ck{color:${GOLD}}
body:not(.more) #top{display:none}
#tabs{height:22px;padding:0 8px;background:#131722;align-items:flex-end}.tab{padding:2px 10px;font-size:11px}
#ltb{width:34px;flex:none;background:#131722;border-right:1px solid #232836;display:flex;flex-direction:column;align-items:center;padding:4px 0;gap:1px;overflow-y:auto;scrollbar-width:none}
#ltb button{width:28px;height:28px;padding:0;border:0;background:transparent;color:#9aa0b0;font-size:15px;border-radius:3px;line-height:1}
#ltb button:hover{background:#1e2433;color:#fff}#ltb button.on{background:${GOLD};color:#111}#ltb hr{width:20px;border:0;border-top:1px solid #232836;margin:4px 0}
.cell{position:relative}.cell.act{outline-color:#4a5268}
.hd{position:absolute;top:3px;left:8px;right:76px;height:auto;padding:0;border:0;background:transparent;z-index:6;pointer-events:none;flex-wrap:wrap;gap:6px}
.hd>*{pointer-events:auto}
.hd input.sy,.hd input.tf{background:transparent;border:1px solid transparent;padding:0 2px;font:600 11px "Segoe UI",system-ui;color:#d1d4dc;width:auto;min-width:3ch;border-radius:2px}
.hd input.tf{color:#7b8194;font-weight:400}.hd input.sy:hover,.hd input.tf:hover,.hd input:focus{border-color:#2a2e39;background:#131722}
.hd .px,.hd .cd{display:none}
.hd .ohlc{max-width:none;overflow:visible;white-space:nowrap;font-size:11px;order:1;color:#7b8194}
.hd .ohlc span{margin-right:5px}.hd .ohlc .k{color:#7b8194;margin-right:1px}.hd .ohlc .eye{cursor:pointer;opacity:.7}
.hd .ohlc .demo{color:${DN};font-weight:700}
.hd .lk,.hd label,.hd .cl{order:2;opacity:0;transition:opacity .15s;background:transparent;border:0;padding:0 3px}
.cell:hover .hd .lk,.cell:hover .hd label,.cell:hover .hd .cl{opacity:1}
.ecd{position:absolute;right:0;z-index:4;font:10px system-ui;color:#fff;text-align:center;padding:1px 0;pointer-events:none;border-radius:2px;display:none;font-variant-numeric:tabular-nums}
#side{width:300px}
#side>.sh{gap:0;padding:0 6px;border-bottom:1px solid #232836;overflow-x:auto;scrollbar-width:none;flex:none}#side>.sh::-webkit-scrollbar{display:none}
#side>.sh button{flex:none;background:transparent;border:0;border-bottom:2px solid transparent;border-radius:0;color:#7b8194;padding:8px 8px;font-size:11px}
#side>.sh button:hover{color:#d1d4dc}#side>.sh button.on{color:${GOLD};border-bottom-color:${GOLD};background:transparent}
.etab{flex:1;min-height:0;display:flex;flex-direction:column}.etab[hidden]{display:none}
.etab>.sh{padding:6px;display:flex;gap:4px}.etab .eq{flex:1;min-width:0}
.ehd,.etab .it{display:grid;grid-template-columns:16px 1fr 84px 62px;gap:4px;align-items:center;padding:4px 8px}
.ehd{color:#7b8194;font-size:10px;border-bottom:1px solid #232836}.ehd span:first-child{grid-column:1/3}.ehd span:nth-child(n+2){text-align:right}
.erows{flex:1;overflow:auto;min-height:0}
.etab .it{border:0;font-variant-numeric:tabular-nums}.etab .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}
.etab .lp,.etab .cg{text-align:right}.star{color:#3a4050;cursor:pointer}.star.on{color:${GOLD}}
.emsg{padding:8px 10px;color:#7b8194;font-size:11px}
body.nosd #ltb{display:flex}
@media(max-width:820px){#ltb{display:none}body.notb #etop{display:none}#etop{height:42px}}
`;D.head.appendChild(css);

/* ================= top bar ================= */
const bar=D.createElement('div');bar.id='etop';
bar.innerHTML=`<div class=brand><b>EDGE</b> Charts</div>
<div class=sbox><span style="color:#7b8194">⌕</span><input id=esym spellcheck=false autocomplete=off placeholder="Symbol" title="Type a symbol and press Enter. Examples: XAUUSD, MT5:EURUSD, BTCUSDT, BTCUSDT.P, FX:GC=F"><span class=bd id=ebd>MT5</span></div>
<span class=sep></span><span id=elay></span><span class=sep></span>
<span id=etf></span><button id=ecust class=ib title="Custom timeframe (e.g. 90m, 2h, 2M)" style="width:20px;font-size:10px">▾</button>
<span class=sep></span><button id=eind title="Indicators">ƒx Indicators</button>
<span id=esty></span><span id=erep></span>
<span class=sep></span><span class=lbl>Sync</span>
<button class=tg id=esy title="Sync symbol across charts">Symbol</button>
<button class=tg id=exh title="Sync crosshair across charts">Crosshair</button>
<button class=tg id=edr title="Show / hide drawings on all charts">Drawings</button>
<span style="margin-left:auto"></span>
<span class=st id=est title="MT5 bridge"><i></i><span>MT5</span></span><span class=clk id=eclk></span>
<span id=eic></span>
<div id=emenu></div>`;
D.body.insertBefore(bar,$('#top'));
const esym=$('#esym'),ebd=$('#ebd');

/* layout buttons 1..8 (drive the existing #lay select) */
$('#elay').innerHTML=[1,2,3,4,5,6,7,8].map(n=>`<button class=nb>${n}</button>`).join('');
$('#elay').onclick=e=>{const n=+e.target.textContent;if(!n||e.target.tagName!=='BUTTON')return;const s=$('#lay');s.value=n;s.dispatchEvent(new Event('change',{bubbles:true}))};

/* timeframe buttons: reuse #tfb so its click handler keeps working */
const tfb=$('#tfb');tfb.innerHTML=['1m','5m','15m','30m','45m','1h','4h','7h','D','W','M','3M'].map(t=>`<button>${t}</button>`).join('');
$('#etf').appendChild(tfb);
$('#ecust').onclick=()=>{const v=prompt('Timeframe (e.g. 3m, 90m, 2h, D, 2M)',act.cfg.tf);if(v)act.setTf(v.trim())};

/* style select, replay controls: move the live nodes so existing handlers stay attached */
$('#esty').appendChild($('#sty'));$('#erep').append($('#rp'),$('#rpc'));
$('#rp').textContent='⏪ Replay';

/* Indicators menu: proxies to the original toggle buttons */
const topBtn=re=>$$('#top>button').find(b=>re.test(b.textContent));
const IND=[['RSI',()=>$('#top button[data-i=rsi]'),()=>S.ind.rsi],['Awesome Oscillator',()=>$('#top button[data-i=ao]'),()=>S.ind.ao],
 ['Volume order blocks',()=>$('#top button[data-i=ob]'),()=>S.ind.ob],['OrderFlow Scalper',()=>topBtn(/^OF Scalp/),()=>S.of&&S.of.on],
 ['Volume bars',null,()=>E.vol]];
const menu=$('#emenu');
function drawMenu(){menu.innerHTML=IND.map(([n,,on],i)=>`<div data-i=${i}><span>${n}</span><span class=ck>${on()?'✓':''}</span></div>`).join('')}
$('#eind').onclick=e=>{e.stopPropagation();drawMenu();const r=e.currentTarget.getBoundingClientRect();menu.style.left=r.left+'px';menu.style.top=r.bottom+4+'px';menu.style.display=menu.style.display==='block'?'none':'block'};
menu.onclick=e=>{const d=e.target.closest('[data-i]');if(!d)return;const it=IND[+d.dataset.i];
 if(it[1]){const b=it[1]();if(b)b.click()}else{E.vol=+!E.vol;save();charts.forEach(c=>vol(c,1))}drawMenu();refreshTop()};
D.addEventListener('click',()=>{menu.style.display='none'});

/* sync toggles */
$('#esy').onclick=()=>{$('#sync').click();refreshTop()};
$('#exh').onclick=()=>{E.xh=+!E.xh;save();if(!E.xh)charts.forEach(c=>{try{c.c.clearCrosshairPosition&&c.c.clearCrosshairPosition()}catch(e){}});refreshTop()};
$('#edr').onclick=()=>{E.dr=+!E.dr;save();applyDr();refreshTop()};
function applyDr(){charts.forEach(c=>{if(c.ov)c.ov.style.visibility=E.dr?'visible':'hidden'})}

/* right-hand icon buttons (proxy to the original controls) */
const tool=k=>{const b=$(`#tools [data-t="${k}"]`);if(b)b.click()};
const showSide=()=>{if(D.body.classList.contains('nosd'))topBtn(/Panel/)&&topBtn(/Panel/).click()};
const IC=[['🔔','Alerts',()=>{showSide();$('#ta')&&$('#ta').click()}],['⏰','Price alert on active chart',()=>tool('pal')],['📷','Screenshot',()=>tool('scr')],
 ['⚙','Chart settings',()=>tool('set')],['💱','Forex panel',()=>{const b=topBtn(/Forex/);b&&b.click()}],['👤','Account / cloud sync',()=>{const b=topBtn(/Login|Logout|Account|Sign/);b&&b.click()}],
 ['▤','Show / hide watchlist panel',()=>{const b=topBtn(/Panel/);b&&b.click()}],['⋯','More controls (time zone, bridge URL, custom TF…)',()=>{D.body.classList.toggle('more');dispatchEvent(new Event('resize'))}]];
$('#eic').innerHTML=IC.map(([g,t],i)=>`<button class=ib data-i=${i} title="${t}">${g}</button>`).join('');
$('#eic').onclick=e=>{const b=e.target.closest('button');if(b)IC[+b.dataset.i][2]()};

/* ================= left drawing toolbar ================= */
const ltb=D.createElement('div');ltb.id='ltb';
const LT=[['cur','↖','Cursor'],['tl','╱','Trend line'],['hl','─','Horizontal line'],['rc','▭','Rectangle'],['fib','≣','Fib retracement'],['ch','⫽','Parallel channel'],['meas','↔','Measure'],['tx','T','Text'],['br','✎','Brush'],['pos','⇅','Long / short position'],'-',
 ['mag','∩','Magnet'],['undo','↶','Undo'],['redo','↷','Redo'],['clr','🗑','Remove drawings (this symbol)'],['eye','◉','Show / hide hidden drawings']];
ltb.innerHTML=LT.map(x=>x==='-'?'<hr>':`<button data-k=${x[0]} title="${x[2]}">${x[1]}</button>`).join('');
$('#main').insertBefore(ltb,$('#grid'));
ltb.onclick=e=>{const k=e.target.dataset.k;if(!k)return;
 if(k==='mag'){const m=$('#magnet');if(m){m.value=m.value==='0'?'1':'0';m.dispatchEvent(new Event('change',{bubbles:true}));syncTools()}}
 else if(k==='pos'){const m=$('#dmore');if(m){m.value='pos';m.dispatchEvent(new Event('change',{bubbles:true}))}}
 else tool(k)};
function syncTools(){$$('#ltb button').forEach(b=>{const k=b.dataset.k,src=$(`#tools [data-t="${k}"]`);
 b.classList.toggle('on',k==='mag'?($('#magnet')&&$('#magnet').value!=='0'):!!(src&&src.classList.contains('on')))})}
new MutationObserver(syncTools).observe($('#tools'),{subtree:true,attributes:true,attributeFilter:['class']});

/* ================= per-chart decorations ================= */
const fmtT=s=>{const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60,p=n=>String(n).padStart(2,'0');return h?`${h}:${p(m)}:${p(x)}`:`${p(m)}:${p(x)}`};
function dayChg(c){const r=c.raw;if(!r||!r.length)return null;const L=r[r.length-1],d0=Math.floor(L.time/86400)*86400;let i=r.length-1;
 while(i>=0&&r[i].time>=d0)i--;if(i===r.length-1)i=r.length-2;const base=i>=0?r[i].close:r[0].open;return base?(L.close/base-1)*100:null}
Ch.prototype.updateOhlc=function(p){
 const a=this.view();if(!a.length){this.ohlc.textContent='';return}
 const hov=p&&p.time?a.find(x=>x.time===p.time):null,b=hov||a[a.length-1],f=v=>v.toFixed(this.precision||2),col=b.close>=b.open?UP:DN;
 let pc=hov?(b.close/b.open-1)*100:dayChg(this);if(pc==null)pc=(b.close/b.open-1)*100;
 const k=(l,v)=>`<span class=k>${l}</span><span style="color:${col}">${f(v)}</span>`;
 this.ohlc.innerHTML=(this.ok?'':'<span class=demo>DEMO</span>')+(this._hv?'':`${k('O',b.open)}${k('H',b.high)}${k('L',b.low)}${k('C',b.close)}`)
  +`<span style="color:${pc>=0?UP:DN}">${pc>=0?'+':''}${pc.toFixed(2)}%</span><span class=eye title="Show / hide values">${this._hv?'🙈':'👁'}</span>`;
 this.ohlc.title=this.ok?'':'Demo data: '+(this.err||'source unreachable')};
const sizeIn=c=>{c.symI.style.width=Math.max(4,c.symI.value.length+1)+'ch';c.tfI.style.width=Math.max(2,c.tfI.value.length+1)+'ch'};

function place(c){const t=c.ecd;if(!t)return;
 const a=c.view();if(!a.length||c.rp!=null||S.set.showCountdown===0){t.style.display='none';return}
 const L=a[a.length-1],y=c.s.priceToCoordinate(L.close),cv=t.parentNode;
 if(y==null||y<0||y>cv.clientHeight-34){t.style.display='none';return}
 let w=56;try{w=c.c.priceScale('right').width()||56}catch(e){}
 const per=(parseTf(c.cfg.tf)||1)*60,left=Math.ceil(per-(Date.now()/1000)%per);
 t.style.cssText+=`;display:block;width:${w}px;top:${Math.round(y+11)}px;background:${L.close>=L.open?UP:DN}`;t.textContent=fmtT(left)}
function vol(c,full){if(!c.vs)return;
 const on=E.vol&&!S.ind.rsi&&!S.ind.ao&&c.style!=='footprint';c.vs.applyOptions({visible:!!on});if(!on)return;
 const a=c.view(),pt=x=>({time:x.time,value:x.volume||0,color:x.close>=x.open?'rgba(38,166,154,.42)':'rgba(239,83,80,.42)'});
 try{if(full)c.vs.setData(a.map(pt));else if(a.length)c.vs.update(pt(a[a.length-1]))}catch(e){}}

let xs=0;
function xsync(c,p){if(xs||!E.xh)return;xs=1;
 try{charts.forEach(o=>{if(o===c||!o.c.setCrosshairPosition)return;
  if(!p||!p.time){o.c.clearCrosshairPosition&&o.c.clearCrosshairPosition();return}
  const a=o.view();if(!a.length||a[0].time>p.time){o.c.clearCrosshairPosition&&o.c.clearCrosshairPosition();return}
  let lo=0,hi=a.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(a[m].time<=p.time)lo=m;else hi=m-1}
  const b=a[lo];try{o.c.setCrosshairPosition((b.high+b.low)/2,b.time,o.s)}catch(e){}})}
 finally{xs=0}}

function decorate(c){
 if(c._ed||!c.c||!c.host)return;c._ed=1;
 const cv=c.host.querySelector('.cv');cv.style.position='relative';
 const t=D.createElement('div');t.className='ecd';cv.appendChild(t);c.ecd=t;
 c.vs=c.c.addHistogramSeries({priceFormat:{type:'volume'},priceScaleId:'ev',lastValueVisible:false,priceLineVisible:false});
 c.vs.priceScale().applyOptions({scaleMargins:{top:.9,bottom:0}});
 c.ohlc.addEventListener('click',e=>{if(e.target.classList.contains('eye')){c._hv=!c._hv;c.updateOhlc()}});
 c.c.timeScale().subscribeVisibleLogicalRangeChange(()=>place(c));
 c.c.subscribeCrosshairMove(p=>xsync(c,p));
 c.symI.addEventListener('input',()=>sizeIn(c));c.tfI.addEventListener('input',()=>sizeIn(c));
 sizeIn(c);vol(c,1);place(c)}

const wrap=(n,fn)=>{const o=Ch.prototype[n];Ch.prototype[n]=function(...a){const r=o.apply(this,a);try{fn.call(this,...a)}catch(e){console.error('EDGE',e)}return r}};
wrap('render',function(){decorate(this);vol(this,1);place(this);sizeIn(this);this.updateOhlc();refreshTop()});
wrap('tick',function(){vol(this,0);place(this)});
wrap('step',function(){vol(this,1)});
wrap('ind',function(){vol(this,1)});
wrap('setSym',function(){refreshTop()});
wrap('setTf',function(){refreshTop()});
{const sa=setAct;setAct=function(c){sa(c);refreshTop()}}
{const b0=build;build=function(){b0();refreshTop();setTimeout(syncTools,0)}}

/* ================= top bar state ================= */
const VN={MT5:'MT5',BN:'SPOT',BINANCE:'SPOT',BF:'PERP',FX:'FX',MEXC:'MEXC',BYBIT:'BYBIT',OKX:'OKX',GATE:'GATE',KUCOIN:'KUCOIN'};
function refreshTop(){
 const c=act;if(!c||!c.cfg)return;const p=c.cfg.sym.split(':');
 const nm=(p.length>1?p.slice(1).join(':'):p[0])+(p[0]==='BF'?'.P':'');
 if(D.activeElement!==esym)esym.value=nm;
 ebd.textContent=p.length>1?(VN[p[0]]||p[0]):(isFx(p[0])?'FX':'SPOT');
 $$('#elay button').forEach(b=>b.classList.toggle('on',+b.textContent===T().lay));
 const tf=parseTf(c.cfg.tf);$$('#tfb button').forEach(b=>b.classList.toggle('on',parseTf(b.textContent)===tf));
 $('#esy').classList.toggle('on',!!S.sync);$('#exh').classList.toggle('on',!!E.xh);$('#edr').classList.toggle('on',!!E.dr);
 const m=charts.filter(x=>x.src==='MT5'),ok=m.filter(x=>x.ok).length,st=$('#est');
 st.querySelector('span').textContent=m.length?`MT5 ${ok}/${m.length}`:'MT5';st.querySelector('i').className=(m.length?ok>0:$('#st').classList.contains('ok'))?'ok':'';
 if(S.tabs&&S.tabs.length<2)D.body.classList.add('onetab')}
esym.onfocus=()=>esym.select();esym.setAttribute('list','dl');
esym.onkeydown=e=>{if(e.key==='Escape'){esym.blur();refreshTop();return}if(e.key!=='Enter')return;
 let v=esym.value.trim().toUpperCase();if(!v)return;
 if(/\.P$/.test(v))v='BF:'+v.slice(0,-2);
 else if(PO&&!v.includes(':')&&/USDT$/.test(v))v='BF:'+v;
 else if(!v.includes(':')&&!/(USDT|USDC|FDUSD|BTC|ETH|BNB)$/.test(v)&&$('#st').classList.contains('ok'))v='MT5:'+v;
 act.setSym(v);esym.blur()};
function clock(){let z;try{z=S.tz||undefined;const f=new Intl.DateTimeFormat('en-GB',{timeZone:z,hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit',timeZoneName:'shortOffset'}).formatToParts(new Date());
 const g=t=>(f.find(x=>x.type===t)||{}).value||'';$('#eclk').textContent=`${g('hour')}:${g('minute')}:${g('second')} ${g('timeZoneName').replace('GMT','UTC')||'UTC'}`.replace(/UTC$/,'UTC')}
 catch(e){$('#eclk').textContent=new Date().toLocaleTimeString()}}
setInterval(()=>{clock();applyDr();charts.forEach(place);refreshTop()},1000);clock();

/* ================= right panel tabs ================= */
const side=$('#side'),row=$('#side>.sh'),LEG={tw:'#wl',tn:'#news',tc:'#cr',ta:'#al'},TABS={};
const fmtP=p=>!(p>0)?'–':p>=1000?p.toFixed(2):p>=1?p.toFixed(4):p.toPrecision(5);
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
function selectE(key){
 Object.values(LEG).forEach(s=>{const e=$(s);if(e)e.hidden=true});
 $$('#side>.sh button').forEach(b=>b.classList.remove('on'));
 Object.entries(TABS).forEach(([k,t])=>{t.pn.hidden=k!==key;t.btn.classList.toggle('on',k===key)});
 const t=TABS[key];t.vis=1;reload(t)}
Object.keys(LEG).forEach(id=>{const b=$('#'+id);if(b)b.addEventListener('click',()=>{Object.values(TABS).forEach(t=>{t.pn.hidden=true;t.vis=0;t.btn.classList.remove('on')})})});
function addTab(key,label,o){
 const btn=D.createElement('button');btn.textContent=label;btn.id='e_'+key;
 const pn=D.createElement('div');pn.className='etab';pn.hidden=true;
 pn.innerHTML=`<div class=sh><input class=eq placeholder="Search"><select class=es><option value=v>Volume</option><option value=g>Gainers</option><option value=l>Losers</option><option value=n>A–Z</option></select></div><div class=ehd><span>Symbol</span><span>Last</span><span>Chg %</span></div><div class=erows></div><div class=emsg></div>`;
 side.appendChild(pn);
 const t=TABS[key]={key,btn,pn,o,data:[],t:0,vis:0,rows:pn.querySelector('.erows'),msg:pn.querySelector('.emsg'),q:pn.querySelector('.eq'),s:pn.querySelector('.es')};
 t.s.value=o.sort||'v';btn.onclick=()=>selectE(key);
 let dbn;t.q.oninput=()=>{paint(t);if(o.remoteSearch){clearTimeout(dbn);dbn=setTimeout(()=>reload(t,1),350)}};t.s.onchange=()=>paint(t);
 pn.onclick=e=>{const it=e.target.closest('.it');if(!it)return;const s=it.dataset.s;
  if(e.target.dataset.a==='star'){const L=cur(),i=L.findIndex(z=>z.s===s);if(i>=0)L.splice(i,1);else L.push({s,l:'',c:0});save();wlDraw();paint(t)}else act.setSym(s)};
 setInterval(()=>{if(t.vis&&!pn.hidden&&!D.hidden)reload(t)},o.every||15000);return t}
async function reload(t,force){if(t.busy||(!force&&Date.now()-t.t<(t.o.every||15000)/2&&t.data.length))return;t.busy=1;
 try{t.data=await t.o.load(t.q.value.trim());t.t=Date.now();t.msg.textContent=t.data.length?'':'No symbols found'}catch(e){t.msg.textContent=t.o.err?t.o.err(e):String(e&&e.message||e)}
 t.busy=0;paint(t);paintFav()}
function paint(t){const q=t.q.value.trim().toUpperCase(),o=t.s.value,fav=new Set(cur().map(x=>x.s));
 const L=t.data.filter(x=>!q||x.name.toUpperCase().includes(q)||(x.desc||'').toUpperCase().includes(q));
 L.sort(o==='n'?(a,b)=>a.name.localeCompare(b.name):o==='g'?(a,b)=>b.ch-a.ch:o==='l'?(a,b)=>a.ch-b.ch:(a,b)=>b.v-a.v||a.name.localeCompare(b.name));
 t.rows.innerHTML=L.slice(0,300).map(x=>`<div class=it data-s="${esc(x.sym)}" title="${esc(x.desc||x.name)}"><span class="star ${fav.has(x.sym)?'on':''}" data-a=star>★</span><span class=nm>${esc(x.name)}</span><span class=lp>${x.p?fmtP(x.p):'–'}</span><span class="cg ${x.ch>=0?'up':'dn'}">${x.p?(x.ch>=0?'+':'')+x.ch.toFixed(2)+'%':''}</span></div>`).join('')}
/* show last / change in the Favorites list for non-Binance-spot symbols */
function paintFav(){const idx=new Map();Object.values(TABS).forEach(t=>t.data.forEach(x=>{if(x.p)idx.set(x.sym,x)}));
 cur().forEach(it=>{const x=idx.get(it.s),el=D.getElementById('p_'+it.s);if(!x||!el)return;el.innerHTML=`${fmtP(x.p)}<small class="${x.ch>=0?'up':'dn'}">${x.ch>=0?'+':''}${x.ch.toFixed(2)}%</small>`})}
{const w1=wlDraw;wlDraw=function(){w1();try{paintFav()}catch(e){}}}

/* --- Crypto perps: Binance USDT-M futures --- */
const PO=!(window.MCP_CFG&&window.MCP_CFG.perpOnly===false);
let PERP_SET=null,PERP_T=0;
async function perpSet(){/* Binance USDT-M PERPETUAL contracts that are currently TRADING (excludes quarterly/delivery, USDC, settling/closed) */
 if(PERP_SET&&Date.now()-PERP_T<3600e3)return PERP_SET;
 try{const j=await jget('https://fapi.binance.com/fapi/v1/exchangeInfo');
  if(j&&Array.isArray(j.symbols)){PERP_SET=new Set(j.symbols.filter(x=>x.contractType==='PERPETUAL'&&x.quoteAsset==='USDT'&&x.status==='TRADING').map(x=>x.symbol));PERP_T=Date.now()}}catch(e){}
 return PERP_SET}
addTab('perp','Crypto perps',{every:8000,load:async()=>{const[j,ps]=await Promise.all([jget('https://fapi.binance.com/fapi/v1/ticker/24hr'),perpSet()]);
 if(!Array.isArray(j))throw Error('Binance futures unavailable');
 return j.filter(x=>ps?ps.has(x.symbol):(x.symbol.endsWith('USDT')&&!x.symbol.includes('_'))).map(x=>({sym:'BF:'+x.symbol,name:x.symbol+'.P',desc:x.symbol+' perpetual',p:+x.lastPrice,ch:+x.priceChangePercent,v:+x.quoteVolume}))}});
/* --- MT5: symbols from the local bridge, daily change for the first 40 --- */
const q5=new Map();
addTab('mt5','MT5',{every:20000,sort:'n',remoteSearch:1,
 err:e=>'MT5 bridge not reachable ('+(e&&e.message||e)+'). Start START.bat and keep MetaTrader 5 open.',
 load:async q=>{const r=await fetch(`${S.bridge}/symbols?q=${encodeURIComponent(q)}`,{cache:'no-store'}),names=await r.json();
  if(!Array.isArray(names))throw Error(names&&names.error||'bad response');
  const pri=new Set(['XAUUSD','EURUSD','GBPUSD','USDJPY','XAGUSD','BTCUSD'].concat(charts.map(c=>c.src==='MT5'?c.name:'')));
  const sel=names.filter(n=>pri.has(n)).concat(names.filter(n=>!pri.has(n))).slice(0,40);
  for(let i=0;i<sel.length;i+=8)await Promise.all(sel.slice(i,i+8).map(async n=>{const h=q5.get(n);if(h&&Date.now()-h.t<30000)return;
   try{const d=await mt5(n,1440,2),L=d[d.length-1],P=d.length>1?d[d.length-2].close:L.open;q5.set(n,{t:Date.now(),p:L.close,ch:(L.close/P-1)*100})}catch(e){}}));
  return names.map(n=>{const h=q5.get(n)||{};return{sym:'MT5:'+n,name:n,p:h.p||0,ch:h.ch||0,v:0}})}});
/* --- Futures: Yahoo continuous contracts (works through the Cloudflare worker /fx proxy) --- */
const FUT=[['GC=F','Gold'],['SI=F','Silver'],['HG=F','Copper'],['PL=F','Platinum'],['CL=F','WTI crude oil'],['BZ=F','Brent crude'],['NG=F','Natural gas'],['ES=F','S&P 500 E-mini'],['NQ=F','Nasdaq 100 E-mini'],['YM=F','Dow E-mini'],['RTY=F','Russell 2000 E-mini'],['ZB=F','US 30Y bond'],['ZN=F','US 10Y note'],['ZC=F','Corn'],['ZS=F','Soybeans'],['ZW=F','Wheat']];
addTab('fut','Futures',{every:30000,sort:'n',
 load:async()=>(await Promise.all(FUT.map(async([y,n])=>{try{const j=await fxGet('/v8/finance/chart/'+encodeURIComponent(y)+'?interval=1d&range=5d'),m=j.chart.result[0].meta,pv=m.chartPreviousClose||m.previousClose;
  return{sym:'FX:'+y,name:y.replace('=F','')+'1!',desc:n,p:m.regularMarketPrice,ch:pv?(m.regularMarketPrice/pv-1)*100:0,v:m.regularMarketVolume||0}}catch(e){return null}}))).filter(Boolean),
 err:()=>'Futures quotes unavailable (needs the Yahoo proxy: deploy the worker or run through a CORS proxy).'});

/* final tab order, labels like the screenshot */
$('#tw').textContent='Favorites';if($('#tc'))$('#tc').textContent='Crypto spot';
row.append(...['tw','e_perp','tc','e_mt5','e_fut','tn','ta'].map(i=>$('#'+i)).filter(Boolean));

/* ================= go ================= */
charts.forEach(c=>{try{decorate(c);c.updateOhlc();sizeIn(c)}catch(e){console.error('EDGE',e)}});
refreshTop();syncTools();applyDr();
})();
