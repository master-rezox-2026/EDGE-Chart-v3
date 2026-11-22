/* TV Nav - load LAST. TradingView-style chart navigation buttons (zoom out / zoom in / scroll left / scroll right / reset)
   at the bottom-left of every chart. Visibility follows Settings > Canvas > Buttons > Navigation (on mouse over / always / hidden). */
(()=>{
if(typeof charts==='undefined'||typeof S==='undefined')return;
const D=document,V=S.tv=S.tv||{};
const css=D.createElement('style');css.textContent=`
.tvnav{position:absolute;left:8px;bottom:36px;z-index:8;display:flex;gap:6px;opacity:0;transition:opacity .15s;pointer-events:none}
.cv:hover .tvnav,body.tvnav-always .tvnav{opacity:1;pointer-events:auto}body.tvnav-hidden .tvnav{display:none}
.tvnav button{all:unset;box-sizing:border-box;width:30px;height:28px;border-radius:7px;background:#1c1c1c;color:#e6e6e6;display:flex;align-items:center;justify-content:center;cursor:pointer;font:600 16px system-ui;box-shadow:0 2px 8px #0008}
.tvnav button:hover{background:#2f2f2f;color:#fff}.tvnav button:active{background:#3a3a3a}`;D.head.appendChild(css);
const ICON={out:'−',in:'+',l:'‹',r:'›',reset:'↻'};
function act(c,a){const ts=c.c.timeScale(),o=ts.options(),bs=o.barSpacing||6;
 if(a==='in')ts.applyOptions({barSpacing:Math.min(60,bs*1.25)});
 else if(a==='out')ts.applyOptions({barSpacing:Math.max(.5,bs/1.25)});
 else if(a==='l')ts.scrollToPosition(ts.scrollPosition()-Math.max(5,Math.round(c.host.querySelector('.cv').clientWidth/bs/4)),true);
 else if(a==='r')ts.scrollToPosition(ts.scrollPosition()+Math.max(5,Math.round(c.host.querySelector('.cv').clientWidth/bs/4)),true);
 else if(a==='reset'){ts.applyOptions({barSpacing:6});try{c.c.priceScale('right').applyOptions({autoScale:true})}catch(e){}ts.scrollToRealTime()}}
function ensure(c){const cv=c.host&&c.host.querySelector('.cv');if(!cv||!c.c||cv.querySelector('.tvnav'))return;
 cv.style.position='relative';const n=D.createElement('div');n.className='tvnav';
 n.innerHTML=[['out','Zoom out'],['in','Zoom in'],['l','Scroll left'],['r','Scroll right'],['reset','Reset chart']].map(([k,t])=>`<button data-a="${k}" title="${t}">${ICON[k]}</button>`).join('');
 ['mousedown','pointerdown','touchstart','dblclick','contextmenu'].forEach(ev=>n.addEventListener(ev,e=>e.stopPropagation()));
 n.onclick=e=>{const b=e.target.closest('button');if(b)act(c,b.dataset.a)};cv.appendChild(n)}
setInterval(()=>{charts.forEach(ensure);const m=V.navb||'hover';D.body.classList.toggle('tvnav-always',m==='always');D.body.classList.toggle('tvnav-hidden',m==='hidden')},500);
})();
