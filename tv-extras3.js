/* TV Extras 3 - load AFTER tv-extras2.js.
   Timeframe dropdown, chart-type dropdown, snapshot menu, Indicators dialog, Create-alert dialog (+ alert engine),
   Replay bar with cut line, bottom range buttons (1D 5D 1M ... All). */
(()=>{
if(typeof S==='undefined'||typeof charts==='undefined'||!document.querySelector('#etop'))return;
const D=document,$=s=>D.querySelector(s),say=m=>window.toast&&toast(m);
const V=S.tv=S.tv||{};V.alerts=V.alerts||[];
const css=D.createElement('style');css.textContent=`
#etf,#ecust,#esty select{display:none!important}
#tvtf,#tvsty{background:transparent;border:0;color:#d1d4dc;font:600 13px system-ui;padding:0 10px;height:30px;border-radius:4px;cursor:pointer}
#tvtf:hover,#tvsty:hover,#tvsty.on,#tvtf.on{background:#2a2e39}
.tvpop{position:fixed;z-index:700;background:#141414;border:1px solid #2a2a2a;border-radius:8px;padding:6px;font:13px system-ui;color:#d1d4dc;box-shadow:0 10px 30px #000c;max-height:88vh;overflow:auto;min-width:230px}
.tvpop .hh{padding:8px 10px 4px;font-size:10px;letter-spacing:.6px;color:#6b7080}.tvpop hr{border:0;border-top:1px solid #2a2a2a;margin:5px 0}
.tvpop .it{padding:8px 10px;border-radius:6px;cursor:pointer;display:flex;justify-content:space-between;gap:20px}.tvpop .it:hover{background:#262b36}
.tvpop .it.on{background:#e8e8e8;color:#111}.tvpop .it i{font-style:normal;color:#6b7080;font-size:11px}
.tvd{position:fixed;inset:0;z-index:650;background:#0007;display:flex;align-items:center;justify-content:center;font:13px system-ui;color:#d1d4dc}
.tvd .bx{background:#141414;border-radius:10px;box-shadow:0 10px 40px #000;display:flex;flex-direction:column;max-width:94vw;max-height:88vh}
.tvd h3{margin:0;padding:18px 20px 12px;font-size:18px;display:flex;justify-content:space-between}.tvd h3 span{cursor:pointer;color:#8b91a3}
.tvd .rw{display:flex;align-items:center;gap:12px;padding:6px 20px}.tvd .rw>label{width:90px;color:#8b91a3}
.tvd select,.tvd input[type=text],.tvd input[type=number],.tvd input[type=datetime-local]{background:#1e222d;color:#d1d4dc;border:1px solid #363a45;border-radius:6px;padding:8px 10px;flex:1;font:13px system-ui}
.tvd .ft{display:flex;justify-content:flex-end;gap:10px;padding:16px 20px;border-top:1px solid #2a2a2a;margin-top:10px}
.tvd button{border:1px solid #d1d4dc;background:transparent;color:#d1d4dc;border-radius:6px;padding:8px 18px;cursor:pointer}.tvd button.ok{background:#e8e8e8;color:#111;border-color:#e8e8e8}
.tvd .ind{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:6px;cursor:pointer}.tvd .ind:hover{background:#262b36}.tvd .ind b{width:18px;color:#26a69a}
.tvd .chip{background:#222;border:0;border-radius:14px;padding:6px 14px;margin-right:6px}.tvd .chip.on{background:#fff;color:#111}
#tvrp{position:fixed;z-index:160;left:50%;transform:translateX(-50%);bottom:46px;display:none;align-items:center;gap:6px;background:#1e222d;border:1px solid #363a45;border-radius:8px;padding:6px 10px;font:13px system-ui;color:#d1d4dc;box-shadow:0 4px 16px #0008}
#tvrp button{background:none;border:0;color:#d1d4dc;padding:6px 10px;border-radius:5px;cursor:pointer;font-size:14px}#tvrp button:hover{background:#2a2e39}#tvrp .sp{width:1px;height:20px;background:#363a45}
#tvrp select{background:transparent;color:#d1d4dc;border:0;font:13px system-ui}
.tvcut{position:absolute;top:0;bottom:0;width:0;border-left:1px solid #2962ff;z-index:8;pointer-events:none;display:none}
.cv.tvsc,.cv.tvsc *{cursor:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' stroke='%23fff' stroke-width='1.6'><circle cx='6' cy='18' r='3'/><circle cx='18' cy='18' r='3'/><path d='M8 16L19 3M16 16L5 3'/></svg>") 12 12,crosshair!important}
#tvrg{position:fixed;z-index:50;left:64px;bottom:3px;display:flex;gap:2px;background:#131722cc;border-radius:6px;padding:2px 4px}
#tvrg button{background:none;border:0;color:#9aa0b0;font:600 12px system-ui;padding:4px 7px;border-radius:4px;cursor:pointer}#tvrg button:hover{background:#2a2e39;color:#fff}`;
D.head.appendChild(css);

/* ---------- popup helper ---------- */
let pp=null;const closePop=()=>{if(pp){pp.remove();pp=null}};
D.addEventListener('mousedown',e=>{if(pp&&!pp.contains(e.target)&&!(e.target.closest&&e.target.closest('[data-pp]')))closePop()},true);
function pop(btn,items,pick,right){closePop();const el=pp=D.createElement('div');el.className='tvpop';
 el.innerHTML=items.map((x,i)=>x.h?`<div class=hh>${x.h}</div>`:x.sep?'<hr>':`<div class="it${x.on?' on':''}" data-i=${i}><span>${x.l}</span><i>${x.s||''}</i></div>`).join('');
 el.onclick=e=>{const d=e.target.closest('[data-i]');if(d){const v=items[+d.dataset.i].v;closePop();pick(v)}};D.body.appendChild(el);
 const r=btn.getBoundingClientRect();el.style.top=r.bottom+4+'px';el.style.left=Math.max(4,Math.min(innerWidth-el.offsetWidth-4,right?r.right-el.offsetWidth:r.left))+'px'}
function dlg(title,body,foot){const m=D.createElement('div');m.className='tvd';m.innerHTML=`<div class=bx><h3>${title}<span data-x>✕</span></h3>${body}${foot||''}</div>`;
 m.onmousedown=e=>{if(e.target===m)m.remove()};m.querySelector('[data-x]').onclick=()=>m.remove();D.body.appendChild(m);return m}
const A=()=>(typeof act!=='undefined'&&act)||charts[0];

/* ---------- 1. timeframe dropdown ---------- */
const TFL=[{h:'MINUTES'},...[[1,'1 minute'],[2,'2 minutes'],[3,'3 minutes'],[5,'5 minutes'],[10,'10 minutes'],[15,'15 minutes'],[30,'30 minutes'],[45,'45 minutes']].map(([n,l])=>({v:n+'m',l})),{sep:1},{h:'HOURS'},
 ...[[1,'1 hour'],[2,'2 hours'],[3,'3 hours'],[4,'4 hours']].map(([n,l])=>({v:n+'h',l})),{sep:1},{h:'DAYS'},
 {v:'D',l:'1 day'},{v:'W',l:'1 week'},{v:'M',l:'1 month'},{v:'3M',l:'3 months'},{v:'6M',l:'6 months'},{v:'12M',l:'12 months'}];
const tfb=D.createElement('button');tfb.id=tvtfId();function tvtfId(){return'tvtf'}
$('#etf').before(tfb);tfb.dataset.pp=1;
tfb.onclick=()=>{const cur=String(A().cfg.tf);pop(tfb,TFL.map(x=>x.v?{...x,on:x.v===cur||x.v.toLowerCase()===cur.toLowerCase()}:x),v=>A().setTf(v))};

/* ---------- 2. chart-type dropdown ---------- */
const sel=$('#sty'),stb=D.createElement('button');stb.id='tvsty';stb.dataset.pp=1;$('#esty').prepend(stb);
stb.onclick=()=>{const it=[];[...sel.children].forEach((g,gi)=>{if(gi)it.push({sep:1});(g.tagName==='OPTGROUP'?[...g.children]:[g]).forEach(o=>it.push({v:o.value,l:o.textContent,on:o.value===A().style}))});pop(stb,it,v=>{A().setStyle(v);sel.value=v})};

setInterval(()=>{const c=A();if(!c)return;tfb.textContent=String(c.cfg.tf);const o=[...sel.options].find(x=>x.value===c.style);stb.textContent=o?o.textContent:c.style;tfb.classList.toggle('on',!!pp)},300);
/* ---------- 3. snapshot ---------- */
async function snap(c){const b=c.c.takeScreenshot(),cv=c.host.querySelector('.cv'),o=D.createElement('canvas');o.width=b.width;o.height=b.height;const g=o.getContext('2d');g.drawImage(b,0,0);
 const r=b.width/cv.clientWidth;cv.querySelectorAll('canvas.dpc,canvas.tvfp').forEach(k=>{if(k.style.visibility!=='hidden')g.drawImage(k,0,0,k.clientWidth*r,k.clientHeight*r)});
 /* info strip like the reference: symbol · tf  O H L C   (top-left)  and date/time + app name (top-right) */
 const hx=String(V.bg||'#131722').replace('#',''),n=parseInt(hx.length===3?hx.replace(/./g,'$&$&'):hx,16)||0,light=(.299*(n>>16&255)+.587*(n>>8&255)+.114*(n&255))/255>.55,
  fg=light?'#111':'#e6e8ee',mu=light?'#555':'#9aa0b0',a=c.view(),l=a[a.length-1],pr=c.precision||2,f=v=>v.toFixed(pr),pad=x=>String(x).padStart(2,'0'),d=new Date(),off=-d.getTimezoneOffset(),
  ts=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())} UTC${off>=0?'+':'-'}${pad(Math.floor(Math.abs(off)/60))}${Math.abs(off)%60?':'+pad(Math.abs(off)%60):''}  ·  MultiChart Pro`;
 g.textBaseline='top';let x=8*r,y=8*r;g.font=`700 ${13*r}px system-ui`;g.fillStyle=fg;const t1=`${c.name} · ${c.cfg.tf}`;g.fillText(t1,x,y);x+=g.measureText(t1).width+10*r;
 if(l){g.font=`${11*r}px system-ui`;[['O',l.open],['H',l.high],['L',l.low],['C',l.close]].forEach(([k,v])=>{g.fillStyle=mu;g.fillText(k,x,y+1*r);x+=g.measureText(k+' ').width;g.fillStyle=fg;const s=f(v);g.fillText(s,x,y+1*r);x+=g.measureText(s).width+8*r})}
 g.font=`${11*r}px system-ui`;g.fillStyle=mu;g.textAlign='right';let pw=56;try{pw=c.c.priceScale('right').width()||56}catch(e){}g.fillText(ts,b.width-(pw+8)*r,y+1*r);g.textAlign='left';
 return o}
const blob=o=>new Promise(r=>o.toBlob(r,'image/png'));
const snapDo={dl:async()=>{const c=A(),b=await blob(await snap(c)),a=D.createElement('a');a.href=URL.createObjectURL(b);a.download=(c.name||'chart')+'_'+Date.now()+'.png';a.click()},
 cp:async()=>{const b=await blob(await snap(A()));try{await navigator.clipboard.write([new ClipboardItem({'image/png':b})]);say('Image copied')}catch(e){say('Copy failed: '+e.message)}},
 tab:async()=>{window.open(URL.createObjectURL(await blob(await snap(A()))),'_blank')}};
D.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#eic button[title="Screenshot"]');if(!b)return;e.stopImmediatePropagation();e.preventDefault();b.dataset.pp=1;
 pop(b,[{h:'CHART SNAPSHOT'},{v:'dl',l:'Download image',s:'Ctrl + Alt + S'},{v:'cp',l:'Copy image',s:'Ctrl + Shift + S'},{v:'tab',l:'Open in new tab'}],v=>snapDo[v](),1)},true);
D.addEventListener('keydown',e=>{if((e.target.tagName||'')==='INPUT')return;const k=e.key.toLowerCase();
 if(e.ctrlKey&&e.altKey&&k==='s'){e.preventDefault();snapDo.dl()}else if(e.ctrlKey&&e.shiftKey&&!e.altKey&&k==='s'){e.preventDefault();snapDo.cp()}});

/* ---------- 4. Indicators dialog ---------- */
let bypass=0;
function indList(){bypass=1;$('#eind').click();bypass=0;const L=[...D.querySelectorAll('#emenu [data-i]')].map(d=>({i:d.dataset.i,n:d.children[0].textContent,on:d.children[1].textContent==='✓'}));$('#emenu').style.display='none';return L}
D.addEventListener('click',e=>{if(bypass||!e.target.closest||!e.target.closest('#eind'))return;e.stopImmediatePropagation();e.preventDefault();indDlg()},true);
function indDlg(){const m=dlg('Indicators, metrics, and strategies',`<div style="padding:0 20px 16px;width:620px"><input type=text id=tvq placeholder="Search" style="width:100%;box-sizing:border-box;margin-bottom:12px"><div style="margin-bottom:8px"><button class="chip on">All</button><button class=chip>Indicators</button><button class=chip>Strategies</button></div><div id=tvil style="max-height:50vh;overflow:auto;min-height:200px"></div><div style="color:#6b7080;font-size:11px;margin-top:8px">Built-in indicators of this platform. Click to add / remove.</div></div>`);
 const q=m.querySelector('#tvq'),ls=m.querySelector('#tvil');let tab='All';
 const draw=()=>{const k=q.value.toLowerCase(),L=tab==='Strategies'?[]:indList().filter(x=>x.n.toLowerCase().includes(k));ls.innerHTML=L.length?L.map(x=>`<div class=ind data-i=${x.i}><b>${x.on?'✓':''}</b>${x.n}</div>`).join(''):'<div style="padding:20px;color:#6b7080">Nothing here.</div>'};
 m.querySelector('.chip').parentNode.onclick=e=>{if(e.target.classList.contains('chip')){tab=e.target.textContent;m.querySelectorAll('.chip').forEach(c=>c.classList.toggle('on',c===e.target));draw()}};
 ls.onclick=e=>{const d=e.target.closest('[data-i]');if(!d)return;bypass=1;$('#eind').click();bypass=0;const it=D.querySelector(`#emenu [data-i="${d.dataset.i}"]`);it&&it.click();$('#emenu').style.display='none';draw()};
 q.oninput=draw;draw();q.focus()}

/* ---------- 5. Alerts ---------- */
const OPS=[['x','Crossing'],['xu','Crossing up'],['xd','Crossing down'],['gt','Greater than'],['lt','Less than']];
function tvAlert(price){const c=A(),last=c.ag&&c.ag.length?c.ag[c.ag.length-1].close:0,p=+(price!=null&&price!==''?price:last),pr=c.precision||2,exp=new Date(Date.now()+7*864e5-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,16);
 const m=dlg('Create alert on '+c.name,`<div class=rw><label>Condition</label><select><option>Price</option></select></div><div class=rw><label></label><select id=aop>${OPS.map(o=>`<option value=${o[0]}>${o[1]}</option>`).join('')}</select></div><div class=rw><label></label><input type=number id=av step=any value="${p.toFixed(pr)}"></div>
 <div class=rw style="margin-top:8px"><label>Trigger</label><select id=atr><option value=once>Once only</option><option value=every>Every time</option></select></div><div class=rw><label>Expiration</label><input type=datetime-local id=aex value="${exp}"></div><div class=rw><label>Message</label><input type=text id=amsg></div>`,
 `<div class=ft><button data-c>Cancel</button><button class=ok data-o>Create</button></div>`);
 const msg=m.querySelector('#amsg'),upd=()=>{msg.value=c.name+' '+OPS.find(o=>o[0]===m.querySelector('#aop').value)[1]+' '+m.querySelector('#av').value};upd();m.querySelector('#aop').onchange=upd;m.querySelector('#av').oninput=upd;
 m.querySelector('[data-c]').onclick=()=>m.remove();
 m.querySelector('[data-o]').onclick=()=>{V.alerts.push({id:'a'+Date.now(),sym:c.cfg.sym,name:c.name,op:m.querySelector('#aop').value,v:+m.querySelector('#av').value,tr:m.querySelector('#atr').value,exp:new Date(m.querySelector('#aex').value).getTime()||0,msg:msg.value,prev:null,done:0});save();m.remove();say('Alert created');if('Notification'in window&&Notification.permission==='default')Notification.requestPermission()}}
window.tvAlert=tvAlert;
D.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#eic button[title="Price alert on active chart"],#top button[data-t=pal]');if(b){e.stopImmediatePropagation();e.preventDefault();tvAlert()}},true);
D.addEventListener('keydown',e=>{if(e.altKey&&!e.ctrlKey&&!e.shiftKey&&e.code==='KeyA'&&(e.target.tagName||'')!=='INPUT'){e.preventDefault();tvAlert()}},true);
function beep(){try{const a=new AudioContext(),o=a.createOscillator();o.connect(a.destination);o.frequency.value=880;o.start();setTimeout(()=>{o.stop();a.close()},350)}catch(e){}}
setInterval(()=>{const now=Date.now();V.alerts.forEach(a=>{if(a.done)return;if(a.exp&&now>a.exp){a.done=1;return}
 charts.forEach(c=>{if(c.cfg.sym!==a.sym||!c.ag||!c.ag.length||!c.s)return;const p=c.ag[c.ag.length-1].close,q=a.prev;
  let hit=false;if(q!=null){hit=a.op==='x'?(q-a.v)*(p-a.v)<=0&&q!==p:a.op==='xu'?q<a.v&&p>=a.v:a.op==='xd'?q>a.v&&p<=a.v:a.op==='gt'?p>a.v&&q<=a.v:q>=a.v&&p<a.v}
  a.prev=p;if(hit){say('🔔 '+a.msg);beep();if('Notification'in window&&Notification.permission==='granted')new Notification(a.msg);if(a.tr==='once')a.done=1;save()}
  c._al=c._al||{};const L=c._al[a.id];if(a.done){if(L){try{L.l.applyOptions({price:NaN});c.s.removePriceLine(L.l)}catch(e){}delete c._al[a.id]}}else if(!L||L.s!==c.s){try{c._al[a.id]={s:c.s,l:c.s.createPriceLine({price:a.v,color:'#ff9800',lineWidth:1,lineStyle:2,axisLabelVisible:true,title:'🔔'})}}catch(e){}}})})},1000);

/* ---------- 6. Replay bar + cut line ---------- */
const rb=D.createElement('div');rb.id='tvrp';rb.innerHTML=`<button data-a=cut>✂ Select bar</button><span class=sp></span><button data-a=play>▶</button><button data-a=step>⏭</button><span class=sp></span><select id=tvrs></select><span id=tvrt style="color:#9aa0b0"></span><span class=sp></span><button data-a=live title="Jump to real-time">⏩</button><button data-a=x>✕</button>`;D.body.appendChild(rb);
const rs=$('#rs'),tvrs=rb.querySelector('#tvrs');if(rs)tvrs.innerHTML=[...rs.options].map(o=>`<option value="${o.value}">${o.textContent}</option>`).join('');
tvrs.onchange=()=>{rs.value=tvrs.value;const c=A();if(c.pl){$('#rpl').click();$('#rpl').click()}};
rb.onclick=e=>{const a=e.target.dataset.a,c=A();if(!a)return;
 if(a==='cut'){c._cut=true;say('Chart එකේ පටන් ගන්න candle එක click කරන්න')}
 else if(a==='play')$('#rpl').click();else if(a==='step')$('#rf').click();
 else if(a==='live'&&c.rp!=null){c.step(c.ag.length-c.rp)}else if(a==='x')$('#rp').click()};
setInterval(()=>{const c=A(),on=c&&c.rp!=null;rb.style.display=on?'flex':'none';if(on){rb.querySelector('[data-a=play]').textContent=c.pl?'⏸':'▶';rb.querySelector('#tvrt').textContent=String(c.cfg.tf);tvrs.value=rs.value}
 charts.forEach(x=>{const cv=x.host&&x.host.querySelector('.cv');if(!cv)return;cv.classList.toggle('tvsc',!!x._cut);
  if(!x._tvl||!x._tvl.isConnected){x._tvl=D.createElement('div');x._tvl.className='tvcut';cv.appendChild(x._tvl);cv.addEventListener('mousemove',ev=>{if(x._cut){x._tvl.style.display='block';x._tvl.style.left=(ev.clientX-cv.getBoundingClientRect().left)+'px'}});cv.addEventListener('mouseleave',()=>x._tvl.style.display='none')}
  if(!x._cut)x._tvl.style.display='none'})},200);

/* ---------- 7. bottom range buttons ---------- */
const rg=D.createElement('div');rg.id='tvrg';rg.innerHTML=['1D','5D','1M','3M','6M','YTD','1Y','5Y','All'].map(x=>`<button>${x}</button>`).join('');D.body.appendChild(rg);
rg.onclick=e=>{if(e.target.tagName!=='BUTTON')return;const c=A(),a=c.view();if(!a.length)return;const last=a[a.length-1].time,d=864e2,k=e.target.textContent;
 const sec={'1D':d,'5D':5*d,'1M':30*d,'3M':91*d,'6M':182*d,'1Y':365*d,'5Y':1826*d}[k],from=k==='YTD'?Date.UTC(new Date(last*1000).getUTCFullYear(),0,1)/1000:last-(sec||0);
 try{if(k==='All'||from<=a[0].time)c.c.timeScale().fitContent();else c.c.timeScale().setVisibleRange({from,to:last+(c.tfm||1)*60*5})}catch(err){c.c.timeScale().fitContent()}};
})();
