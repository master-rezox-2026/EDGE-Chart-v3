/* TV TF - load LAST. (1) Timeframe menu like TradingView + 7 hours + your own CUSTOM intervals (saved).
   (2) Mouse cursor is always the normal arrow over the chart / drag handles (no hand / move cursors).
   (3) Trendline settings dialog styling (multi-control rows, B / I toggles). */
(()=>{
const D=document,$=s=>D.querySelector(s);
if(typeof S==='undefined'||typeof charts==='undefined')return;
const V=S.tv=S.tv||{};if(!Array.isArray(V.tfc))V.tfc=[];
const css=D.createElement('style');css.textContent=`
.cv,.cv *,.cv canvas,.dpc,canvas.tvfp,#ltb,#ltb::before,.dpgrip,#dpft .gp,.tvmv,.tvmv *,#dpset .dph{cursor:default!important}
#dpset .dph i{font-style:normal;cursor:pointer;color:#9aa0b0;font-size:17px;margin:0 14px 0 8px}#dpset .dph i:hover{color:#fff}
#dpset .hdr{font-size:11px;letter-spacing:.5px;color:#868993;margin:18px 0 -4px}
#dpset .mrow{display:grid;grid-template-columns:120px 1fr;align-items:center;gap:12px;margin:14px 0}#dpset .mrow>span{color:#d1d4dc}
#dpset .mi{display:flex;gap:8px;align-items:center}#dpset .mi select,#dpset .mi input[type=number]{flex:1;min-width:0;width:auto}#dpset .mi input[type=color]{flex:none}
#dpset .mrow:has(.tgl) .mi{gap:8px}
#dpset .tgl{flex:none;position:relative}#dpset .tgl input{position:absolute;opacity:0;pointer-events:none}
#dpset .tgl span{display:flex;align-items:center;justify-content:center;width:42px;height:38px;border-radius:8px;background:#363a45;color:#cfd2da;font:700 15px system-ui;cursor:pointer}
#dpset .tgl input:checked+span{background:#fff;color:#111}
#dpset textarea{min-height:110px}
#tvtfm{position:fixed;z-index:800;width:226px;max-height:78vh;overflow:auto;background:#141414;border:1px solid #2a2a2a;border-radius:10px;padding:6px 8px 8px;box-shadow:0 12px 40px #000;font:14px system-ui;color:#d1d4dc}
#tvtfm .h{font-size:11px;letter-spacing:.4px;color:#6b7080;margin:10px 8px 4px;text-transform:uppercase}
#tvtfm .i{display:flex;align-items:center;padding:0 10px;height:34px;border-radius:7px;cursor:pointer;border-bottom:1px solid #1c1f2b}#tvtfm .i:hover{background:#262b36}
#tvtfm .i.on{background:#e8e8e8;color:#111;border-bottom-color:transparent}#tvtfm .i span{flex:1}#tvtfm .i b{color:#868993;font-weight:400;padding:0 4px}#tvtfm .i b:hover{color:#ef5350}
#tvtfm .i.add{color:#6ea8ff;border-bottom:0;margin-top:6px}
.tvcd{position:fixed;inset:0;z-index:850;background:#0008;display:flex;align-items:center;justify-content:center;font:14px system-ui;color:#d1d4dc}
.tvcd .bx{background:#2a2a2a;border-radius:14px;width:360px;max-width:94vw;padding:20px 22px;box-shadow:0 12px 50px #000}.tvcd h3{margin:0 0 16px;font-size:19px;color:#fff;display:flex;justify-content:space-between}.tvcd h3 span{cursor:pointer;color:#9aa0b0}
.tvcd .rw{display:flex;gap:10px;margin-bottom:12px}.tvcd input,.tvcd select{height:38px;background:#2a2a2a;color:#d1d4dc;border:2px solid #4a4a4a;border-radius:10px;padding:0 12px;font:inherit;flex:1;min-width:0;box-sizing:border-box}
.tvcd .msg{min-height:18px;color:#ef5350;font-size:13px;margin-bottom:8px}.tvcd .ft{display:flex;gap:10px;justify-content:flex-end}
.tvcd button{height:38px;border-radius:10px;padding:0 20px;font:600 15px system-ui;cursor:pointer}.tvcd .cn{background:transparent;color:#fff;border:2px solid #fff}.tvcd .ok{background:#f0f0f0;color:#111;border:2px solid #f0f0f0}`;D.head.appendChild(css);

/* ---- timeframe helpers ---- */
const pTf=s=>{s=String(s).trim();if(s==='D')return 1440;if(s==='W')return 10080;const m=s.match(/^(\d*)(m|h|d|w)$/);return m?(+m[1]||1)*{m:1,h:60,d:1440,w:10080}[m[2]]:0};
const label=s=>{const m=String(s).match(/^(\d+)(m|h|d|w)$/);if(!m)return s;const n=+m[1],u={m:'minute',h:'hour',d:'day',w:'week'}[m[2]];return n+' '+u+(n>1?'s':'')};
const STD=[['MINUTES',[['1m','1 minute'],['2m','2 minutes'],['3m','3 minutes'],['5m','5 minutes'],['10m','10 minutes'],['15m','15 minutes'],['30m','30 minutes'],['45m','45 minutes']]],
 ['HOURS',[['1h','1 hour'],['2h','2 hours'],['3h','3 hours'],['4h','4 hours'],['7h','7 hours']]],
 ['DAYS',[['D','1 day'],['W','1 week'],['M','1 month'],['3M','3 months'],['6M','6 months'],['12M','12 months']]]];
const A=()=>(typeof act!=='undefined'&&act)||charts[0];
let menu=null;const close=()=>{if(menu){menu.remove();menu=null}};
D.addEventListener('mousedown',e=>{if(menu&&!menu.contains(e.target)&&!e.target.closest('#tvtf'))close()},true);
function open(btn){close();const cur=String(A().cfg.tf),m=menu=D.createElement('div');m.id='tvtfm';
 const it=(v,l,x)=>`<div class="i${v.toLowerCase()===cur.toLowerCase()&&(v!=='M'||cur==='M')&&(v===cur||v.toLowerCase()===cur.toLowerCase())?' on':''}" data-v="${v}"><span>${l}</span>${x||''}</div>`;
 m.innerHTML=STD.map(([h,L])=>`<div class=h>${h}</div>`+L.map(([v,l])=>it(v,l)).join('')).join('')+
  (V.tfc.length?'<div class=h>CUSTOM</div>'+V.tfc.map(v=>it(v,label(v),`<b data-rm="${v}" title="Remove">✕</b>`)).join(''):'')+'<div class="i add" data-add>＋ Add custom interval…</div>';
 D.body.appendChild(m);const r=btn.getBoundingClientRect();m.style.top=r.bottom+4+'px';m.style.left=Math.max(4,Math.min(innerWidth-m.offsetWidth-4,r.left))+'px';
 m.onclick=e=>{const rm=e.target.dataset.rm;if(rm){V.tfc=V.tfc.filter(x=>x!==rm);save();open(btn);return}
  if(e.target.closest('[data-add]')){close();custom();return}
  const d=e.target.closest('[data-v]');if(d){close();A().setTf(d.dataset.v)}}}
function custom(){const m=D.createElement('div');m.className='tvcd';
 m.innerHTML=`<div class=bx><h3>Add custom interval<span data-x>✕</span></h3><div class=rw><input type=number id=cn min=1 value=7><select id=cu><option value=m>Minutes</option><option value=h selected>Hours</option><option value=d>Days</option><option value=w>Weeks</option></select></div><div class=msg></div><div class=ft><button class=cn>Cancel</button><button class=ok>Add</button></div></div>`;
 D.body.appendChild(m);const n=m.querySelector('#cn'),u=m.querySelector('#cu'),msg=m.querySelector('.msg');n.focus();n.select();
 const go=()=>{const v=Math.floor(+n.value);if(!(v>=1)){msg.textContent='Enter a number of 1 or more';return}
  const tf=v+u.value,mins=pTf(tf);if(mins<1||mins>43200){msg.textContent='Interval must be between 1 minute and 30 days';return}
  const std=STD.some(([,L])=>L.some(([x])=>x.toLowerCase()===tf.toLowerCase()))||(v===1&&u.value==='d')||(v===1&&u.value==='w');
  if(!std&&!V.tfc.includes(tf)){V.tfc.push(tf);V.tfc.sort((a,b)=>pTf(a)-pTf(b));save()}
  m.remove();A().setTf(v===1&&u.value==='d'?'D':v===1&&u.value==='w'?'W':tf)};
 m.querySelector('.ok').onclick=go;m.querySelector('.cn').onclick=m.querySelector('[data-x]').onclick=()=>m.remove();
 m.onmousedown=e=>{if(e.target===m)m.remove()};m.onkeydown=e=>{if(e.key==='Enter')go();if(e.key==='Escape')m.remove()}}
const hook=()=>{const b=$('#tvtf');if(!b||b._tf2)return;b._tf2=1;b.onclick=e=>{e.stopPropagation();menu?close():open(b)}};
hook();setInterval(hook,500);
window.tvCustomTf=custom;
})();
