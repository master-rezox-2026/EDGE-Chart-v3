/* TV Mobile - load AFTER tv-auth.js. Responsive layout (<=820px), bottom action bar, touch drawing. */
(()=>{
if(typeof charts==='undefined')return;
const D=document,$=s=>D.querySelector(s),mob=()=>matchMedia('(max-width:820px)').matches;
const css=D.createElement('style');css.textContent=`
#tvmb{display:none}
@media (max-width:820px){
 html,body{overscroll-behavior:none}
 #etop{flex-wrap:nowrap!important;overflow-x:auto;white-space:nowrap;scrollbar-width:none}#etop::-webkit-scrollbar{display:none}
 #ltb{position:fixed!important;left:0!important;top:46px!important;bottom:52px!important;height:auto!important;z-index:300;transform:translateX(-110%);transition:transform .2s;overflow-y:auto;background:#131722;box-shadow:4px 0 18px #000a}
 body.mb-tools #ltb{transform:none}
 #side{position:fixed!important;right:0;top:46px;bottom:52px;width:min(92vw,380px)!important;z-index:310;box-shadow:-4px 0 18px #000a}
 #tvsc{width:100vw!important}.tvm .bx,.tvd .bx,.tvm2 .bx{width:96vw!important}.tvm .bd{flex-direction:column}.tvm .nv{width:auto!important;display:flex;overflow-x:auto}.tvm .nv div{white-space:nowrap}
 .tvm2{padding-top:3vh!important}.tvm2 .r{grid-template-columns:1.3fr 1fr .8fr .8fr!important;padding:12px 10px!important}
 #tvsc .gr{grid-template-columns:1.5fr 1fr 1fr 1fr!important;min-width:0}#tvsc .gr>span:nth-child(2),#tvsc .gr>span:nth-child(6),#tvsc .gr>span:nth-child(7){display:none}
 #tvrg{left:4px!important;bottom:56px!important}#tvuser{bottom:58px!important;right:4px!important}#tvrp{bottom:96px!important;max-width:96vw;flex-wrap:wrap}
 .tvab{opacity:1!important}
 #tvmb{display:flex;position:fixed;z-index:320;left:0;right:0;bottom:0;height:52px;background:#131722;border-top:1px solid #232836;justify-content:space-around;align-items:center}
 #tvmb button{background:none;border:0;color:#d1d4dc;font:600 11px system-ui;display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 10px}#tvmb button span{font-size:18px}
}`;D.head.appendChild(css);

const bar=D.createElement('div');bar.id='tvmb';
bar.innerHTML=`<button data-a=tools><span>✏️</span>Tools</button><button data-a=sym><span>🔍</span>Symbol</button><button data-a=tf><span>⏱</span>Time</button><button data-a=scr><span>📊</span>Screener</button><button data-a=panel><span>📋</span>Panel</button>`;
D.body.appendChild(bar);
bar.onclick=e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.a;
 if(a==='tools')D.body.classList.toggle('mb-tools');
 else if(a==='sym'){const s=$('#esym');s&&s.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true}))}
 else if(a==='tf'){const t=$('#tvtf');t&&t.click()}
 else if(a==='scr')window.tvScreener&&tvScreener();
 else if(a==='panel'){D.body.classList.toggle('nosd')}};
/* tapping a tool in the drawer closes it */
D.addEventListener('click',e=>{if(mob()&&D.body.classList.contains('mb-tools')&&e.target.closest&&e.target.closest('#ltb button')&&!e.target.closest('[data-fly]'))setTimeout(()=>D.body.classList.remove('mb-tools'),150)});

/* first load on a phone: one chart, side panel hidden */
if(mob()){D.body.classList.add('mb');if(!D.body.classList.contains('nosd'))D.body.classList.add('nosd');
 const l=$('#lay');if(l&&l.value!=='1'){l.value='1';l.dispatchEvent(new Event('change',{bubbles:true}))}}

/* ---------- touch -> mouse for drawing tools ---------- */
const cf=el=>el&&el.closest&&el.closest('.cv')?charts.find(c=>c.host&&c.host.contains(el)):null;
const fire=(el,type,t)=>el.dispatchEvent(new MouseEvent(type,{bubbles:true,cancelable:true,clientX:t.clientX,clientY:t.clientY,button:0,view:window}));
let tp=null;
D.addEventListener('touchstart',e=>{const c=cf(e.target);if(!c||e.touches.length!==1){tp=null;return}const t=e.touches[0],dr=!!(c.dpc&&c.dpc.style.pointerEvents==='auto');
 tp={c,dr,x:t.clientX,y:t.clientY,mv:0};if(dr){e.preventDefault();fire(c.dpc,'mousemove',t);fire(c.dpc,'mousedown',t)}},{passive:false});
D.addEventListener('touchmove',e=>{if(!tp)return;const t=e.touches[0];if(Math.hypot(t.clientX-tp.x,t.clientY-tp.y)>6)tp.mv=1;if(tp.dr){e.preventDefault();fire(tp.c.dpc,'mousemove',t)}},{passive:false});
D.addEventListener('touchend',e=>{if(!tp)return;const t=e.changedTouches[0],o=tp;tp=null;
 if(o.dr){e.preventDefault();fire(o.c.dpc,'mouseup',t)}
 else if(!o.mv){const el=D.elementFromPoint(t.clientX,t.clientY);if(el){fire(el,'mousedown',t);fire(el,'mouseup',t)}}},{passive:false});
})();
