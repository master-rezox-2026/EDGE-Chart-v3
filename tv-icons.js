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
 x:'<path d="M8 8l12 12M20 8L8 20"/>'
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
#tvmb button svg{width:24px;height:24px}#tvdb button svg{width:22px;height:22px}#tvstep i svg{width:20px;height:20px;vertical-align:middle}#tvuser svg{width:15px;height:15px;vertical-align:-3px}`;D.head.appendChild(css);

/* tiny popup menu */
let pm=null;const closePm=()=>{if(pm){pm.remove();pm=null}};
D.addEventListener('mousedown',e=>{if(pm&&!pm.contains(e.target)&&!(e.target.closest&&e.target.closest('[data-pm]')))closePm()},true);
function menu(btn,items,right){closePm();pm=D.createElement('div');pm.className='tvpm';pm.innerHTML=items.map((x,i)=>`<div class="${x.on?'on':''}" data-i="${i}"><span>${x.l}</span><span style="color:#6b7080">${x.s||''}</span></div>`).join('');
 pm.onclick=e=>{const d=e.target.closest('[data-i]');if(!d)return;const f=items[+d.dataset.i].f;closePm();f()};D.body.appendChild(pm);
 const r=btn.getBoundingClientRect();pm.style.top=r.bottom+4+'px';pm.style.left=Math.max(4,Math.min(innerWidth-pm.offsetWidth-4,right?r.right-pm.offsetWidth:r.left))+'px'}
const say=m=>window.toast&&toast(m);

/* ---- right cluster ---- */
const bar=$('#eic'),sd=n=>D.body.classList.contains('nosd');
const B=(k,t,f,extra='')=>({k,t,f,extra});
const buttons=[
 B('layout','Layout (number of charts)',function(){const cur=($('#lay')||{}).value;menu(this,[1,2,3,4,5,6,7,8].map(n=>({l:n===1?'1 chart':n+' charts',on:String(n)===cur,f:()=>{const s=$('#lay');if(s){s.value=n;s.dispatchEvent(new Event('change',{bubbles:true}))}}})))}),
 'NAME',
 B('search','Quick search (symbol)',()=>{const s=$('#esym');s&&s.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true}))}),
 B('settings','Chart settings',()=>window.tvSettings&&tvSettings()),
 B('full','Fullscreen',()=>{D.fullscreenElement?D.exitFullscreen():D.documentElement.requestFullscreen&&D.documentElement.requestFullscreen()}),
 B('camera','Screenshot',()=>{}),
 'SEP',
 B('screener','Screener',()=>window.tvScreener&&tvScreener()),
 B('bell','Alerts',()=>{if(sd())D.body.classList.remove('nosd');const b=$('#ta');b&&b.click()}),
 B('alarm','Price alert on active chart',()=>{}),
 B('swap','Forex panel',()=>{const b=[...D.querySelectorAll('#top button')].find(x=>/Forex/.test(x.textContent));b&&b.click()}),
 B('user','Account / cloud sync',()=>{const u=$('#tvuser');u&&u.click()}),
 B('panel','Show / hide watchlist panel',()=>{const h=$('#tvsd');if(h)h.click();else D.body.classList.toggle('nosd')}),
 B('more','More controls (time zone, bridge URL, custom TF…)',()=>{D.body.classList.toggle('more');dispatchEvent(new Event('resize'))})
];
bar.onclick=null;bar.innerHTML='';
buttons.forEach(b=>{
 if(b==='SEP'){const s=D.createElement('span');s.className='tvsep';bar.appendChild(s);return}
 if(b==='NAME'){const w=D.createElement('span');w.id='tvnm';w.innerHTML='<span class="nb" data-pm="1"><span class="nm"></span><span class="sv">Save</span></span><button class="cv2" data-pm="1" title="Chart options">⌄</button>';bar.appendChild(w);return}
 const e=D.createElement('button');e.className='ib';e.title=b.t;e.innerHTML=ic(P[b.k]);e.dataset.pm='1';e.addEventListener('click',ev=>{ev.stopPropagation();b.f.call(e,ev)});bar.appendChild(e)});

/* chart name + Save (saves layout/drawings to this browser and, when logged in, to your cloud account) */
const nm=$('#tvnm .nm'),sv=$('#tvnm .sv'),nb=$('#tvnm .nb');
const setName=()=>{nm.textContent=V.cname||'Unnamed'};setName();
const doSave=()=>{try{save()}catch(e){}try{const r=localStorage.getItem('mcp');if(r)localStorage.setItem('mcp',r)}catch(e){}sv.textContent='Saved';sv.classList.add('ok');say('Saved');setTimeout(()=>{sv.textContent='Save';sv.classList.remove('ok')},2000)};
const rename=()=>{const n=prompt('Chart name',V.cname||'Unnamed');if(n!=null){V.cname=n.trim()||'Unnamed';save();setName()}};
sv.onclick=e=>{e.stopPropagation();doSave()};nm.onclick=rename;
$('#tvnm .cv2').onclick=function(e){e.stopPropagation();menu(this,[{l:'Save',s:'',f:doSave},{l:'Rename…',f:rename}])};

/* ---- emoji -> svg on the mobile bars / chips (they are created by tv-mobile.js / tv-auth.js) ---- */
function swapMobile(){
 const mb=$('#tvmb');if(mb&&!mb.dataset.sv){mb.dataset.sv=1;const m={tools:'pencil',sym:'search',tf:'clock',scr:'screener',panel:'panel'};mb.querySelectorAll('button').forEach(b=>{const s=b.querySelector('span');if(s&&m[b.dataset.a])s.innerHTML=ic(P[m[b.dataset.a]],24)})}
 const db=$('#tvdb');if(db&&!db.dataset.sv){db.dataset.sv=1;const m={x:'x',mag:'magnet',lock:'lock',hide:'eye',full:'full'};db.querySelectorAll('button').forEach(b=>{if(m[b.dataset.a])b.innerHTML=ic(P[m[b.dataset.a]],22)})}
 const st=$('#tvstep i');if(st&&!st.dataset.sv){st.dataset.sv=1;st.innerHTML=ic(P.trash,22)}
 const u=$('#tvuser');if(u&&!u.dataset.sv&&u.textContent.includes('👤')){u.dataset.sv=1;u.innerHTML=ic(P.user,16)+' '+u.textContent.replace('👤','').trim()}}
setInterval(swapMobile,700);swapMobile();
})();
