/* TV Icons - load LAST. Replaces the emoji icons of the top-right toolbar (and mobile bars) with TradingView-style line icons (SVG, no emojis):
   layout, chart name + Save, quick search, settings, fullscreen, snapshot, alerts, screener, account, panel, more. */
(()=>{
const D=document,$=s=>D.querySelector(s);
if(typeof S==='undefined'||!$('#eic'))return;
const V=S.tv=S.tv||{};
const ic=(p,s=26)=>`<svg width="${s}" height="${s}" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const P={
 layout:'<rect x="6" y="6" width="16" height="16" rx="1.5"/>',
 search:'<circle cx="12.5" cy="12.5" r="6"/><path d="M17 17l5 5"/><path d="M13.5 8.5l-2.2 4.2h3.2l-2.2 4.2"/>',
 settings:'<path d="M14 4.5l8 4.6v9.8l-8 4.6-8-4.6V9.1z"/><circle cx="14" cy="14" r="3.2"/>',
 full:'<path d="M6.5 11V6.5H11M17 6.5h4.5V11M21.5 17v4.5H17M11 21.5H6.5V17"/>',
 camera:'<path d="M5.5 10h3.2l1.6-2.5h7.4l1.6 2.5h3.2v11.5h-17z"/><circle cx="14" cy="15.5" r="3.6"/>',
 bell:'<path d="M8 19.5V13.5a6 6 0 0112 0v6l2 2H6z"/><path d="M12 23.5a2 2 0 004 0"/>',
 alarm:'<circle cx="14" cy="15" r="6.8"/><path d="M14 11v4.2l2.8 1.8M5.5 9.5L9 6M22.5 9.5L19 6"/>',
 screener:'<rect x="5.5" y="6.5" width="17" height="15" rx="2"/><path d="M5.5 12h17M12 12v9.5"/>',
 user:'<circle cx="14" cy="10.5" r="4"/><path d="M6 23.5a8 8 0 0116 0"/>',
 panel:'<rect x="5.5" y="6.5" width="17" height="15" rx="2"/><path d="M16.5 6.5v15"/>',
 more:'<circle cx="7" cy="14" r="1.3" fill="currentColor"/><circle cx="14" cy="14" r="1.3" fill="currentColor"/><circle cx="21" cy="14" r="1.3" fill="currentColor"/>',
 swap:'<path d="M7 11h13l-3-3M21 17H8l3 3"/>',
 pencil:'<path d="M7 21l1-4.5L18.5 6a2 2 0 012.8 0l.7.7a2 2 0 010 2.8L11.5 20z"/>',
 magnet:'<path d="M8 21v-7a6 6 0 0112 0v7M8 17h4M16 17h4"/>',
 lock:'<rect x="7" y="13" width="14" height="9" rx="2"/><path d="M10 13V10a4 4 0 018 0v3"/>',
 eye:'<path d="M3.5 14s4-6.5 10.5-6.5S24.5 14 24.5 14 20.5 20.5 14 20.5 3.5 14 3.5 14z"/><circle cx="14" cy="14" r="3"/>',
 trash:'<path d="M7 9h14M11 9V6.5h6V9M9 9l1 13h8l1-13M12 12.5v6M16 12.5v6"/>',
 clock:'<circle cx="14" cy="14" r="8"/><path d="M14 9v5l3.5 2"/>',
 user2:'<circle cx="14" cy="10.5" r="4"/><path d="M6 23.5a8 8 0 0116 0"/>',
 x:'<path d="M8 8l12 12M20 8L8 20"/>',
 plus:'<circle cx="14" cy="14" r="7.5"/><path d="M14 10.5v7M10.5 14h7"/>',
 line:'<path d="M5 19l6-6 4 4 8-9"/>',
 candle:'<path d="M10 6v3M10 17v5M18 5v4M18 18v4"/><rect x="7.5" y="9" width="5" height="8" rx=".8"/><rect x="15.5" y="9" width="5" height="9" rx=".8"/>',
 ind:'<path d="M6 22v-6M11 22V12M16 22v-8M21 22V9"/><path d="M5 12l5-4 5 4 6-6"/>',
 alert:'<circle cx="13" cy="15" r="6.8"/><path d="M13 11v4.2l2.8 1.8M4.5 9.5L8 6M21.5 9.5L18 6"/><path d="M21 17v6M18 20h6"/>',
 replay:'<path d="M13 9l-6 5 6 5zM21 9l-6 5 6 5z"/>',
 undo:'<path d="M8 12h9a5 5 0 010 10h-4M8 12l4-4M8 12l4 4"/>',
 redo:'<path d="M20 12h-9a5 5 0 000 10h4M20 12l-4-4M20 12l-4 4"/>',
 bulb:'<path d="M10 18.5c-2-1.2-3.5-3.3-3.5-6a7.5 7.5 0 0115 0c0 2.7-1.5 4.8-3.5 6v2h-8z"/><path d="M11 23.5h6M12.5 12.5L14 15l1.5-2.5"/>',
 flame:'<path d="M14 4c1 4 5 6 5 11a5 5 0 01-10 0c0-2 1-3.2 2-4 0 2 1 3 2 3 0-4-1-6 1-10z" fill="currentColor" stroke="none"/>',
 goto:'<rect x="5.5" y="7.5" width="17" height="14" rx="2"/><path d="M5.5 12h17M10 5.5v4M18 5.5v4M11 17h6l-2-2M17 17l-2 2"/>',
 chev:'<path d="M10 12l4 4 4-4"/>'
};
window.TVI={ic,P};
const css=D.createElement('style');css.textContent=`
#eic{display:flex;align-items:center;gap:0}
#eic .ib{width:36px!important;height:36px;padding:0!important;display:flex;align-items:center;justify-content:center;background:transparent!important;border:0!important;color:#d1d4dc!important;border-radius:6px!important;cursor:pointer}
#eic .ib:hover{background:#2a2e39!important;color:#fff!important}#eic .ib.on{color:#2962ff!important}
#tvnm{display:flex;align-items:center;gap:2px;margin:0 4px 0 2px}#tvnm .nb{display:flex;flex-direction:column;align-items:center;line-height:1.15;cursor:pointer;padding:2px 6px;border-radius:6px}#tvnm .nb:hover{background:#2a2e39}
#tvnm .nm{font:600 13px system-ui;color:#fff;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#tvnm .sv{font:600 10px system-ui;color:#2962ff}#tvnm .sv.ok{color:#26a69a}
#tvnm .cv2{width:22px;height:30px;padding:0;background:transparent;border:0;color:#9aa0b0;cursor:pointer;border-radius:6px}#tvnm .cv2:hover{background:#2a2e39;color:#fff}
.tvsep{width:1px;height:22px;background:#363a45;margin:0 6px}
.tvpm{position:fixed;z-index:760;background:#1e1e1e;border:1px solid #2a2a2a;border-radius:8px;padding:6px 0;min-width:170px;font:14px system-ui;color:#d1d4dc;box-shadow:0 8px 24px #000a}.tvpm div{padding:9px 16px;cursor:pointer;display:flex;justify-content:space-between;gap:20px}.tvpm div:hover{background:#2a2e39}.tvpm div.on{color:#2962ff}
#etop{background:#000!important;height:46px!important;border-bottom:1px solid #1d1d1d!important;gap:2px!important}
#etop>.brand,#etop #elay,#etop .lbl,#etop #esy,#etop #exh,#etop #edr,#etop #est,#etop #ecust,#etop #etf,#etop #tvsty,#etop #esty select,#etop #erep #rpc,#etop>.sep{display:none!important}
#etop .sbox{width:auto!important;height:32px!important;background:#1e222d!important;border:1px solid #2a2e39!important;border-radius:18px!important;padding:0 8px 0 14px!important;gap:6px!important}
#etop .sbox>span:first-child,#etop .sbox .bd{display:none!important}#etop .sbox input{font:700 14px system-ui!important;color:#fff!important;flex:none!important;cursor:pointer;background:transparent!important}
#etop .sbox .tvsi{display:flex;color:#d1d4dc}
#etop .tvt,#etop #eind,#etop #rp{height:34px!important;min-width:34px;display:inline-flex!important;align-items:center;gap:6px;padding:0 9px!important;border-radius:6px!important;background:transparent!important;border:0!important;color:#d1d4dc!important;font:600 14px system-ui!important;cursor:pointer}
#etop .tvt:hover,#etop #eind:hover,#etop #rp:hover{background:#2a2e39!important;color:#fff!important}#etop .tvt.on{background:#2a2e39!important;color:#fff!important}
#etop #rp.on{background:#fff!important;color:#111!important}#etop #rp svg,#etop #eind svg{pointer-events:none}
#etop #tvtf{font:600 14px system-ui!important;height:34px!important;padding:0 10px!important}
#etop .tvpill{height:30px;padding:0 14px;border-radius:16px;border:1px solid #363a45;background:transparent;color:#fff;font:600 13px system-ui;cursor:pointer;display:inline-flex;align-items:center;gap:6px;margin-left:6px}#etop .tvpill:hover{background:#1e222d}
#etop .tvpill.up{background:#fff;color:#111;border-color:#fff}#etop .tvpill.up:hover{background:#e6e6e6}
#tvbb{display:flex;align-items:center;height:36px;flex:none;background:#000;border-top:1px solid #1d1d1d;padding:0 8px;font:12px system-ui;color:#c9ccd6;gap:4px}
#tvbb #tvrg{position:static!important;left:auto!important;bottom:auto!important;background:none!important;padding:0!important}#tvbb #tvrg button{color:#c9ccd6!important;font:600 12px system-ui;padding:4px 6px}#tvbb #tvrg button:hover{color:#fff!important}
#tvbb .gt{background:none;border:0;color:#c9ccd6;height:28px;width:30px;border-radius:5px;cursor:pointer;display:flex;align-items:center;justify-content:center;border-left:1px solid #2a2e39;margin-left:4px;padding-left:4px}#tvbb .gt:hover{background:#2a2e39;color:#fff}
#tvbb #eclk{margin-left:auto;font:12px system-ui;color:#c9ccd6;cursor:pointer;padding:6px 10px;border-radius:5px;font-variant-numeric:tabular-nums}#tvbb #eclk:hover{background:#2a2e39;color:#fff}
.tvtz{position:fixed;z-index:770;background:#0e0e0e;border:1px solid #2a2a2a;border-radius:8px;max-height:72vh;overflow:auto;min-width:230px;padding:6px 0;font:14px system-ui;color:#d1d4dc;box-shadow:0 8px 28px #000c}.tvtz div{padding:8px 18px 8px 42px;cursor:pointer;position:relative}.tvtz div:hover{background:#1e222d}.tvtz div.on:before{content:'✓';position:absolute;left:18px;color:#2962ff}
@media(max-width:820px){#tvbb{margin-bottom:52px}#etop .tvpill,#etop .sbox .tvsi{display:none!important}}
#tvuser{display:none!important}
#tvmb button svg{width:24px;height:24px}#tvdb button svg{width:22px;height:22px}#tvstep i svg{width:20px;height:20px;vertical-align:middle}#tvuser svg{width:15px;height:15px;vertical-align:-3px}`;D.head.appendChild(css);

/* tiny popup menu */
let pm=null;const closePm=()=>{if(pm){pm.remove();pm=null}};
D.addEventListener('mousedown',e=>{if(pm&&!pm.contains(e.target)&&!(e.target.closest&&e.target.closest('[data-pm]')))closePm()},true);
function menu(btn,items,right){closePm();pm=D.createElement('div');pm.className='tvpm';pm.innerHTML=items.map((x,i)=>x.sep?'<hr style="border:0;border-top:1px solid #2a2a2a;margin:5px 0">':`<div class="${x.on?'on':''}" data-i="${i}"><span style="white-space:pre">${x.l}</span><span style="color:#6b7080">${x.s||''}</span></div>`).join('');
 pm.onclick=e=>{const d=e.target.closest('[data-i]');if(!d)return;const f=items[+d.dataset.i].f;closePm();f&&f()};D.body.appendChild(pm);
 const r=btn.getBoundingClientRect();pm.style.top=r.bottom+4+'px';pm.style.left=Math.max(4,Math.min(innerWidth-pm.offsetWidth-4,right?r.right-pm.offsetWidth:r.left))+'px'}
const say=m=>window.toast&&toast(m);

/* ---- right cluster ---- */
const bar=$('#eic'),sd=n=>D.body.classList.contains('nosd');
const B=(k,t,f,extra='')=>({k,t,f,extra});
const ck=(el)=>el&&el.classList.contains('on');
const toolsItems=()=>[
 {l:'Screener',f:()=>window.tvScreener&&tvScreener()},{l:'Alerts list',f:()=>{if(sd())D.body.classList.remove('nosd');const b=$('#ta');b&&b.click()}},
 {l:'Forex panel',f:()=>{const b=[...D.querySelectorAll('#top button')].find(x=>/Forex/.test(x.textContent));b&&b.click()}},
 {l:'Show / hide watchlist panel',f:()=>{const h=$('#tvsd');if(h)h.click();else D.body.classList.toggle('nosd')}},
 {l:'More controls (bridge URL, custom TF…)',f:()=>{D.body.classList.toggle('more');dispatchEvent(new Event('resize'))}}];
const buttons=[
 B('layout','Layout & sync',function(){const cur=($('#lay')||{}).value,t=(id,l)=>({l:(ck($(id))?'✓  ':'     ')+l,f:()=>$(id)&&$(id).click()});
  menu(this,[...[1,2,3,4,5,6,7,8].map(n=>({l:(String(n)===cur?'✓  ':'     ')+(n===1?'1 chart':n+' charts'),f:()=>{const s=$('#lay');if(s){s.value=n;s.dispatchEvent(new Event('change',{bubbles:true}))}}})),{sep:1},t('#esy','Sync symbol'),t('#exh','Sync crosshair'),t('#edr','Show drawings on all charts')])}),
 'NAME','SEP',
 B('search','Quick search (symbol)',()=>{const s=$('#esym');s&&s.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true}))}),
 B('settings','Chart settings',()=>window.tvSettings&&tvSettings()),
 B('full','Fullscreen',()=>{D.fullscreenElement?D.exitFullscreen():D.documentElement.requestFullscreen&&D.documentElement.requestFullscreen()}),
 B('camera','Screenshot',()=>{}),
 B('bulb','Screener, alerts & panels',function(){menu(this,toolsItems(),1)}),
 'TRADE','UPGRADE'
];
bar.onclick=null;bar.innerHTML='';
buttons.forEach(b=>{
 if(b==='SEP'){const s=D.createElement('span');s.className='tvsep';bar.appendChild(s);return}
 if(b==='TRADE'||b==='UPGRADE'){const e=D.createElement('button');e.className=b==='TRADE'?'tvpill':'tvpill up';e.dataset.pm='1';e.innerHTML=b==='TRADE'?'Trade':ic(P.flame,16)+' Upgrade';e.title=b==='TRADE'?'Open the Screener':'Account / cloud sync';
  e.onclick=ev=>{ev.stopPropagation();if(b==='TRADE'){window.tvScreener&&tvScreener()}else{const u=$('#tvuser');if(u)menu(e,[{l:u.textContent.trim(),f:()=>{}},{l:'Log out',f:()=>u.click()}],1);else say('Login is not enabled')}};bar.appendChild(e);return}
 if(b==='NAME'){const w=D.createElement('span');w.id='tvnm';w.innerHTML='<span class="nb" data-pm="1"><span class="nm"></span><span class="sv">Save</span></span><button class="cv2" data-pm="1" title="Chart options">⌄</button>';bar.appendChild(w);return}
 const e=D.createElement('button');e.className='ib';e.title=b.t;e.innerHTML=ic(P[b.k]);e.dataset.pm='1';e.addEventListener('click',ev=>{ev.stopPropagation();b.f.call(e,ev)});bar.appendChild(e)});

/* chart name + Save (saves layout/drawings to this browser and, when logged in, to your cloud account) */
const nm=$('#tvnm .nm'),sv=$('#tvnm .sv'),nb=$('#tvnm .nb');
const setName=()=>{nm.textContent=V.cname||'Unnamed'};setName();
const doSave=()=>{try{save()}catch(e){}try{const r=localStorage.getItem('mcp');if(r)localStorage.setItem('mcp',r)}catch(e){}sv.textContent='Saved';sv.classList.add('ok');say('Saved');setTimeout(()=>{sv.textContent='Save';sv.classList.remove('ok')},2000)};
const rename=()=>{const n=prompt('Chart name',V.cname||'Unnamed');if(n!=null){V.cname=n.trim()||'Unnamed';save();setName()}};
sv.onclick=e=>{e.stopPropagation();doSave()};nm.onclick=rename;
$('#tvnm .cv2').onclick=function(e){e.stopPropagation();menu(this,[{l:'Save',s:'',f:doSave},{l:'Rename…',f:rename}])};


/* ---- left cluster like TradingView: symbol pill, (+), timeframe, chart type icons, Indicators, Alert, Replay, undo / redo ---- */
const top=$('#etop'),sepE=()=>{const x=D.createElement('span');x.className='tvsep';return x};
top.querySelectorAll(':scope>.sep').forEach(x=>x.remove());
const sb=top.querySelector('.sbox'),tf=$('#tvtf'),esty=$('#esty'),eind=$('#eind'),erep=$('#erep'),sel=$('#sty');
if(sb&&!sb.querySelector('.tvsi')){const i=D.createElement('span');i.className='tvsi';i.innerHTML=ic(P.candle,22);sb.appendChild(i)}
const plus=D.createElement('button');plus.className='tvt';plus.title='Add symbol to watchlist';plus.innerHTML=ic(P.plus,26);plus.onclick=()=>{const b=$('#tvwa');b?b.click():say('Watchlist add is not available')};
if(sb)sb.after(plus,sepE());
if(tf)tf.after(sepE());
if(esty&&eind){eind.before(esty);esty.after(sepE())}
const tb=(k,t,f)=>{const b=D.createElement('button');b.className='tvt';b.title=t;b.innerHTML=ic(P[k],26);b.onclick=f;return b};
const bLine=tb('line','Line',()=>{act.setStyle('line');sel.value='line'}),bCan=tb('candle','Candles',()=>{act.setStyle(V.lastCandle||'candles');sel.value=V.lastCandle||'candles'}),
 bChev=tb('chev','Chart type',function(){const it=[];[...sel.children].forEach((g,gi)=>{if(gi)it.push({sep:1});(g.tagName==='OPTGROUP'?[...g.children]:[g]).forEach(o=>it.push({l:(o.value===act.style?'✓  ':'     ')+o.textContent,f:()=>{act.setStyle(o.value);sel.value=o.value;if(o.value!=='line')V.lastCandle=o.value}}))});menu(this,it)});
bChev.style.minWidth='22px';bChev.style.padding='0 2px';bChev.dataset.pm='1';
if(esty)esty.prepend(bLine,bCan,bChev);
if(eind){eind.innerHTML=ic(P.ind,26)+'<span>Indicators</span>'+ic(P.chev,16);eind.after(sepE())}
const bAlert=tb('alert','Price alert (Alt+A)',()=>window.tvAlert&&tvAlert());bAlert.insertAdjacentHTML('beforeend','<span>Alert</span>');
if(eind)eind.nextSibling.after(bAlert);
const rp=$('#rp');if(rp){rp.innerHTML=ic(P.replay,22)+'<span>Replay</span>';rp.title='Bar replay'}
if(erep)erep.after(sepE());
const key=(k,c)=>D.dispatchEvent(new KeyboardEvent('keydown',{key:k,ctrlKey:true,bubbles:true,cancelable:true}));
const bUn=tb('undo','Undo (Ctrl+Z)',()=>key('z')),bRe=tb('redo','Redo (Ctrl+Y)',()=>key('y'));bUn.style.opacity=bRe.style.opacity='.7';
erep&&erep.nextSibling.after(bUn,bRe);
setInterval(()=>{const c=(typeof act!=='undefined'&&act)||null;if(!c)return;bLine.classList.toggle('on',c.style==='line');bCan.classList.toggle('on',c.style!=='line');if(c.style!=='line')V.lastCandle=c.style},400);

/* symbol pill width follows the text */
const mc=D.createElement('canvas').getContext('2d');
setInterval(()=>{const i=$('#esym');if(!i||D.activeElement===i)return;mc.font='700 14px system-ui';i.style.width=Math.ceil(mc.measureText(i.value||'Symbol').width)+10+'px'},500);

/* ---- bottom bar: ranges, go-to-date, clock + time zone menu (like TradingView) ---- */
const bb=D.createElement('div');bb.id='tvbb';D.body.appendChild(bb);
const rg=$('#tvrg');if(rg)bb.appendChild(rg);
const gt=D.createElement('button');gt.className='gt';gt.title='Go to date';gt.innerHTML=ic(P.goto,22);bb.appendChild(gt);
const di=D.createElement('input');di.type='datetime-local';di.style.cssText='position:absolute;opacity:0;width:0;height:0;pointer-events:none';bb.appendChild(di);
gt.onclick=()=>{try{di.showPicker()}catch(e){di.focus();di.click()}};
di.onchange=()=>{const c=(typeof act!=='undefined'&&act)||null;if(!c||!di.value)return;const ts=new Date(di.value).getTime()/1000,a=c.view();let i=a.findIndex(b=>b.time>=ts);if(i<0)i=a.length-1;try{c.c.timeScale().setVisibleLogicalRange({from:i-45,to:i+45})}catch(e){}};
const clk=$('#eclk');if(clk){bb.appendChild(clk);clk.title='Time zone'}
const ZONES=['Pacific/Honolulu','America/Anchorage','America/Juneau','America/Los_Angeles','America/Vancouver','America/Denver','America/Phoenix','America/Chicago','America/Mexico_City','America/El_Salvador','America/Bogota','America/Lima','America/New_York','America/Toronto','America/Caracas','America/Halifax','America/Argentina/Buenos_Aires','America/Santiago','America/Sao_Paulo','Atlantic/Azores','Europe/Dublin','Europe/Lisbon','Europe/London','Atlantic/Reykjavik','Europe/Amsterdam','Europe/Belgrade','Europe/Berlin','Europe/Bratislava','Europe/Brussels','Europe/Budapest','Europe/Copenhagen','Europe/Madrid','Europe/Oslo','Europe/Paris','Europe/Prague','Europe/Rome','Europe/Stockholm','Europe/Vienna','Europe/Warsaw','Europe/Zurich','Europe/Athens','Europe/Helsinki','Europe/Istanbul','Europe/Kiev','Africa/Cairo','Africa/Johannesburg','Asia/Jerusalem','Asia/Riyadh','Europe/Moscow','Asia/Dubai','Asia/Karachi','Asia/Colombo','Asia/Kolkata','Asia/Kathmandu','Asia/Dhaka','Asia/Bangkok','Asia/Jakarta','Asia/Singapore','Asia/Hong_Kong','Asia/Shanghai','Asia/Taipei','Asia/Seoul','Asia/Tokyo','Australia/Perth','Australia/Sydney','Pacific/Auckland'];
const offOf=z=>{try{const v=new Intl.DateTimeFormat('en-US',{timeZone:z,timeZoneName:'longOffset'}).formatToParts(new Date()).find(x=>x.type==='timeZoneName').value,m=/GMT([+-])(\d\d):?(\d\d)?/.exec(v);return m?(m[1]==='-'?-1:1)*(+m[2]*60+(+m[3]||0)):0}catch(e){return 0}};
const lab=z=>{const o=offOf(z),a=Math.abs(o),h=Math.floor(a/60),m=a%60,city=z.split('/').pop().replace(/_/g,' ');return`(UTC${o===0?'':(o<0?'-':'+')+h+(m?':'+String(m).padStart(2,'0'):'')}) ${city}`};
const zl=ZONES.map(z=>({z,o:offOf(z),l:lab(z)})).sort((a,b)=>a.o-b.o||a.l.localeCompare(b.l));
let tzm=null;const closeTz=()=>{if(tzm){tzm.remove();tzm=null}};
D.addEventListener('mousedown',e=>{if(tzm&&!tzm.contains(e.target)&&e.target!==clk)closeTz()},true);
function setTz(z){S.tz=z||'';save();charts.forEach(applyTz)}
if(clk)clk.onclick=()=>{if(tzm){closeTz();return}tzm=D.createElement('div');tzm.className='tvtz';const cur=S.tz||'';
 tzm.innerHTML=[`<div data-z="UTC" class="${cur==='UTC'?'on':''}">UTC</div>`,`<div data-z="UTC" data-x="1">Exchange</div>`,`<div data-z="" class="${cur===''?'on':''}">Browser (${lab(Intl.DateTimeFormat().resolvedOptions().timeZone)})</div>`,...zl.map(x=>`<div data-z="${x.z}" class="${cur===x.z?'on':''}">${x.l}</div>`)].join('');
 tzm.onclick=e=>{const d=e.target.closest('[data-z]');if(!d)return;setTz(d.dataset.z);closeTz()};D.body.appendChild(tzm);
 const r=clk.getBoundingClientRect();tzm.style.right=Math.max(4,innerWidth-r.right)+'px';tzm.style.bottom=(innerHeight-r.top+4)+'px';const on=tzm.querySelector('.on');on&&on.scrollIntoView({block:'center'})};
/* charts show time in the selected zone (axis ticks + crosshair label) */
const fcache={};const F=(z,o)=>{const k=z+JSON.stringify(o);return fcache[k]||(fcache[k]=new Intl.DateTimeFormat('en-GB',{timeZone:z||undefined,...o}))};
function applyTz(c){if(!c||!c.c)return;const z=S.tz||'';c._tzk=z;
 const tfm=t=>{if(typeof t!=='number')return String(t&&t.day?`${t.year}-${t.month}-${t.day}`:t);const d=new Date(t*1000),p=o=>F(z,o).format(d);return`${p({weekday:'short'})} ${p({day:'2-digit'})} ${p({month:'short'})} '${p({year:'2-digit'})}  ${p({hour:'2-digit',minute:'2-digit',hourCycle:'h23'})}`};
 const tick=(t,type)=>{if(typeof t!=='number')return null;const d=new Date(t*1000),p=o=>F(z,o).format(d);return type===0?p({year:'numeric'}):type===1?p({month:'short'}):type===2?p({day:'numeric'}):p({hour:'2-digit',minute:'2-digit',hourCycle:'h23'})};
 try{c.c.applyOptions({localization:{timeFormatter:tfm},timeScale:{tickMarkFormatter:tick}})}catch(e){}}
setInterval(()=>charts.forEach(c=>{if(c.c&&c._tzk!==(S.tz||''))applyTz(c)}),700);

/* ---- always-visible right icon strip (TradingView style) ---- */
const R={
 watch:'<path d="M9 6.5h10a1.5 1.5 0 011.5 1.5v14.5l-6.5-4.5-6.5 4.5V8A1.5 1.5 0 019 6.5z"/>',
 layers:'<path d="M14 6l9 5-9 5-9-5zM5 15l9 5 9-5"/>',
 spark:'<path d="M14 4.5c.9 5.3 3.7 8.1 9.5 9.5-5.800 1.400-8.600 4.200-9.500 9.500-.9-5.300-3.700-8.100-9.500-9.500 5.800-1.400 8.600-4.200 9.500-9.500z"/>',
 radar:'<circle cx="14" cy="14" r="9"/><circle cx="14" cy="14" r="3.5"/><path d="M14 14l6.500-6.500"/>',
 mount:'<path d="M4.500 21.500l7-12 4.500 7.500 2.500-3.500 5 8z"/><path d="M9 14.500l2.500-3.500"/>',
 cal:'<rect x="5.500" y="7" width="17" height="15" rx="2"/><path d="M5.500 12h17M10 5v4M18 5v4"/><rect x="9" y="15.500" width="3.500" height="3.500" rx=".5"/>',
 rss:'<path d="M6 9c8.500 0 14 5.500 14 14M6 14.500c5.500 0 8.500 3 8.500 8.500"/><circle cx="7" cy="21.500" r="1.400" fill="currentColor"/>',
 chat:'<path d="M5 7.500h13v9.500h-7l-4 3.500V17H5z"/><path d="M20.500 11h2.500v9h-2v3l-4-3H12.500"/>',
 help:'<circle cx="14" cy="14" r="9"/><path d="M11.500 11.500a2.600 2.600 0 114.200 2c-1.100.700-1.700 1.400-1.700 2.700"/><circle cx="14" cy="19.500" r=".9" fill="currentColor"/>'
};
const rs=D.createElement('div');rs.id='tvrs';
const dots='<svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor">'+[5,11,17].flatMap(x=>[5,11,17].map(y=>`<circle cx="${x}" cy="${y}" r="1.700"/>`)).join('')+'</svg>';
const sc=D.createElement('style');sc.textContent=`#tvrs{flex:none;width:50px;background:#000;border-left:1px solid #1d1d1d;display:flex;flex-direction:column;align-items:center;padding:8px 0;gap:6px;z-index:5}
#tvrs .g{display:flex;flex-direction:column;gap:6px;align-items:center}#tvrs .sp{flex:1}
#tvrs button{width:42px;height:42px;border:0;border-radius:9px;background:transparent;color:#d1d4dc;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}
#tvrs button:hover{background:#1e222d;color:#fff}#tvrs button.on{background:#2a2e39;color:#fff}
#tvrs button.pr{background:#fff;color:#111;border-radius:50%;width:40px;height:40px}#tvrs button.pr:hover{background:#e6e6e6}
#tvrs hr{width:30px;border:0;border-top:1px solid #2a2e39;margin:6px 0}
@media(max-width:820px){#tvrs{display:none}}`;D.head.appendChild(sc);
const showSide=()=>{if(sd())D.body.classList.remove('nosd')};
const acct=function(){const u=$('#tvuser');if(!u){say('Login is not enabled');return}menu(this,[{l:u.textContent.trim(),f:()=>{}},{l:'Log out',f:()=>u.click()}],1)};
const keys=[['Alt + T / H / J / V / C','Trendline / Horizontal line / Horizontal ray / Vertical line / Crossline'],['Alt + F','Fib retracement'],['Shift + Alt + R','Rectangle'],['Alt + A','Create alert'],['Alt + R','Reset chart view'],['Ctrl + Alt + H','Hide all drawings'],['Ctrl + C / V','Copy / paste drawing'],['Ctrl + Z / Y','Undo / redo'],['Ctrl + D  or  Ctrl + Drag','Clone drawing'],['Ctrl + Click','Select several drawings'],['Del / Backspace / wheel click','Remove drawing'],['Arrow keys','Move selected drawing'],['Shift + Drag','Move horizontally / vertically'],['Shift (drawing)','Square, circle, 45° line'],['Shift + Click','Measure'],['Ctrl (moving a point)','Toggle magnet'],['Hold Alt','Demonstration cursor'],['Ctrl + Alt + S','Download image'],['Ctrl + Shift + S','Copy image'],['Esc','Cancel tool']];
const help=()=>{const m=D.createElement('div');m.style.cssText='position:fixed;inset:0;z-index:800;background:#0008;display:flex;align-items:center;justify-content:center;font:14px system-ui;color:#d1d4dc';
 m.innerHTML=`<div style="background:#141414;border:1px solid #2a2a2a;border-radius:12px;width:640px;max-width:94vw;max-height:84vh;display:flex;flex-direction:column;box-shadow:0 14px 50px #000"><div style="display:flex;justify-content:space-between;padding:20px 24px 10px;font:600 20px system-ui;color:#fff">Keyboard shortcuts<span data-x style="cursor:pointer;color:#9aa0b0">✕</span></div><div style="overflow:auto;padding:4px 24px 20px">${keys.map(k=>`<div style="display:grid;grid-template-columns:230px 1fr;gap:12px;padding:8px 0;border-bottom:1px solid #1d1d1d"><b style="color:#fff;font-weight:600">${k[0]}</b><span>${k[1]}</span></div>`).join('')}</div></div>`;
 m.onmousedown=e=>{if(e.target===m||e.target.dataset.x!=null)m.remove()};D.body.appendChild(m)};
const RB=(k,t,f,svgp,cls)=>({k,t,f,svg:svgp,cls});
const strip=[
 [RB('watch','Watchlist',()=>{const b=$('#tw');if(sd())D.body.classList.remove('nosd');else if(b&&b.classList.contains('on')){D.body.classList.add('nosd');return}b&&b.click()},ic(R.watch)),
  RB('alarm','Alerts',()=>{showSide();const b=$('#ta');b&&b.click()},ic(P.alarm)),
  RB('layers','Object tree',()=>window.tvObjTree&&tvObjTree(),ic(R.layers))],
 [RB('spark','Indicators',()=>{const b=$('#eind');b&&b.click()},ic(R.spark)),
  RB('radar','Screener',()=>window.tvScreener&&tvScreener(),ic(R.radar)),
  RB('mount','Volume footprint',()=>{act.setStyle('footprint');sel.value='footprint'},ic(R.mount)),
  RB('cal','Go to date',()=>{const g=$('#tvbb .gt');g&&g.click()},ic(R.cal)),
  RB('rss','News',()=>{showSide();const b=$('#tn');b&&b.click()},ic(R.rss)),
  RB('bell','Create price alert',()=>window.tvAlert&&tvAlert(),ic(P.bell)),
  RB('chat','Account',acct,ic(R.chat)),
  RB('prod','Tools & panels',function(){menu(this,toolsItems(),1)},dots,'pr')],
 [RB('help','Keyboard shortcuts',help,ic(R.help))]];
strip.forEach((grp,gi)=>{if(gi===1){const sp=D.createElement('div');sp.className='sp';rs.appendChild(sp)}if(gi===2){rs.appendChild(D.createElement('hr'))}
 const g=D.createElement('div');g.className='g';grp.forEach(b=>{const e=D.createElement('button');if(b.cls)e.className=b.cls;e.title=b.t;e.dataset.k=b.k;e.dataset.pm='1';e.innerHTML=b.svg;e.onclick=ev=>{ev.stopPropagation();b.f.call(e,ev)};g.appendChild(e)});rs.appendChild(g)});
const mainEl=$('#main');if(mainEl)mainEl.appendChild(rs);
setInterval(()=>{const w=rs.querySelector('[data-k=watch]');if(w)w.classList.toggle('on',!sd())},400);
/* ---- emoji -> svg on the mobile bars / chips (they are created by tv-mobile.js / tv-auth.js) ---- */
function swapMobile(){
 const mb=$('#tvmb');if(mb&&!mb.dataset.sv){mb.dataset.sv=1;const m={tools:'pencil',sym:'search',tf:'clock',scr:'screener',panel:'panel'};mb.querySelectorAll('button').forEach(b=>{const s=b.querySelector('span');if(s&&m[b.dataset.a])s.innerHTML=ic(P[m[b.dataset.a]],24)})}
 const db=$('#tvdb');if(db&&!db.dataset.sv){db.dataset.sv=1;const m={x:'x',mag:'magnet',lock:'lock',hide:'eye',full:'full'};db.querySelectorAll('button').forEach(b=>{if(m[b.dataset.a])b.innerHTML=ic(P[m[b.dataset.a]],22)})}
 const st=$('#tvstep i');if(st&&!st.dataset.sv){st.dataset.sv=1;st.innerHTML=ic(P.trash,22)}
 const u=$('#tvuser');if(u&&!u.dataset.sv&&u.textContent.includes('👤')){u.dataset.sv=1;u.innerHTML=ic(P.user,16)+' '+u.textContent.replace('👤','').trim()}}
setInterval(swapMobile,700);swapMobile();
})();
