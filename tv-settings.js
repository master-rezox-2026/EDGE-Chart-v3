/* TV Settings - load LAST (after tv-icons.js). Full TradingView-style Settings dialog:
   Symbol / Status line / Scales and lines / Canvas / Trading / Alerts / Events + Template menu.
   Replaces window.tvSettings (gear icon, double-click on chart, right-click > Settings).
   Rows tagged "preview" are saved but have no engine in this app yet (no broker / bid-ask feed / news feed). */
(()=>{
if(typeof S==='undefined'||typeof Ch==='undefined'||typeof charts==='undefined')return;
const D=document,$=s=>D.querySelector(s);
const V=S.tv=S.tv||{};
const DEF={
 /* from tv-extras */
 up:'#26a69a',dn:'#ef5350',bUp:'#26a69a',bDn:'#ef5350',wUp:'#26a69a',wDn:'#ef5350',body:1,border:1,wick:1,
 bg:'#131722',gv:1,gh:1,tx:'#8b91a3',fs:12,mt:5,mb:8,ro:10,cd:1,vol:1,val:1,title:1,sb:'hover',sess:1,sessC:'#5b7fb5',sessS:'dashed',
 lpLine:1,lpMode:'auto',lpC:'#000000',lpS:'dotted',lpW:1,xc:'#758696',
 /* status line */
 logo:1,tmode:'name',mkt:1,chg:1,volv:0,dchg:0,bs:0,itit:1,iinp:1,ival:1,ibg:1,ibgA:50,
 /* scales and lines */
 cur:'hover',sb2:'hover',lockR:0,lockV:'0.327109',place:'auto',nolap:1,plus:1,sm:'vl',sv:'val',
 pdc:'val',pdcC:'#555555',iaf:'val',hl:'hid',hlU:'#26a69a',hlD:'#ef5350',ba:'hid',baB:'#2a46a8',baA:'#a8333f',dow:1,
 /* canvas */
 bgm:'solid',bg2:'#1e222d',gvc:'#1a1f2c',gvA:100,ghc:'#1a1f2c',ghA:100,psep:'#2a2e39',xs:'dashed',xw:1,
 wm:'hid',wmc:'#787b86',wmA:12,ln:'#232836',navb:'hover',paneb:'hover',
 /* trading (preview) */
 t1c:0,tsnd:0,trej:0,tpos:1,trev:1,tproj:1,tpl:1,tplP:1,tplB:1,tplPu:'money',tplBu:'money',texe:1,texl:0,text:1,tali:'right',tsnap:0,
 /* alerts (preview) */
 alln:1,allb:1,asnd:1,apop:1,
 /* events */
 idea:0,eco:1,ecoF:1,ecoB:0,news:1,nnot:0
};
const KEYS=Object.keys(DEF);
KEYS.forEach(k=>{if(V[k]===undefined)V[k]=DEF[k]});
if(!V.tpls)V.tpls={};
const LIGHT={bg:'#dcdcdc',bgm:'solid',gv:0,gh:0,xc:'#000000',tx:'#000000',up:'#ffffff',dn:'#000000',bUp:'#000000',bDn:'#000000',wUp:'#000000',wDn:'#000000',border:1};

/* ---------- helpers ---------- */
const lumOf=h=>{h=String(h||'#000').replace('#','');if(h.length===3)h=h.replace(/./g,'$&$&');const n=parseInt(h,16)||0;return(.299*(n>>16&255)+.587*(n>>8&255)+.114*(n&255))/255};
const rgba=(h,a)=>{h=String(h||'#000').replace('#','');if(h.length===3)h=h.replace(/./g,'$&$&');const n=parseInt(h,16)||0;return`rgba(${n>>16&255},${n>>8&255},${n&255},${Math.max(0,Math.min(100,+a))/100})`};
const LS={solid:0,dotted:1,dashed:2,ldash:3};
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fcache={},F=(z,o)=>{const k=z+JSON.stringify(o);return fcache[k]||(fcache[k]=new Intl.DateTimeFormat('en-GB',{timeZone:z||undefined,...o}))};
const fmtV=v=>v>=1e9?(v/1e9).toFixed(2)+'B':v>=1e6?(v/1e6).toFixed(2)+'M':v>=1e3?(v/1e3).toFixed(2)+'K':String(Math.round(v));

/* ---------- body-level theme (header colours, countdown label) ---------- */
function lpCol(){if(V.lpMode==='dir')return'';if(V.lpMode==='custom')return V.lpC||'#000000';return lumOf(V.bg)>.55?'#000000':'#d1d4dc'}
function theme(){const st=D.body.style,L=lumOf(V.bg)>.55;
 st.setProperty('--hdfg',L?'#000000':'#e6e8ee');st.setProperty('--hdfg2',L?'#333333':'#9aa0b0');st.setProperty('--hdhv',L?'rgba(0,0,0,.08)':'rgba(255,255,255,.1)');
 const col=lpCol();D.body.classList.toggle('tvlp',!!col);if(col){st.setProperty('--lpc',col);st.setProperty('--lpt',lumOf(col)>.55?'#000':'#fff')}
 D.body.classList.toggle('tvnt',!V.title);
 D.body.classList.remove('tvsb-always','tvsb-hidden');
 const sb=V.sb2!=='hover'?V.sb2:V.sb;                     /* "Scale modes (A and L)" visibility */
 if(sb==='always')D.body.classList.add('tvsb-always');if(sb==='hidden')D.body.classList.add('tvsb-hidden')}

/* ---------- price lines: previous day close, high / low ---------- */
function lines(c){if(!c.s||!c.c)return;
 if(c._plS!==c.s){c._plS=c.s;c._pl={};c._plK={}}
 const set=(id,price,mode,color,w)=>{const key=[price,mode,color].join('|');if(c._plK[id]===key)return;c._plK[id]=key;
  if(c._pl[id]){try{c.s.removePriceLine(c._pl[id])}catch(e){}c._pl[id]=null}
  if(price==null||mode==='hid')return;
  try{c._pl[id]=c.s.createPriceLine({price,color,lineWidth:w||1,lineStyle:2,lineVisible:mode==='line'||mode==='vl',axisLabelVisible:mode==='val'||mode==='vl',title:''})}catch(e){}};
 let pc=null;const r=c.raw;
 if(r&&r.length&&V.pdc!=='hid'){const d0=Math.floor(r[r.length-1].time/86400)*86400;let i=r.length-1;while(i>=0&&r[i].time>=d0)i--;if(i>=0)pc=r[i].close}
 set('pc',pc,V.pdc==='hid'?'hid':V.pdc==='line'?'line':V.pdc==='vl'?'vl':'val',V.pdcC);
 let hi=null,lo=null;
 if(V.hl!=='hid'){try{const vr=c.c.timeScale().getVisibleLogicalRange(),a=c.view();if(vr&&a.length){const s=a.slice(Math.max(0,Math.floor(vr.from)),Math.min(a.length,Math.ceil(vr.to)+1));if(s.length){hi=Math.max(...s.map(x=>x.high));lo=Math.min(...s.map(x=>x.low))}}}catch(e){}}
 const m=V.hl==='line'?'line':V.hl==='vl'?'vl':'val';
 set('hi',hi,V.hl==='hid'?'hid':m,V.hlU);set('lo',lo,V.hl==='hid'?'hid':m,V.hlD)}

/* ---------- time formatters (time zone from tv-icons + "Day of week on labels") ---------- */
function fmts(c){const z=S.tz||'',key=z+'|'+V.dow;if(c._tsk===key)return;c._tsk=key;c._tzk=z;
 const tfm=t=>{if(typeof t!=='number')return String(t&&t.day?`${t.year}-${t.month}-${t.day}`:t);const d=new Date(t*1000),p=o=>F(z,o).format(d);
  return`${V.dow?p({weekday:'short'})+' ':''}${p({day:'2-digit'})} ${p({month:'short'})} '${p({year:'2-digit'})}  ${p({hour:'2-digit',minute:'2-digit',hourCycle:'h23'})}`};
 const tick=(t,type)=>{if(typeof t!=='number')return null;const d=new Date(t*1000),p=o=>F(z,o).format(d);
  return type===0?p({year:'numeric'}):type===1?p({month:'short'}):type===2?(V.dow?p({weekday:'short'})+' ':'')+p({day:'numeric'}):p({hour:'2-digit',minute:'2-digit',hourCycle:'h23'})};
 try{c.c.applyOptions({localization:{timeFormatter:tfm},timeScale:{tickMarkFormatter:tick}})}catch(e){}}

/* ---------- watermark ---------- */
function wm(c){const cv=c.host&&c.host.querySelector('.cv');if(!cv)return;let w=c._wm;
 if(!w||!w.isConnected){w=c._wm=D.createElement('div');w.style.cssText='position:absolute;left:0;right:56px;top:0;bottom:30px;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:1;font-family:system-ui;font-weight:700;white-space:nowrap;overflow:hidden';cv.style.position='relative';cv.appendChild(w)}
 if(V.wm==='hid'){w.style.display='none';return}
 const sym=c.cfg.sym||'';w.style.display='flex';w.textContent=V.wm==='sym'?sym:`${sym}, ${c.cfg.tf||''}`;
 w.style.color=rgba(V.wmc,V.wmA);w.style.fontSize=Math.max(24,Math.min(cv.clientHeight*.16,cv.clientWidth*.1))+'px'}

/* ---------- apply to one chart ---------- */
const CANDLE=['candles','hollow','volume-candles','heikin-ashi','renko','range','line-break','kagi','point-figure','footprint','bars','high-low'];
function ap(c){if(!c.c||!c.s)return;try{
 const bg=V.bgm==='grad'?{type:'gradient',topColor:V.bg,bottomColor:V.bg2}:{type:'solid',color:V.bg};
 const xl={color:V.xc,style:LS[V.xs]??2,width:+V.xw||1};
 c.c.applyOptions({layout:{background:bg,textColor:V.tx,fontSize:+V.fs},
  grid:{vertLines:{visible:!!V.gv,color:rgba(V.gvc,V.gvA)},horzLines:{visible:!!V.gh,color:rgba(V.ghc,V.ghA)}},
  crosshair:{vertLine:xl,horzLine:xl},timeScale:{rightOffset:+V.ro,borderColor:V.ln}});
 const ps=c.c.priceScale('right'),opt={mode:c.cfg.log?1:V.sv==='pct'?2:V.sv==='idx'?3:0,borderColor:V.ln};
 if(!S.ind.rsi&&!S.ind.ao){const ch=(c.host.querySelector('.cv')||{}).clientHeight||600;opt.scaleMargins={top:V.mt/100,bottom:c.style==='footprint'?Math.max(V.mb/100,74/ch):V.mb/100}}
 ps.applyOptions(opt);
 const sm=V.sm,col=lpCol();
 c.s.applyOptions({lastValueVisible:sm!=='hid'&&sm!=='l',priceLineVisible:!!V.lpLine&&(sm==='vl'||sm==='l'),priceLineColor:col,priceLineStyle:LS[V.lpS]??1,priceLineWidth:+V.lpW||1});
 if(CANDLE.includes(c.style)){const fp=c.style==='footprint',hol=c.style==='hollow'||fp,T='rgba(0,0,0,0)';
  c.s.applyOptions({upColor:hol||!V.body?T:V.up,downColor:V.body&&!fp?V.dn:T,borderVisible:!!V.border||hol,
   borderUpColor:V.border?V.bUp:V.up,borderDownColor:V.border?V.bDn:V.dn,wickVisible:!!V.wick,wickUpColor:V.wUp,wickDownColor:V.wDn})}
 c._hv=!V.val;lines(c);fmts(c);wm(c);
}catch(e){console.warn('tv-settings',e)}}
function applyAll(){theme();S.set=S.set||{};S.set.showCountdown=V.cd?1:0;if(S.edge)S.edge.vol=+V.vol;
 charts.forEach(c=>{c._skk=null;c._tsk=null;ap(c);try{c.updateOhlc()}catch(e){}});save()}
const reRender=()=>charts.forEach(c=>{try{c.render(0);ap(c)}catch(e){}});

/* ---------- status line extras: title mode, bar change, volume value ---------- */
const oU=Ch.prototype.updateOhlc;
Ch.prototype.updateOhlc=function(p){const r=oU.apply(this,arguments);try{
 const sym=this.cfg.sym||'',tk=sym.replace(/^[A-Z0-9]+:/,'').replace(/\.P$/,'');
 const t=V.tmode==='ticker'?tk:V.tmode==='desc'?tk+(/\.P$/.test(sym)?' Perpetual':''):sym;
 if(this.symI&&D.activeElement!==this.symI&&this.symI.value!==t){this.symI.value=t;this.symI.style.width=Math.max(4,t.length+1)+'ch'}
 const o=this.ohlc,n=o.children.length,pc=o.children[n-2];
 if(pc&&!pc.classList.contains('k')&&!pc.classList.contains('demo'))pc.style.display=V.chg?'':'none';
 if(V.volv&&pc){const a=this.view(),hov=p&&p.time?a.find(x=>x.time===p.time):null,b=hov||a[a.length-1];
  if(b){const k=D.createElement('span');k.className='k';k.textContent='Vol';const v=D.createElement('span');v.style.color=b.close>=b.open?V.up:V.dn;v.textContent=fmtV(b.volume||0);o.insertBefore(k,pc);o.insertBefore(v,pc)}}
}catch(e){}return r};
const wrap=(n,fn)=>{const o=Ch.prototype[n];Ch.prototype[n]=function(...a){const r=o.apply(this,a);try{fn.call(this)}catch(e){console.warn('tv-settings',e)}return r}};
wrap('render',function(){ap(this)});wrap('createSeries',function(){ap(this)});wrap('ind',function(){ap(this)});
setInterval(()=>charts.forEach(c=>{if(!c.c)return;if(c._tsk!==(S.tz||'')+'|'+V.dow)fmts(c);lines(c);wm(c)}),700);

/* ================= dialog ================= */
const css=D.createElement('style');css.textContent=`
.tvs{position:fixed;inset:0;z-index:650;background:#0008;display:flex;align-items:center;justify-content:center;font:14px/1.3 -apple-system,"Trebuchet MS",system-ui,sans-serif;color:#d1d4dc}
.tvs .bx{background:#2a2a2a;border-radius:14px;width:745px;max-width:96vw;height:min(880px,94vh);display:flex;flex-direction:column;box-shadow:0 12px 50px #000;overflow:hidden}
.tvs h3{margin:0;padding:22px 18px 10px;font-size:20px;font-weight:600;color:#c8c8c8;display:flex;justify-content:space-between;align-items:center}
.tvs h3 span{cursor:pointer;color:#d1d4dc;font-size:22px;padding:0 6px}
.tvs .bd{display:flex;flex:1;min-height:0}
.tvs .nv{width:206px;flex:none;padding:6px 14px 8px 18px;overflow:auto}
.tvs .nv div{display:flex;align-items:center;gap:12px;height:40px;padding:0 12px;border-radius:10px;cursor:pointer;color:#b2b5be;font-size:14.5px;margin-bottom:0}
.tvs .nv div svg{flex:none;width:20px;height:20px}.tvs .nv div:hover{background:#333}
.tvs .nv div.on{background:#1b1b1b;color:#fff;font-weight:700}
.tvs .ct{flex:1;padding:6px 26px 18px 8px;overflow:auto}
.tvs .ct::-webkit-scrollbar{width:8px}.tvs .ct::-webkit-scrollbar-thumb{background:#555;border-radius:4px}
.tvs .hh{font-size:11.5px;color:#868993;letter-spacing:.4px;text-transform:uppercase;margin:16px 0 10px}.tvs .hh:first-child{margin-top:8px}
.tvs .rw{display:flex;align-items:center;gap:12px;min-height:50px}
.tvs .rw.in{padding-left:26px}
.tvs .rw>label{display:flex;align-items:center;gap:12px;flex:1;cursor:default;font-size:14.5px;color:#d1d4dc}
.tvs .rw.lbl>label{flex:0 0 187px}
.tvs .ctl{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.tvs .ds{font-size:13px;color:#868993;margin:-6px 0 8px 33px}
.tvs .ds.in{margin-left:59px}
.tvs input[type=checkbox]{appearance:none;-webkit-appearance:none;width:20px;height:20px;flex:none;margin:0;border-radius:5px;border:2px solid #868993;background:transparent;cursor:pointer;display:inline-grid;place-content:center}
.tvs input[type=checkbox]:checked{background:#fff;border-color:#fff}
.tvs input[type=checkbox]:checked::after{content:"";width:9px;height:5px;border-left:2.2px solid #1b1b1b;border-bottom:2.2px solid #1b1b1b;transform:rotate(-45deg) translate(1px,-1px)}
.tvs input[type=checkbox]:disabled{opacity:.35}
.tvs select,.tvs input[type=text],.tvs input[type=number]{height:36px;background:#2a2a2a;color:#d1d4dc;border:2px solid #4a4a4a;border-radius:10px;padding:0 12px;font:inherit;font-size:14.5px;outline:0}
.tvs select{appearance:none;-webkit-appearance:none;padding-right:34px;min-width:178px;max-width:230px;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none' stroke='%23d1d4dc' stroke-width='1.6'%3E%3Cpath d='M1 1.5l5 5 5-5'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center}
.tvs select:hover,.tvs input:hover:not([type=checkbox]){border-color:#6a6a6a}.tvs select:focus,.tvs input[type=number]:focus,.tvs input[type=text]:focus{border-color:#2962ff}
.tvs select:disabled,.tvs input:disabled:not([type=checkbox]){opacity:.4}
.tvs input[type=number]{width:96px}
.tvs .sw{position:relative;width:34px;height:34px;border-radius:9px;border:2px solid #4a4a4a;overflow:hidden;flex:none;background:repeating-conic-gradient(#3a3a3a 0 25%,#2a2a2a 0 50%) 0/10px 10px}
.tvs .sw input{position:absolute;inset:-8px;width:60px;height:60px;border:0;padding:0;cursor:pointer;opacity:0}.tvs .sw i{position:absolute;inset:0;pointer-events:none}
.tvs .sw.w{width:72px}.tvs .sw.w b{position:absolute;left:30px;right:6px;top:50%;border-top:2px dashed #aaa;pointer-events:none}
.tvs input[type=range]{width:148px;height:10px;accent-color:#2962ff;cursor:pointer}
.cpop{position:fixed;z-index:5;width:254px;background:#0f0f0f;border:1px solid #2a2a2a;border-radius:10px;padding:14px;box-shadow:0 12px 40px #000;color:#d1d4dc;font:13px system-ui}
.cpop .g{display:grid;grid-template-columns:repeat(10,1fr);gap:4px}.cpop .g+.g{margin-top:12px}
.cpop .c{aspect-ratio:1;border-radius:3px;cursor:pointer;border:2px solid transparent;box-sizing:border-box}.cpop .c:hover{transform:scale(1.12)}.cpop .c.on{border-color:#fff;outline:1px solid #000;outline-offset:-3px}
.cpop hr{border:0;border-top:1px solid #2a2a2a;margin:14px 0}
.cpop .cu{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.cpop .cu .c{width:20px;height:20px;aspect-ratio:auto}.cpop .cu .pl{width:20px;height:20px;font-size:22px;line-height:18px;text-align:center;cursor:pointer;color:#d1d4dc}
.cpop .op{margin-top:14px;color:#868993}.cpop .or{display:flex;align-items:center;gap:12px;margin-top:10px}
.cpop .ob{position:relative;flex:1;height:10px;border-radius:5px;cursor:pointer;background:linear-gradient(90deg,transparent,var(--cc)),repeating-conic-gradient(#555 0 25%,#222 0 50%) 0/8px 8px}
.cpop .ob i{position:absolute;top:50%;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:#fff;border:2px solid #000;pointer-events:none}
.cpop .pc{width:60px!important;height:32px!important;text-align:center;padding:0 4px!important}
.cpop .hx{display:flex;align-items:center;gap:10px;margin-bottom:12px}.cpop .hx .sq{width:26px;height:26px;border-radius:6px;flex:none}.cpop .hx input{flex:1;min-width:0;width:100px}
.cpop .hx button{background:#e8e8e8;color:#111;border:0;border-radius:10px;height:34px;padding:0 14px;font:600 14px system-ui;cursor:pointer}
.cpop .pk{display:flex;gap:10px}.cpop canvas{border-radius:3px;cursor:crosshair;touch-action:none}
.cpop .hue{position:relative;width:18px;height:176px;border-radius:3px;cursor:pointer;background:linear-gradient(#f00,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,#f00);touch-action:none}.cpop .hue i{position:absolute;left:-2px;right:-2px;height:6px;margin-top:-3px;border:2px solid #fff;border-radius:3px;background:#f00;pointer-events:none}
.tvs .pv::after{content:"preview";margin-left:8px;font-size:10px;color:#868993;border:1px solid #4a4a4a;border-radius:8px;padding:0 6px;line-height:15px}
.tvs .note{margin:8px 0 6px;padding:10px 12px;background:#222;border-radius:10px;color:#9aa0b0;font-size:13px}
.tvs .ft{display:flex;align-items:center;gap:10px;padding:14px 18px;border-top:1px solid #3a3a3a;position:relative}
.tvs .ft .sp{flex:1}
.tvs .ft button{height:38px;border-radius:10px;padding:0 18px;font:600 15px system-ui;cursor:pointer}
.tvs .ft .tp{background:transparent;color:#d1d4dc;border:2px solid #4a4a4a;font-weight:500;display:flex;align-items:center;gap:12px}
.tvs .ft .cn{background:transparent;color:#fff;border:2px solid #fff}.tvs .ft .ok{background:#f0f0f0;color:#111;border:2px solid #f0f0f0}
.tvs .tm{position:absolute;left:18px;bottom:62px;background:#2a2a2a;border:1px solid #4a4a4a;border-radius:10px;min-width:240px;padding:6px 0;box-shadow:0 10px 30px #000}
.tvs .tm div{padding:9px 16px;cursor:pointer;font-size:14px}.tvs .tm div:hover{background:#3a3a3a}.tvs .tm hr{border:0;border-top:1px solid #444;margin:5px 0}
@media(max-width:820px){.tvs .nv{width:56px;padding:6px 6px}.tvs .nv div{font-size:0;padding:0 10px;gap:0}.tvs .ct{padding:6px 14px 14px 4px}.tvs .rw.lbl>label{flex-basis:120px}.tvs select{min-width:130px}}`;
D.head.appendChild(css);

const I=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICON={'Symbol':I('<path d="M7 5v14M5 8h4v7H5zM17 3v14M15 6h4v8h-4z"/>'),'Status line':I('<path d="M5 6h14M5 10h8M5 14h14M5 18h8"/>'),
 'Scales and lines':I('<path d="M5 3v16h16M5 19L9 14M5 3l-2 3M5 3l2 3M21 19l-3-2M21 19l-3 2"/>'),'Canvas':I('<path d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3"/>'),
 'Trading':I('<path d="M3 17l5-5 4 3 8-9M3 21h18"/>'),'Alerts':I('<circle cx="12" cy="13" r="7"/><path d="M12 9v4l2 2M5 5L3 7M19 5l2 2"/>'),'Events':I('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>')};

const YN=[['hover','Visible on mouse over'],['always','Always visible'],['hidden','Hidden']];
const LBL=[['vl','Value, line'],['v','Value'],['l','Line'],['hid','Hidden']];
const VAL=[['hid','Hidden'],['val','Value'],['line','Line'],['vl','Value, line']];
const LSTY=[['solid','Solid'],['dotted','Dotted'],['dashed','Dashed']];
const PV=[['percent','Percentage'],['money','Money']];
const sel=(k,o,extra)=>({c:'s',k,o,...extra}),col=(k,a)=>({c:'c',k,a}),chk=k=>({c:'k',k}),num=(k,mn,mx)=>({c:'n',k,mn,mx}),rng=k=>({c:'r',k});
/* rows: [type,label,...] ; h = heading, k = checkbox row, r = label + controls row */
const TABS={
'Symbol':[['h','Candles'],
 ['k','Body','body',[col('up'),col('dn')]],['k','Borders','border',[col('bUp'),col('bDn')]],['k','Wick','wick',[col('wUp'),col('wDn')]],
 ['n','Colors are used for candles / bars. Hollow, Heikin-Ashi and Footprint styles keep their own fill rules.']],
'Status line':[['h','Instrument'],
 ['k','Logo','logo',null,0,1],['k','Title','title',[sel('tmode',[['name','Name'],['ticker','Ticker'],['desc','Description']])]],
 ['k','Open market status','mkt',null,0,1],['k','Chart values','val'],['k','Bar change values','chg'],['k','Volume','volv'],
 ['k','Last day change values','dchg',null,0,1],['k','Buy/sell buttons','bs',null,0,1,'Displays buy and sell buttons directly on the chart'],
 ['h','Indicators'],['k','Titles','itit',null,0,1],['k','Inputs','iinp',null,1,1],['k','Values','ival',null,0,1],['k','Background','ibg',[rng('ibgA')],0,1]],
'Scales and lines':[['h','Price scale'],
 ['r','Currency and Unit',[sel('cur',YN)],1],['r','Scale modes (A and L)',[sel('sb2',YN)]],
 ['k','Lock price to bar ratio','lockR',[{c:'t',k:'lockV'}],0,1],['r','Scales placement',[sel('place',[['auto','Auto'],['left','Left'],['right','Right']])],1],
 ['h','Price labels & lines'],
 ['k','No overlapping labels','nolap',null,0,1],['k','Plus button','plus',null,0,1],['k','Countdown to bar close','cd'],
 ['r','Symbol',[sel('sm',LBL),col('lpC')]],['r','',[sel('sv',[['val','Value according to scale'],['pct','Percentage'],['idx','Indexed to 100']]),{c:'sel2',k:'lpS'}]],
 ['r','Previous day close',[sel('pdc',VAL),col('pdcC')]],['r','Indicators and financials',[sel('iaf',VAL)],1],
 ['r','High and low',[sel('hl',VAL),col('hlU'),col('hlD')]],['r','Bid and ask',[sel('ba',VAL),col('baB'),col('baA')],1],
 ['h','Time scale'],['k','Day of week on labels','dow'],
 ['h','Magnet / margins'],['r','Right margin (bars)',[num('ro',0,100)]]],
'Canvas':[
 ['r','Background',[sel('bgm',[['solid','Solid'],['grad','Gradient']]),col('bg'),{c:'bg2'}]],
 ['k','Vertical grid lines','gv',[col('gvc','gvA')]],['k','Horizontal grid lines','gh',[col('ghc','ghA')]],
 ['r','Pane separators',[col('psep')],1],
 ['r','Crosshair',[col('xc'),sel('xs',[['solid','Solid'],['dotted','Dotted'],['dashed','Dashed'],['ldash','Long dashed']],{min:110}),num('xw',1,4)]],
 ['r','Watermark',[sel('wm',[['hid','Hidden'],['sym','Symbol'],['symtf','Symbol and timeframe']]),col('wmc','wmA')]],
 ['h','Scales'],['r','Text',[col('tx'),num('fs',8,24)]],['r','Lines',[col('ln')]],
 ['h','Buttons'],['r','Navigation',[sel('navb',YN)],1],['r','Pane',[sel('paneb',YN)],1],
 ['h','Margins'],['r','Top',[num('mt',0,40),{c:'u',t:'%'}]],['r','Bottom',[num('mb',0,40),{c:'u',t:'%'}]],['r','Right',[num('ro',0,100),{c:'u',t:'bars'}]],
 ['p','Preset: light gray canvas']],
'Trading':[['n','No broker is connected to this chart yet - these options are saved with your layout and become active when trading is added.'],
 ['k','One-click trading','t1c',null,0,1,'Instantly place, edit, cancel orders, or close positions without confirmation'],
 ['k','Execution sound','tsnd',null,0,1],['k','Show only rejection notifications','trej',null,0,1],
 ['h','Appearance'],['k','Positions and orders','tpos',null,0,1],['k','Reverse position button','trev',null,1,1,'Adds the reverse button next to the open position on the chart'],
 ['k','Project order for market orders','tproj',null,0,1,'Shows a project order on the chart before sending a market order'],
 ['k','Profit and loss value','tpl',null,0,1],['k','Positions','tplP',[sel('tplPu',PV)],1,1],['k','Brackets','tplB',[sel('tplBu',PV)],1,1],
 ['k','Execution marks','texe',null,0,1],['k','Execution labels','texl',null,1,1],
 ['k','Extended price lines across the entire chart width','text',null,0,1],['r','Order and position alignment',[sel('tali',[['right','Right'],['left','Left']])],1],
 ['k','Orders, executions, and positions in chart snapshots','tsnap',null,0,1,'Shows your trades on the chart in snapshots']],
'Alerts':[['h','Alerts'],['k','Alert lines','alln',null,0,1],['k','Alert line labels','allb',null,1,1],['k','Play sound when an alert triggers','asnd',null,0,1],['k','Show popup when an alert triggers','apop',null,0,1]],
'Events':[['h','Events'],['k','Ideas','idea',[sel('ideaw',[['all','All ideas'],['fol','Followed users']])],0,1],
 ['k','Session breaks','sess',[col('sessC'),sel('sessS',LSTY,{min:100})]],
 ['k','Economic events','eco',null,0,1],['k','Only future events','ecoF',null,1,1],['k','Events breaks','ecoB',null,1,1],
 ['k','Latest news','news',null,0,1],['k','News notification','nnot',null,0,1]]};
if(V.ideaw===undefined)V.ideaw='all';

function ctl(x,disabled){const k=x.k,v=V[k];
 if(x.c==='k')return`<input type=checkbox data-k=${k} ${v?'checked':''}>`;
 if(x.c==='s')return`<select data-k=${k}>${x.o.map(o=>`<option value="${o[0]}" ${String(v)===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select>`;
 if(x.c==='sel2')return`<select data-k=${k}>${LSTY.map(o=>`<option value="${o[0]}" ${v===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select>`;
 if(x.c==='c')return`<span class=sw data-sw=${k} ${x.a?`data-a=${x.a}`:''}><i style="background:${x.a?rgba(v,V[x.a]):v}"></i></span>`;
 if(x.c==='bg2')return V.bgm==='grad'?`<span class=sw data-sw=bg2><i style="background:${V.bg2}"></i></span>`:'';
 if(x.c==='n')return`<input type=number data-k=${k} min=${x.mn} max=${x.mx} value="${v}">`;
 if(x.c==='t')return`<input type=text data-k=${k} value="${v}" style="width:104px" ${V.lockR?'':'disabled'}>`;
 if(x.c==='r')return`<input type=range data-k=${k} min=0 max=100 value="${v}">`;
 if(x.c==='u')return`<span style="color:#d1d4dc">${x.t}</span>`;return''}

function pane(tab){return TABS[tab].map(r=>{const t=r[0];
 if(t==='h')return`<div class=hh>${r[1]}</div>`;
 if(t==='n')return`<div class=note>${r[1]}</div>`;
 if(t==='p')return`<div class=rw><button data-p style="background:transparent;border:2px solid #4a4a4a;color:#d1d4dc;border-radius:10px;height:36px;padding:0 16px;cursor:pointer">${r[1]}</button></div>`;
 if(t==='k'){const[,l,k,cs,ind,pv,ds]=r;return`<div class="rw${ind?' in':''}"><label><input type=checkbox data-k=${k} ${V[k]?'checked':''}><span class="${pv?'pv':''}">${l}</span></label><div class=ctl>${(cs||[]).map(x=>ctl(x)).join('')}</div></div>${ds?`<div class="ds${ind?' in':''}">${ds}</div>`:''}`}
 const[,l,cs,pv]=r;return`<div class="rw lbl"><label><span class="${pv?'pv':''}">${l}</span></label><div class=ctl>${cs.map(x=>ctl(x)).join('')}</div></div>`}).join('')}

/* ---------- templates ---------- */
const snapKeys=()=>{const o={};KEYS.forEach(k=>o[k]=V[k]);return o};
function tmplMenu(m,btn){const old=m.querySelector('.tm');if(old){old.remove();return}
 const d=D.createElement('div');d.className='tm';const names=Object.keys(V.tpls);
 d.innerHTML=`<div data-t=save>Save as…</div><hr><div data-t=dark>Default (dark)</div><div data-t=light>Light gray canvas</div>${names.length?'<hr>':''}${names.map(n=>`<div data-t="u:${n}">${n}</div>`).join('')}${names.length?'<hr>':''}${names.map(n=>`<div data-t="d:${n}" style="color:#ef5350">Delete “${n}”</div>`).join('')}`;
 d.onclick=e=>{const t=e.target.dataset.t;if(!t)return;
  if(t==='save'){const n=prompt('Template name');if(n){V.tpls[n.trim()]=snapKeys();save()}}
  else if(t==='dark')Object.assign(V,DEF);else if(t==='light')Object.assign(V,LIGHT);
  else if(t[0]==='u')Object.assign(V,V.tpls[t.slice(2)]);else if(t[0]==='d'){delete V.tpls[t.slice(2)];save()}
  d.remove();applyAll();reRender();m.redraw()};
 m.querySelector('.ft').appendChild(d)}


/* ---------- TradingView-style colour picker (palette + custom "+" picker + opacity) ---------- */
const hex2=n=>n.toString(16).padStart(2,'0');
const h2r=h=>{h=String(h||'#000').replace('#','');if(h.length===3)h=h.replace(/./g,'$&$&');const n=parseInt(h,16)||0;return[n>>16&255,n>>8&255,n&255]};
const r2h=(r,g,b)=>'#'+hex2(r)+hex2(g)+hex2(b);
const mix=(h,t,a)=>{const c=h2r(h);return r2h(...c.map(v=>Math.round(v+(t-v)*a)))};
function hsv2rgb(h,s,v){const f=n=>{const k=(n+h/60)%6;return v-v*s*Math.max(0,Math.min(k,4-k,1))};return[f(5),f(3),f(1)].map(x=>Math.round(x*255))}
function rgb2hsv(r,g,b){r/=255;g/=255;b/=255;const M=Math.max(r,g,b),m=Math.min(r,g,b),d=M-m;let h=0;if(d){h=M===r?((g-b)/d)%6:M===g?(b-r)/d+2:(r-g)/d+4;h*=60;if(h<0)h+=360}return[h,M?d/M:0,M]}
const GRAY=['#ffffff','#dbdbdb','#b2b5be','#9598a1','#787b86','#5d606b','#434651','#2a2e39','#131722','#000000'];
const BRIGHT=['#f23645','#ff9800','#ffeb3b','#4caf50','#089981','#00bcd4','#2962ff','#673ab7','#9c27b0','#e91e63'];
const STEPS=[['#ffffff',.8],['#ffffff',.6],['#ffffff',.4],['#ffffff',.2],['#000000',.15],['#000000',.35],['#000000',.55]];
if(!V.customColors)V.customColors=['#5b7fb5','#9e9e9e','#fff3c4'];
function colorPop(m,sw,setK,redraw){const old=m.querySelector('.cpop');if(old){const same=old.dataset.k===sw.dataset.sw;old.remove();if(same)return}
 const k=sw.dataset.sw,ak=sw.dataset.a;let cur=String(V[k]).toLowerCase();if(/^#[0-9a-f]{3}$/i.test(cur))cur=r2h(...h2r(cur));
 const p=D.createElement('div');p.className='cpop';p.dataset.k=k;m.appendChild(p);
 const place=()=>{const r=sw.getBoundingClientRect(),w=254,h=p.offsetHeight;p.style.left=Math.max(8,Math.min(r.left,innerWidth-w-8))+'px';p.style.top=Math.max(8,Math.min(r.bottom+6,innerHeight-h-8))+'px'};
 const paintSw=()=>{const i=sw.querySelector('i');if(i)i.style.background=ak?rgba(V[k],V[ak]):V[k]};
 const pick=(c,fin)=>{cur=c.toLowerCase();setK(k,cur,fin);paintSw()};
 const palette=()=>{
  const rows=STEPS.map(([t,a])=>BRIGHT.map(c=>mix(c,t==='#ffffff'?255:0,a)));
  const cell=c=>`<div class="c${c.toLowerCase()===cur?' on':''}" data-c="${c}" style="background:${c}" title="${c}"></div>`;
  p.innerHTML=`<div class=g>${GRAY.map(cell).join('')}${BRIGHT.map(cell).join('')}</div><div class=g>${rows.flat().map(cell).join('')}</div><hr>
  <div class=cu>${V.customColors.map(cell).join('')}<span class=pl data-pl title="Add custom colour">+</span></div>
  ${ak?`<div class=op>Opacity</div><div class=or><div class=ob style="--cc:${cur}"><i></i></div><input class=pc type=text value="${V[ak]}%"></div>`:''}`;
  if(ak){const ob=p.querySelector('.ob'),th=ob.querySelector('i'),pc=p.querySelector('.pc'),sh=()=>{th.style.left=V[ak]+'%';pc.value=V[ak]+'%'};sh();
   const mv=e=>{const r=ob.getBoundingClientRect();setK(ak,Math.round(Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*100),0);sh();paintSw()};
   ob.onpointerdown=e=>{ob.setPointerCapture(e.pointerId);mv(e);ob.onpointermove=mv;ob.onpointerup=()=>{ob.onpointermove=null;setK(ak,V[ak],1)}};
   pc.onchange=()=>{const n=Math.max(0,Math.min(100,parseInt(pc.value)||0));setK(ak,n,1);sh();paintSw()}}
  place()};
 const custom=()=>{let[h,s,v]=rgb2hsv(...h2r(cur));
  p.innerHTML=`<div class=hx><span class=sq></span><input type=text spellcheck=false maxlength=7><button>Add</button></div><div class=pk><canvas width=190 height=176></canvas><div class=hue><i></i></div></div>`;
  const cv=p.querySelector('canvas'),g=cv.getContext('2d'),hue=p.querySelector('.hue'),hi=hue.querySelector('i'),sq=p.querySelector('.sq'),ip=p.querySelector('input');
  const sync=(fin,skip)=>{const rgb=hsv2rgb(h,s,v),c=r2h(...rgb);sq.style.background=c;if(!skip)ip.value=c;hi.style.top=h/360*100+'%';hi.style.background=r2h(...hsv2rgb(h,1,1));
   g.clearRect(0,0,190,176);g.fillStyle=r2h(...hsv2rgb(h,1,1));g.fillRect(0,0,190,176);
   let w=g.createLinearGradient(0,0,190,0);w.addColorStop(0,'#fff');w.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=w;g.fillRect(0,0,190,176);
   w=g.createLinearGradient(0,0,0,176);w.addColorStop(0,'rgba(0,0,0,0)');w.addColorStop(1,'#000');g.fillStyle=w;g.fillRect(0,0,190,176);
   const x=s*190,y=(1-v)*176;g.lineWidth=2;g.strokeStyle='#fff';g.beginPath();g.arc(x,y,6,0,7);g.stroke();g.strokeStyle='#0008';g.lineWidth=1;g.beginPath();g.arc(x,y,7.5,0,7);g.stroke();
   pick(c,fin)};
  const sv=e=>{const r=cv.getBoundingClientRect();s=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));v=1-Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));sync(0)};
  const hv=e=>{const r=hue.getBoundingClientRect();h=Math.max(0,Math.min(359.9,(e.clientY-r.top)/r.height*360));sync(0)};
  cv.onpointerdown=e=>{cv.setPointerCapture(e.pointerId);sv(e);cv.onpointermove=sv;cv.onpointerup=()=>{cv.onpointermove=null;sync(1)}};
  hue.onpointerdown=e=>{hue.setPointerCapture(e.pointerId);hv(e);hue.onpointermove=hv;hue.onpointerup=()=>{hue.onpointermove=null;sync(1)}};
  ip.oninput=()=>{let t=ip.value.trim();if(t[0]!=='#')t='#'+t;if(/^#[0-9a-f]{6}$/i.test(t)){[h,s,v]=rgb2hsv(...h2r(t));sync(0,1)}};
  ip.onkeydown=e=>{if(e.key==='Enter')p.querySelector('button').click()};
  p.querySelector('button').onclick=()=>{const c=r2h(...hsv2rgb(h,s,v));if(!V.customColors.includes(c))V.customColors=[c,...V.customColors].slice(0,14);pick(c,1);palette()};
  sync(0);ip.focus();ip.select();place()};
 p.onclick=e=>{const c=e.target.closest('[data-c]');if(c){pick(c.dataset.c,1);palette();return}if(e.target.closest('[data-pl]'))custom()};
 palette()}

window.tvColorPop=colorPop;
/* ---------- open ---------- */
function settings(tab0){D.querySelectorAll('.tvs').forEach(x=>x.remove());const snap=snapKeys();let tab=tab0&&TABS[tab0]?tab0:(window._tvsTab||'Status line');
 const m=D.createElement('div');m.className='tvs';
 m.innerHTML=`<div class=bx><h3>Settings<span data-x>✕</span></h3><div class=bd><div class=nv></div><div class=ct></div></div><div class=ft><button class=tp data-tm>Template <svg width=12 height=8 viewBox="0 0 12 8" fill=none stroke=currentColor stroke-width=1.6><path d="M1 1.5l5 5 5-5"/></svg></button><span class=sp></span><button class=cn data-c>Cancel</button><button class=ok data-o>Ok</button></div></div>`;
 D.body.appendChild(m);const nv=m.querySelector('.nv'),ct=m.querySelector('.ct');
 const draw=()=>{window._tvsTab=tab;nv.innerHTML=Object.keys(TABS).map(t=>`<div class="${t===tab?'on':''}" data-t="${t}" title="${t}">${ICON[t]}${t}</div>`).join('');const y=ct.scrollTop;ct.innerHTML=pane(tab);ct.scrollTop=y};
 m.redraw=draw;draw();
 nv.onclick=e=>{const t=e.target.closest('[data-t]');if(t){tab=t.dataset.t;draw();ct.scrollTop=0}};
 const upd=e=>{const t=e.target,k=t.dataset.k;if(!k)return;
  setK(k,t.type==='checkbox'?+t.checked:t.type==='number'?+t.value:t.type==='range'?+t.value:t.value,e.type==='change')};
 const setK=(k,val,fin)=>{V[k]=val;
  if(k==='bUp'||k==='bDn')V.border=1;
  if(k==='lpC')V.lpMode='custom';
  if(k==='bg'&&fin){const L=lumOf(V.bg)>.55;V.tx=L?'#000000':'#8b91a3';V.xc=L?'#000000':'#758696'}
  applyAll();
  if(k==='vol')reRender();
  if(fin&&(k==='bgm'||k==='lockR'||k==='bg'))draw();
  if(k==='sb2')V.sb=V.sb2};
 ct.oninput=e=>{if(e.target.type==='range')upd(e)};
 ct.onchange=upd;
 ct.onclick=e=>{const sw=e.target.closest('[data-sw]');if(sw){e.stopPropagation();colorPop(m,sw,setK,draw);return}
  if(e.target.dataset.p!=null){Object.assign(V,LIGHT);applyAll();reRender();draw()}};
 m.onmousedown=e=>{if(e.target===m)cancel();const cp=m.querySelector('.cpop');if(cp&&!e.target.closest('.cpop')&&!e.target.closest('[data-sw]'))cp.remove();const tm=m.querySelector('.tm');if(tm&&!e.target.closest('.tm')&&!e.target.closest('[data-tm]'))tm.remove()};
 const cancel=()=>{Object.assign(V,snap);applyAll();reRender();m.remove()};
 m.querySelector('[data-x]').onclick=cancel;m.querySelector('[data-c]').onclick=cancel;
 m.querySelector('[data-tm]').onclick=e=>{e.stopPropagation();tmplMenu(m)};
 m.querySelector('[data-o]').onclick=()=>{save();m.remove()};
 m.onkeydown=e=>{if(e.key==='Escape')cancel()};m.tabIndex=-1;m.focus()}
window.tvSettings=settings;

/* take over every entry point of the old dialog */
window.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#eic button[title="Chart settings"]');if(b){e.stopImmediatePropagation();e.preventDefault();settings()}},true);
const ctx=$('#tvctx');if(ctx)ctx.addEventListener('click',e=>{const d=e.target.closest('[data-i]');if(d&&/^Settings/.test(d.textContent)){e.stopImmediatePropagation();ctx.style.display='none';settings()}},true);

applyAll();
})();
