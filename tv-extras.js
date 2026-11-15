/* TV Extras - load AFTER drawing-pro.js.
   Adds: A (Auto) / L (Log) price-scale buttons, right-click chart menu, TradingView-style Settings dialog
   (Symbol / Status line / Scales and lines / Canvas), Table view, Object tree. */
(()=>{
if(typeof S==='undefined'||typeof Ch==='undefined'||typeof charts==='undefined')return;
const D=document,$=s=>D.querySelector(s);
const DEF={up:'#26a69a',dn:'#ef5350',bUp:'#26a69a',bDn:'#ef5350',wUp:'#26a69a',wDn:'#ef5350',body:1,border:1,wick:1,
 bg:'#131722',gv:1,gh:1,gc:'#1a1f2c',xc:'#758696',tx:'#8b91a3',fs:12,mt:5,mb:8,ro:10,cd:1,vol:1,val:1,title:1,sb:'hover',mg:6,sess:1,sessC:'#5b7fb5',sessS:'dashed',sessH:0,sessZ:'utc',sessW:1,lpLine:1,lpMode:'auto',lpC:'#000000',lpS:'dotted',lpW:1};
const V=S.tv=Object.assign({},DEF,S.tv||{});
if(!V.m2){V.border=1;V.m2=1}
const LIGHT={bg:'#dcdcdc',gv:0,gh:0,xc:'#000000',tx:'#000000',up:'#ffffff',dn:'#000000',bUp:'#000000',bDn:'#000000',wUp:'#000000',wDn:'#000000',border:1};

const css=D.createElement('style');css.textContent=`
.tvab{position:absolute;right:8px;bottom:32px;z-index:7;display:flex;gap:3px;opacity:0;transition:opacity .15s}
.cell:hover .tvab,body.tvsb-always .tvab{opacity:1}body.tvsb-hidden .tvab{display:none}
.tvab button{width:20px;height:20px;padding:0;border:0;border-radius:3px;background:#131722;color:#d1d4dc;font:700 11px system-ui;cursor:pointer}
.tvab button:hover{background:#2a2e39}.tvab button.on{background:#2962ff;color:#fff}
body.tvnt .hd input.sy,body.tvnt .hd input.tf{display:none}
body.tvlp .ecd{background:var(--lpc)!important;color:var(--lpt)!important;font-weight:600}
.hd input.sy,.hd input.tf{pointer-events:none!important;flex:none!important;max-width:none!important;min-width:0!important;text-overflow:clip!important;overflow:visible!important;cursor:default!important}
.hd input.sy{color:var(--hdfg,#d1d4dc)!important}.hd input.tf,.hd .ohlc,.hd .ohlc .k,.hd label,.hd .lk{color:var(--hdfg2,#7b8194)!important}
.hd input:hover,.hd input:focus{background:var(--hdhv,#131722)!important;color:var(--hdfg,#d1d4dc)!important}
#tvctx{position:fixed;z-index:500;background:#141414;border:1px solid #2a2a2a;border-radius:6px;padding:4px 0;min-width:300px;display:none;font:13px system-ui;color:#d1d4dc;box-shadow:0 8px 28px #000a}
#tvctx div{padding:7px 14px;display:flex;justify-content:space-between;gap:24px;cursor:pointer}#tvctx div:hover{background:#2a2e39}
#tvctx i{color:#6b7080;font-style:normal;font-size:11px}#tvctx hr{border:0;border-top:1px solid #2a2a2a;margin:4px 0}
.tvm{position:fixed;inset:0;z-index:600;background:#0007;display:flex;align-items:center;justify-content:center;font:13px system-ui;color:#d1d4dc}
.tvm .bx{background:#141414;border-radius:10px;width:660px;max-width:94vw;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 10px 40px #000}
.tvm h3{margin:0;padding:16px 20px;font-size:17px;font-weight:600;display:flex;justify-content:space-between}
.tvm h3 span{cursor:pointer;color:#8b91a3}.tvm .bd{display:flex;min-height:0;flex:1}
.tvm .nv{width:190px;padding:0 8px 8px;flex:none}.tvm .nv div{padding:9px 12px;border-radius:6px;cursor:pointer;color:#9aa0b0}
.tvm .nv div.on{background:#222;color:#fff;font-weight:600}.tvm .ct{flex:1;padding:4px 20px 12px;overflow:auto;min-height:340px}
.tvm .rw{display:flex;align-items:center;gap:10px;padding:7px 0}.tvm .rw>label{flex:1}.tvm .hh{font-size:11px;color:#6b7080;margin:14px 0 4px;letter-spacing:.5px}
.tvm input[type=color]{width:34px;height:28px;border:1px solid #363a45;border-radius:5px;background:#1e222d;padding:2px}
.tvm input[type=number],.tvm select{background:#1e222d;color:#d1d4dc;border:1px solid #363a45;border-radius:5px;padding:5px 8px;width:110px}
.tvm .ft{display:flex;justify-content:flex-end;gap:10px;padding:14px 20px;border-top:1px solid #2a2a2a}
.tvm button{border:1px solid #d1d4dc;background:transparent;color:#d1d4dc;border-radius:6px;padding:7px 18px;cursor:pointer}
.tvm button.ok{background:#e8e8e8;color:#111;border-color:#e8e8e8}
.tvm table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}.tvm td,.tvm th{padding:4px 8px;text-align:right;border-bottom:1px solid #222}
`;D.head.appendChild(css);

/* ---------- apply settings to a chart ---------- */
const CANDLE=['candles','hollow','volume-candles','heikin-ashi','renko','range','line-break','kagi','point-figure','footprint','bars','high-low'];
function ap(c){if(!c.c||!c.s)return;try{
 c.c.applyOptions({layout:{background:{type:'solid',color:V.bg},textColor:V.tx,fontSize:+V.fs},
  grid:{vertLines:{visible:!!V.gv,color:V.gc},horzLines:{visible:!!V.gh,color:V.gc}},
  crosshair:{vertLine:{color:V.xc},horzLine:{color:V.xc}},timeScale:{rightOffset:+V.ro}});
 const ps=c.c.priceScale('right'),opt={mode:c.cfg.log?1:0};
 if(!S.ind.rsi&&!S.ind.ao){const ch=(c.host.querySelector('.cv')||{}).clientHeight||600;opt.scaleMargins={top:V.mt/100,bottom:c.style==='footprint'?Math.max(V.mb/100,74/ch):V.mb/100}}
 ps.applyOptions(opt);
 try{c.s.applyOptions({lastValueVisible:true,priceLineVisible:!!V.lpLine,priceLineColor:lpCol(),priceLineStyle:{solid:0,dotted:1,dashed:2}[V.lpS]??1,priceLineWidth:+V.lpW||1})}catch(e){}
 if(CANDLE.includes(c.style)){const fp=c.style==='footprint',hol=c.style==='hollow'||fp,T='rgba(0,0,0,0)';
  c.s.applyOptions({upColor:hol||!V.body?T:V.up,downColor:V.body&&!fp?V.dn:T,borderVisible:!!V.border||hol,
   borderUpColor:V.border?V.bUp:V.up,borderDownColor:V.border?V.bDn:V.dn,wickVisible:!!V.wick,wickUpColor:V.wUp,wickDownColor:V.wDn})}
}catch(e){console.warn('tv-extras',e)}}
const lumOf=h=>{h=String(h||'#000').replace('#','');if(h.length===3)h=h.replace(/./g,'$&$&');const n=parseInt(h,16)||0;return(.299*(n>>16&255)+.587*(n>>8&255)+.114*(n&255))/255};
function hdTheme(){const L=lumOf(V.bg)>.55,st=D.body.style;st.setProperty('--hdfg',L?'#000000':'#e6e8ee');st.setProperty('--hdfg2',L?'#333333':'#9aa0b0');st.setProperty('--hdhv',L?'rgba(0,0,0,.08)':'rgba(255,255,255,.1)')}
function lpCol(){if(V.lpMode==='dir')return'';if(V.lpMode==='custom')return V.lpC||'#000000';return lumOf(V.bg)>.55?'#000000':'#d1d4dc'}
function lpTheme(){const col=lpCol(),st=D.body.style;D.body.classList.toggle('tvlp',!!col);if(col){st.setProperty('--lpc',col);st.setProperty('--lpt',lumOf(col)>.55?'#000':'#fff')}}
function applyAll(){hdTheme();lpTheme();charts.forEach(c=>{c._skk=null});
 S.set=S.set||{};S.set.showCountdown=V.cd?1:0;if(S.edge)S.edge.vol=+V.vol;
 D.body.classList.toggle('tvnt',!V.title);
 D.body.classList.remove('tvsb-always','tvsb-hidden');if(V.sb==='always')D.body.classList.add('tvsb-always');if(V.sb==='hidden')D.body.classList.add('tvsb-hidden');
 charts.forEach(c=>{ap(c);c._hv=!V.val;try{c.updateOhlc()}catch(e){}});save()}
function reRender(){charts.forEach(c=>{try{c.render(0);ap(c)}catch(e){}})}

/* ---------- A / L buttons ---------- */
function addAL(c){const cv=c.host&&c.host.querySelector('.cv');if(!cv||c._tvb&&c._tvb.isConnected)return;
 cv.style.position='relative';const d=D.createElement('div');d.className='tvab';
 d.innerHTML='<button data-k=a title="Auto (fits data to screen)">A</button><button data-k=l title="Logarithmic">L</button>';
 d.onmousedown=e=>e.stopPropagation();
 d.onclick=e=>{const k=e.target.dataset.k;if(!k)return;const ps=c.c.priceScale('right');
  if(k==='a'){const on=!ps.options().autoScale;ps.applyOptions({autoScale:on});if(on)c.c.timeScale().scrollToRealTime&&0}
  else{c.cfg.log=!c.cfg.log;ps.applyOptions({mode:c.cfg.log?1:0});save()}sync(c)};
 cv.appendChild(d);c._tvb=d;
 cv.addEventListener('contextmenu',e=>{if(e.defaultPrevented)return;e.preventDefault();ctx(c,e)});sync(c)}
function sync(c){if(!c._tvb)return;try{const o=c.c.priceScale('right').options();
 c._tvb.children[0].classList.toggle('on',!!o.autoScale);c._tvb.children[1].classList.toggle('on',o.mode===1)}catch(e){}}

/* ---------- modal helper ---------- */
function modal(title,body,foot){const m=D.createElement('div');m.className='tvm';
 m.innerHTML=`<div class=bx><h3>${title}<span data-x>✕</span></h3>${body}${foot||''}</div>`;
 m.onmousedown=e=>{if(e.target===m)m.remove()};m.querySelector('[data-x]').onclick=()=>m.remove();D.body.appendChild(m);return m}

/* ---------- right-click menu ---------- */
const menu=D.createElement('div');menu.id='tvctx';D.body.appendChild(menu);
D.addEventListener('click',()=>menu.style.display='none');D.addEventListener('keydown',e=>{if(e.key==='Escape')menu.style.display='none'});
function resetView(c){c.c.timeScale().fitContent();c.c.priceScale('right').applyOptions({autoScale:true});sync(c)}
function ctx(c,e){setAct&&setAct(c);const cv=c.host.querySelector('.cv'),r=cv.getBoundingClientRect(),pr=c.s.coordinateToPrice(e.clientY-r.top),
 pt=pr==null?'':pr.toFixed(c.precision||2),dn=(S.dp&&S.dp[c.cfg.sym]||[]).length,ni=Object.keys(S.ind).filter(k=>S.ind[k]).length;
 const it=[['Reset chart view','Alt + R',()=>resetView(c)],'-',
  ['Copy price '+pt,'',()=>navigator.clipboard&&navigator.clipboard.writeText(pt)],
  ['Paste','Ctrl + V',()=>D.dispatchEvent(new KeyboardEvent('keydown',{key:'v',ctrlKey:true,bubbles:true}))],'-',
  ['Add alert on '+c.name+' at '+pt,'Alt + A',()=>{window.tvAlert?tvAlert(pt):(()=>{const b=$('#tools [data-t="pal"]');b&&b.click()})()}],'-',
  ['Table view','',()=>tableView(c)],['Object tree','',()=>objTree(c)],'-',
  ['Remove '+dn+' drawing'+(dn===1?'':'s'),'',dn?()=>{S.dp[c.cfg.sym]=[];save()}:null],
  ['Remove '+ni+' indicator'+(ni===1?'':'s'),'',ni?()=>{Object.keys(S.ind).forEach(k=>{if(S.ind[k]){const b=$(`button[data-i=${k}]`);b?b.click():(S.ind[k]=0)}});charts.forEach(x=>x.ind());save()}:null],'-',
  ['Settings…','',()=>settings()]];
 menu.innerHTML=it.map((x,i)=>x==='-'?'<hr>':`<div data-i=${i} style="${x[2]?'':'opacity:.4;cursor:default'}"><span>${x[0]}</span><i>${x[1]}</i></div>`).join('');
 menu.onclick=ev=>{const d=ev.target.closest('[data-i]');if(d&&it[+d.dataset.i][2])it[+d.dataset.i][2]()};
 menu.style.display='block';menu.style.left=Math.min(e.clientX,innerWidth-menu.offsetWidth-6)+'px';menu.style.top=Math.min(e.clientY,innerHeight-menu.offsetHeight-6)+'px'}
D.addEventListener('keydown',e=>{if(e.altKey&&e.key.toLowerCase()==='r'&&!e.shiftKey&&act){e.preventDefault();resetView(act)}});

function tableView(c){const a=c.view().slice(-300).reverse(),f=v=>v.toFixed(c.precision||2);
 modal('Table view · '+c.name,`<div class=ct style="padding:0 20px 16px;overflow:auto"><table><tr><th>Time</th><th>Open</th><th>High</th><th>Low</th><th>Close</th><th>Volume</th></tr>${
  a.map(x=>`<tr><td>${new Date(x.time*1000).toLocaleString()}</td><td>${f(x.open)}</td><td>${f(x.high)}</td><td>${f(x.low)}</td><td>${f(x.close)}</td><td>${Math.round(x.volume||0)}</td></tr>`).join('')}</table></div>`)}
function objTree(c){const L=S.dp&&S.dp[c.cfg.sym]||[];
 const m=modal('Object tree',`<div class=ct>${L.length?L.map((o,i)=>`<div class=rw><label>${i+1}. ${o.type||o.k||o.tool||o.t||'drawing'}</label><button data-d=${i}>Delete</button></div>`).join(''):'<div class=rw>No drawings on this symbol.</div>'}</div>`);
 m.onclick=e=>{const i=e.target.dataset.d;if(i==null)return;L.splice(+i,1);save();m.remove();objTree(c)}}

/* ---------- Settings dialog ---------- */
const TABS={
 'Symbol':[['h','CANDLES'],['cc','Body','body','up','dn'],['cc','Borders','border','bUp','bDn'],['cc','Wick','wick','wUp','wDn']],
 'Status line':[['k','Symbol & timeframe title','title'],['k','Chart values (OHLC)','val'],['k','Volume bars','vol']],
 'Scales and lines':[['h','PRICE SCALE'],['s','Scale modes (A and L)','sb',[['hover','Visible on mouse over'],['always','Always visible'],['hidden','Hidden']]],['k','Countdown to bar close','cd'],['h','MAGNET'],['n','Weak magnet range (px)  – 2 = very weak, 40 = strong','mg',2,60],['h','LAST PRICE LINE & LABEL'],['k','Show last price line','lpLine'],['s','Color mode','lpMode',[['auto','Auto (black on light, light on dark)'],['custom','Custom color'],['dir','Candle direction (green / red)']]],['c','Custom color','lpC'],['s','Line style','lpS',[['dotted','Dotted'],['dashed','Dashed'],['solid','Solid']]],['n','Line width','lpW',1,3]],
 'Canvas':[['h','CHART BASIC STYLES'],['c','Background','bg'],['k','Vertical grid lines','gv'],['k','Horizontal grid lines','gh'],['c','Grid color','gc'],['c','Crosshair','xc'],
  ['h','SCALES'],['c','Text color','tx'],['n','Text size','fs',8,24],['h','MARGINS'],['n','Top %','mt',0,40],['n','Bottom %','mb',0,40],['n','Right (bars)','ro',0,100],['p','Preset: light gray canvas (screenshot look)']],
 'Events':[['h','SESSION BREAKS'],['k','Session breaks (vertical line at daily open)','sess'],['c','Line color','sessC'],['s','Line style','sessS',[['dashed','Dashed'],['solid','Solid'],['dotted','Dotted']]],['s','Day starts by','sessZ',[['utc','UTC midnight (crypto daily open = 05:30 Sri Lanka)'],['chart','Chart time zone midnight']]],['n','Day starts at (hour after midnight)','sessH',0,23],['n','Line thickness','sessW',1,4]]};
function settings(){const snap=JSON.stringify(V);let tab='Symbol';
 const m=modal('Settings',`<div class=bd><div class=nv></div><div class=ct></div></div>`,`<div class=ft><button data-c>Cancel</button><button class=ok data-o>Ok</button></div>`);
 const nv=m.querySelector('.nv'),ct=m.querySelector('.ct');
 const draw=()=>{nv.innerHTML=Object.keys(TABS).map(t=>`<div class="${t===tab?'on':''}" data-t="${t}">${t}</div>`).join('');
  ct.innerHTML=TABS[tab].map((r,i)=>{const[k,l,a,b,c2]=r;
   if(k==='h')return`<div class=hh>${l}</div>`;
   if(k==='p')return`<div class=rw><button data-p>${l}</button></div>`;
   if(k==='cc')return`<div class=rw><input type=checkbox data-k=${a} ${V[a]?'checked':''}><label>${l}</label><input type=color data-k=${b} value="${V[b]}"><input type=color data-k=${c2} value="${V[c2]}"></div>`;
   if(k==='k')return`<div class=rw><input type=checkbox data-k=${a} ${V[a]?'checked':''}><label>${l}</label></div>`;
   if(k==='c')return`<div class=rw><label>${l}</label><input type=color data-k=${a} value="${V[a]}"></div>`;
   if(k==='n')return`<div class=rw><label>${l}</label><input type=number data-k=${a} min=${b} max=${c2} value="${V[a]}"></div>`;
   return`<div class=rw><label>${l}</label><select data-k=${a}>${b.map(o=>`<option value=${o[0]} ${V[a]===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></div>`}).join('')};
 draw();
 nv.onclick=e=>{if(e.target.dataset.t){tab=e.target.dataset.t;draw()}};
 const upd=e=>{const t=e.target,k=t.dataset.k;if(!k)return;V[k]=t.type==='checkbox'?+t.checked:t.type==='number'?+t.value:t.value;if(k==='bUp'||k==='bDn')V.border=1;if(k==='lpC'){V.lpMode='custom';const sm=ct.querySelector('[data-k=lpMode]');if(sm)sm.value='custom'}if(k==='bg'){const L=lumOf(V.bg)>.55;V.tx=L?'#000000':'#8b91a3';V.xc=L?'#000000':'#758696'}applyAll();if(k==='vol')reRender()};
 ct.oninput=upd;ct.onchange=upd;
 ct.onclick=e=>{if(e.target.dataset.p!=null){Object.assign(V,LIGHT);applyAll();draw()}};
 m.querySelector('[data-c]').onclick=()=>{Object.keys(V).forEach(k=>delete V[k]);Object.assign(V,JSON.parse(snap));applyAll();reRender();m.remove()};
 m.querySelector('[data-o]').onclick=()=>{save();m.remove()}}
window.tvSettings=settings;

/* ---------- session breaks: vertical line at every daily open (chart time zone) ---------- */
function sessDraw(c){const cv=c.host&&c.host.querySelector('.cv');if(!cv||!c.c||!c.s)return;let k=c._sk;
 if(!k||!k.isConnected){k=c._sk=D.createElement('canvas');k.className='tvsess';k.style.cssText='position:absolute;left:0;top:0;pointer-events:none;z-index:3';cv.style.position='relative';cv.appendChild(k);c._skk=null}
 if(!c._sub){c._sub=1;c.c.timeScale().subscribeVisibleLogicalRangeChange(()=>{try{sessDraw(c)}catch(e){}});try{c.c.timeScale().subscribeSizeChange(()=>{try{sessDraw(c)}catch(e){}})}catch(e){}}
 const ts=c.c.timeScale(),vr=ts.getVisibleLogicalRange(),a=c.view(),w=cv.clientWidth,h=cv.clientHeight;
 const key=[w,h,vr&&vr.from.toFixed(4),vr&&vr.to.toFixed(4),a.length,V.sess,V.sessC,V.sessS,V.sessH,V.sessW,V.sessZ,S.tz,c.tfm].join();if(key===c._skk)return;c._skk=key;
 const dpr=devicePixelRatio||1;const g=k.getContext('2d');if(k.width!==Math.round(w*dpr)||k.height!==Math.round(h*dpr)){k.width=Math.round(w*dpr);k.height=Math.round(h*dpr);k.style.width=w+'px';k.style.height=h+'px'}g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);
 if(!V.sess||!vr||(c.tfm||1)>=1440||a.length<2)return;
 const ck=V.sessZ+'|'+(S.tz||'')+'|'+V.sessH;if(c._dkk!==ck){c._dkc=new Map();c._dkk=ck}
 let fmt;try{fmt=new Intl.DateTimeFormat('en-CA',{timeZone:V.sessZ==='chart'?(S.tz||undefined):'UTC',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'})}catch(e){fmt=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'})}
 const dk=t=>{let v=c._dkc.get(t);if(v!=null)return v;const o={};fmt.formatToParts(new Date(t*1000)).forEach(x=>o[x.type]=x.value);const d=new Date(Date.UTC(+o.year,+o.month-1,+o.day,(+o.hour||0)-(+V.sessH||0)));v=d.getUTCFullYear()*10000+d.getUTCMonth()*100+d.getUTCDate();c._dkc.set(t,v);return v};
 g.strokeStyle=V.sessC;g.lineWidth=+V.sessW||1;g.setLineDash(V.sessS==='solid'?[]:V.sessS==='dotted'?[1.5,3]:[5,4]);
 const i0=Math.max(1,Math.floor(vr.from)-1),i1=Math.min(a.length-1,Math.ceil(vr.to)+1);
 for(let i=i0;i<=i1;i++){if(dk(a[i].time)===dk(a[i-1].time))continue;const x=ts.logicalToCoordinate(i);if(x==null)continue;g.beginPath();g.moveTo(Math.round(x)+.5,0);g.lineTo(Math.round(x)+.5,h);g.stroke()}}
(function sessLoop(){charts.forEach(c=>{try{sessDraw(c)}catch(e){}});requestAnimationFrame(sessLoop)})();

window.tvObjTree=()=>objTree((typeof act!=='undefined'&&act)||charts[0]);
/* ---------- hooks ---------- */
const wrap=(n,fn)=>{const o=Ch.prototype[n];Ch.prototype[n]=function(...a){const r=o.apply(this,a);try{fn.call(this)}catch(e){console.warn('tv-extras',e)}return r}};
wrap('render',function(){addAL(this);ap(this);sync(this)});
wrap('createSeries',function(){ap(this)});
wrap('ind',function(){ap(this)});
setInterval(()=>charts.forEach(sync),400);

/* open Settings from the gear icon (replaces the old chart-settings handler) */
D.addEventListener('click',e=>{const b=e.target.closest('#eic button[title="Chart settings"]');if(b){e.stopImmediatePropagation();e.preventDefault();settings()}},true);

charts.forEach(c=>{addAL(c)});applyAll();
})();
