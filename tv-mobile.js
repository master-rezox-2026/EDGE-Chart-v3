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
const ring=D.createElement('div');ring.style.cssText='position:fixed;z-index:200;width:36px;height:36px;margin:-18px 0 0 -18px;border:2px solid #e6b422;border-radius:50%;pointer-events:none;display:none;box-shadow:0 0 0 1px #000a,inset 0 0 0 1px #000a';
const dot=D.createElement('div');dot.style.cssText='position:absolute;left:50%;top:50%;width:4px;height:4px;margin:-2px 0 0 -2px;border-radius:50%;background:#e6b422';ring.appendChild(dot);D.body.appendChild(ring);
const drOn=c=>!!(c&&c.dpc&&c.dpc.style.pointerEvents==='auto'),cvr=c=>c.host.querySelector('.cv').getBoundingClientRect();
/* Drawing on touch = "trackpad mode": dragging anywhere MOVES the crosshair by the finger's movement (so your finger never covers it);
   a short TAP places the point exactly where the crosshair is. */
const cvOf=c=>c.host.querySelector('.cv'),curC=()=>(typeof act!=='undefined'&&act)||charts[0];
const initVc=c=>{if(!c._vc){const r=cvr(c);c._vc={clientX:r.left+r.width/2,clientY:r.top+r.height/2}}return c._vc};
const moveVc=(c,dx,dy)=>{const r=cvr(c),v=initVc(c);v.clientX=Math.max(r.left+2,Math.min(r.right-60,v.clientX+dx));v.clientY=Math.max(r.top+2,Math.min(r.bottom-30,v.clientY+dy));return v};
const aim=c=>{const v=initVc(c);fire(drOn(c)?c.dpc:(D.elementFromPoint(v.clientX,v.clientY)||cvOf(c)),'mousemove',v)};
let tp=null;const CAP={capture:true,passive:false};
D.addEventListener('touchstart',e=>{const c=cf(e.target);if(!c||e.touches.length!==1){if(tp&&tp.tm)clearTimeout(tp.tm);tp=null;return}const t=e.touches[0],dr=drOn(c);
 tp={c,dr,lx:t.clientX,ly:t.clientY,x:t.clientX,y:t.clientY,mv:0,t:Date.now()};
 if(dr){e.preventDefault();e.stopImmediatePropagation();initVc(c);aim(c);return}
 /* no drawing tool: does the finger land on an existing drawing? -> drag it (drawing-pro handles mousedown on the chart box) */
 const ok=cvOf(c).dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true,clientX:t.clientX,clientY:t.clientY,button:0,view:window}));
 if(!ok){tp.hit=1;e.preventDefault();e.stopImmediatePropagation();return}
 /* long press on empty chart = grab the crosshair and move it */
 tp.tm=setTimeout(()=>{if(tp&&!tp.mv){tp.xh=1;navigator.vibrate&&navigator.vibrate(12)}},350)},CAP);
D.addEventListener('touchmove',e=>{if(!tp)return;const t=e.touches[0];if(Math.hypot(t.clientX-tp.x,t.clientY-tp.y)>8){tp.mv=1;clearTimeout(tp.tm)}
 if(tp.hit){e.preventDefault();e.stopImmediatePropagation();fire(cvOf(tp.c),'mousemove',t);return}
 if(tp.dr||tp.xh){e.preventDefault();e.stopImmediatePropagation();const v=moveVc(tp.c,t.clientX-tp.lx,t.clientY-tp.ly);tp.lx=t.clientX;tp.ly=t.clientY;aim(tp.c)}},CAP);
D.addEventListener('touchend',e=>{if(!tp)return;const t=e.changedTouches[0],o=tp;tp=null;clearTimeout(o.tm);
 if(o.hit){e.preventDefault();e.stopImmediatePropagation();fire(cvOf(o.c),'mouseup',t);return}
 if(o.xh){e.preventDefault();e.stopImmediatePropagation();return}
 if(o.dr){e.preventDefault();e.stopImmediatePropagation();if(!o.mv&&Date.now()-o.t<450){const v=initVc(o.c);fire(o.c.dpc,'mousemove',v);fire(o.c.dpc,'mousedown',v);fire(o.c.dpc,'mouseup',v)}}},CAP);
/* the crosshair ring is ALWAYS visible on phones */
setInterval(()=>{if(!mob()){ring.style.display='none';return}const c=curC();if(!c||!c.host||!cvOf(c)){ring.style.display='none';return}
 const v=moveVc(c,0,0);ring.style.display='block';ring.style.left=v.clientX+'px';ring.style.top=v.clientY+'px';if(!tp)aim(c)},250);
})();
