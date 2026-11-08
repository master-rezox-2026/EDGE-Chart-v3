/* TV Drawbar - load LAST. (1) Re-skins the floating bar of a selected drawing like TradingView:
   [⋮⋮ drag] [object tree] [✎ line color] [T text color] [— fill] [1px] [— style] [⬡ settings] [⏰ alert] [🔓 lock] [🗑] [•••]
   The 6-dot grip moves the panel (position is remembered, double-click grip = reset).  (2) Opens on Candles, not Footprint. */
(()=>{
const D=document,$=s=>D.querySelector(s);
if(typeof S==='undefined'||typeof charts==='undefined')return;
const V=S.tv=S.tv||{};
const css=D.createElement('style');css.textContent=`
#dpft{background:#1c1c1c!important;border:1px solid #2d2d2d!important;border-radius:10px!important;padding:6px 10px!important;gap:6px!important;max-width:96vw;overflow:visible!important;box-shadow:0 6px 24px #000a!important}
#dpft.mv{left:var(--fx)!important;top:var(--fy)!important;transform:none!important}
#dpft>*:not(.nb){display:none!important}
#dpft .nb{display:flex;align-items:center;gap:6px;color:#e6e6e6}
#dpft .nb button{all:unset;box-sizing:border-box;height:34px;min-width:34px;padding:0 6px;border-radius:7px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;color:#e6e6e6;font:600 14px system-ui}
#dpft .nb button:hover{background:#2c2c2c}#dpft .nb button.dis{opacity:.3;pointer-events:none}
#dpft .nb svg{width:22px;height:22px;display:block}
#dpft .nb u{display:block;width:22px;height:3px;border-radius:1px;text-decoration:none}
#dpft .nb .gp{width:18px;height:34px;display:flex;align-items:center;justify-content:center;cursor:grab;color:#7d7d7d;touch-action:none;flex:none}#dpft .nb .gp:active{cursor:grabbing}#dpft .nb .gp:hover{color:#fff}
#dpft .nb .ln{width:24px;border-top:3px solid #fff;display:block}
#dpft .nb b{font:700 19px Georgia,serif;line-height:19px}
.dbm{position:fixed;z-index:900;background:#1c1c1c;border:1px solid #2d2d2d;border-radius:10px;padding:6px 0;box-shadow:0 10px 30px #000;font:14px system-ui;color:#e6e6e6;min-width:150px;max-height:60vh;overflow:auto}
.dbm div{padding:9px 16px;cursor:pointer;display:flex;align-items:center;gap:12px;white-space:nowrap}.dbm div:hover{background:#2c2c2c}.dbm div.on{background:#2c2c2c;font-weight:700}
.dbm i{display:block;width:48px;border-top:3px solid #fff}.dbm small{color:#868993}
body>.cpop{z-index:910}
#dpfav{background:#0d0d0d!important;border:1px solid #1f1f1f!important;border-radius:10px!important;padding:6px 10px!important;gap:4px!important;box-shadow:0 8px 28px #000c!important}
#dpfav button{width:38px!important;height:34px!important;border-radius:7px!important;color:#e6e6e6!important}#dpfav button:hover{background:#262626!important}
#dpfav button svg{width:26px;height:26px}#dpfav .dpgrip{width:18px!important;color:#6b6b6b!important}`;D.head.appendChild(css);

const ic=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const IC={tree:ic('<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><path d="M17 13.5v7M13.5 17h7"/>'),
 pen:ic('<path d="M4 20l1-4L16.5 4.5a2 2 0 013 3L8 19z"/><path d="M14 7l3 3"/>'),
 set:ic('<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><circle cx="12" cy="12" r="3"/>'),
 al:ic('<circle cx="12" cy="13" r="7"/><path d="M12 9v4l2.5 2M5 5L3 7M19 5l2 2"/>'),
 un:ic('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 017.5-2"/>'),lk:ic('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>'),
 del:ic('<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13M10 11v6M14 11v6"/>'),more:ic('<circle cx="5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="19" cy="12" r="1.2" fill="currentColor"/>')};
const DOTS='<svg width="12" height="20" viewBox="0 0 12 20" fill="currentColor"><circle cx="3" cy="4" r="1.6"/><circle cx="9" cy="4" r="1.6"/><circle cx="3" cy="10" r="1.6"/><circle cx="9" cy="10" r="1.6"/><circle cx="3" cy="16" r="1.6"/><circle cx="9" cy="16" r="1.6"/></svg>';
const hexOk=c=>/^#[0-9a-f]{6}$/i.test(c||'')?c:null;
const WS=[1,2,3,4,6,8,12,16,24],LSN=['Solid','Dashed','Dotted'];

let menu=null;const closeMenu=()=>{if(menu){menu.remove();menu=null}D.querySelectorAll('body>.cpop').forEach(x=>x.remove())};
D.addEventListener('mousedown',e=>{if(menu&&!menu.contains(e.target))closeMenu();if(!e.target.closest('.cpop')&&!e.target.closest('#dpft'))D.querySelectorAll('body>.cpop').forEach(x=>x.remove())},true);
function popMenu(btn,items){closeMenu();const m=menu=D.createElement('div');m.className='dbm';
 m.innerHTML=items.map((it,i)=>`<div data-i=${i} class="${it.on?'on':''}">${it.h}</div>`).join('');D.body.appendChild(m);
 const r=btn.getBoundingClientRect();m.style.left=Math.max(6,Math.min(r.left,innerWidth-m.offsetWidth-6))+'px';m.style.top=Math.min(r.bottom+6,innerHeight-m.offsetHeight-6)+'px';
 m.onclick=e=>{const d=e.target.closest('[data-i]');if(!d)return;const it=items[+d.dataset.i];closeMenu();it.f&&it.f()}}

function skin(ft){if(ft.querySelector('.nb'))return;const o=window.DPX&&DPX.selo();if(!o)return;
 const nb=D.createElement('div');nb.className='nb';
 nb.innerHTML=`<span class=gp title="Drag to move · double-click to reset">${DOTS}</span>
 <button data-b=tree title="Object tree">${IC.tree}</button>
 <button data-b=pen title="Line / border color">${IC.pen}<u data-u=col></u></button>
 <button data-b=txt title="Text color"><b>T</b><u data-u=tc></u></button>
 <button data-b=fill title="Fill / background color"><span class=ln data-u=fill></span></button>
 <button data-b=w title="Thickness"></button>
 <button data-b=ls title="Line style"><span class=ln></span></button>
 <button data-b=set title="Settings">${IC.set}</button>
 <button data-b=al title="Add alert">${IC.al}</button>
 <button data-b=lock></button><button data-b=del title="Delete">${IC.del}</button><button data-b=more title="More">${IC.more}</button>
 <input type=color data-q=tc style="display:none">`;
 ft.prepend(nb);paint(ft)}
function paint(ft){const nb=ft.querySelector('.nb'),o=window.DPX&&DPX.selo();if(!nb||!o)return;
 const col=hexOk(o.col)||'#e6b422',tc=hexOk(o.tc)||'#d1d4dc',fill=hexOk(o.fill||o.col)||col,hasFill=!!ft.querySelector('[data-q=fill]');
 nb.querySelector('[data-u=col]').style.background=col;nb.querySelector('[data-u=tc]').style.background=tc;
 const f=nb.querySelector('[data-u=fill]');f.style.borderTopColor=fill;nb.querySelector('[data-b=fill]').classList.toggle('dis',!hasFill);
 nb.querySelector('[data-b=w]').textContent=(o.w||1)+'px';
 const l=nb.querySelector('[data-b=ls] .ln');l.style.borderTopStyle=['solid','dashed','dotted'][+o.ls||0];
 nb.querySelector('[data-b=lock]').innerHTML=o.lk?IC.lk:IC.un;nb.querySelector('[data-b=lock]').title=o.lk?'Unlock':'Lock';
 nb.querySelector('input[data-q=tc]').value=tc}
const fire=(el,v)=>{if(!el)return;el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))};
function colorFor(ft,btn,q,cur){V.__dpc=cur;btn.dataset.sw='__dpc';
 window.tvColorPop&&tvColorPop(D.body,btn,(k,val)=>{V.__dpc=val;fire(ft.querySelector(`[data-q=${q}]`),val);paint(ft)},()=>{})}
function wire(ft){const nb=ft.querySelector('.nb');if(!nb||nb._w)return;nb._w=1;
 const orig=a=>ft.querySelector(`button[data-a=${a}]`);
 nb.onclick=e=>{const b=e.target.closest('button[data-b]');if(!b)return;const o=window.DPX&&DPX.selo();if(!o)return;const k=b.dataset.b;
  if(k==='pen')colorFor(ft,b,'col',hexOk(o.col)||'#e6b422');
  else if(k==='txt')colorFor(ft,b,'tc',hexOk(o.tc)||'#d1d4dc');
  else if(k==='fill')colorFor(ft,b,'fill',hexOk(o.fill||o.col)||'#e6b422');
  else if(k==='w')popMenu(b,WS.map(n=>({h:`<i style="border-top-width:${Math.min(n,10)}px"></i>${n}px`,on:(o.w||1)===n,f:()=>{fire(ft.querySelector('[data-q=w]'),n);paint(ft)}})));
  else if(k==='ls')popMenu(b,LSN.map((n,i)=>({h:`<i style="border-top-style:${['solid','dashed','dotted'][i]}"></i>${n}`,on:(+o.ls||0)===i,f:()=>{fire(ft.querySelector('[data-q=ls]'),i);paint(ft)}})));
  else if(k==='set'){const x=orig('set');x&&x.click()}
  else if(k==='lock'){const x=orig('lock');x&&x.click()}
  else if(k==='del'){const x=orig('del');x&&x.click()}
  else if(k==='al'){const p=o.p&&o.p[0]?o.p[0].p:undefined;window.tvAlert&&tvAlert(p)}
  else if(k==='more')popMenu(b,[{h:'Clone',f:()=>{const x=orig('clone');x&&x.click()}},{h:'Text…',f:()=>{const x=orig('text');x&&x.click()}},{h:'Settings…',f:()=>{const x=orig('set');x&&x.click()}}]);
  else if(k==='tree'){const L=(S.dp&&S.dp[(typeof actChart==='function'?0:0,(window.act||charts[0]).cfg.sym)])||[];
   popMenu(b,L.length?L.map((d,i)=>({h:`${d.k} <small>#${i+1}</small>`,on:d===o,f:()=>{if(confirm('Delete this '+d.k+'?')){L.splice(i,1);save()}}})):[{h:'<small>No drawings</small>'}])}};
 /* 6-dot grip: drag the panel anywhere */
 const gp=nb.querySelector('.gp');
 gp.onpointerdown=e=>{e.preventDefault();gp.setPointerCapture(e.pointerId);const r=ft.getBoundingClientRect(),dx=e.clientX-r.left,dy=e.clientY-r.top;
  const mv=ev=>{const x=Math.max(0,Math.min(innerWidth-ft.offsetWidth,ev.clientX-dx)),y=Math.max(0,Math.min(innerHeight-40,ev.clientY-dy));ft.style.setProperty('--fx',x+'px');ft.style.setProperty('--fy',y+'px');ft.classList.add('mv');V.dpftPos={x,y}};
  mv(e);gp.onpointermove=mv;gp.onpointerup=()=>{gp.onpointermove=null;gp.onpointerup=null;save()}};
 gp.ondblclick=()=>{ft.classList.remove('mv');delete V.dpftPos;save();closeMenu()}}
function attach(ft){ft._sk=1;
 if(V.dpftPos){ft.style.setProperty('--fx',V.dpftPos.x+'px');ft.style.setProperty('--fy',V.dpftPos.y+'px');ft.classList.add('mv')}
 const go=()=>{skin(ft);wire(ft)};new MutationObserver(go).observe(ft,{childList:true});go()}
setInterval(()=>{const ft=$('#dpft');if(ft&&!ft._sk)attach(ft)},250);

/* ---------- open on Candles (never Footprint) ---------- */
let tries=0;const fix=setInterval(()=>{tries++;let ok=charts.length>0&&charts.every(c=>c.c&&c.s);
 if(ok){charts.forEach(c=>{if(c.style==='footprint'){try{c.setStyle('candles')}catch(e){}}});const s=$('#sty');if(s&&s.value==='footprint')s.value='candles';clearInterval(fix)}
 else if(tries>40)clearInterval(fix)},250);
})();
