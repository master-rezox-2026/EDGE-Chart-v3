/* TV Watch - load AFTER tv-extras4.js. Watchlist: "＋" symbol search dialog + sortable Symbol / Last / Chg% header. */
(()=>{
const D=document,$=s=>D.querySelector(s);
if(typeof S==='undefined'||!$('#wl')||!$('#wln'))return;
const css=D.createElement('style');css.textContent=`
#tvwa{background:#1e222d;border:1px solid #2a3042;color:#d1d4dc;border-radius:6px;padding:0 12px;cursor:pointer;font-size:16px}#tvwa:hover{background:#2a3042;color:#e6b422}
#tvwh{display:grid;grid-template-columns:1fr 1fr 70px;gap:6px;padding:4px 8px;color:#7b8194;font-size:11px;border-bottom:1px solid #232836;margin-bottom:4px}#tvwh span{cursor:pointer;user-select:none}#tvwh span:hover{color:#fff}#tvwh span:nth-child(n+2){text-align:right}
#tvwd{position:fixed;inset:0;z-index:660;background:#0008;display:flex;align-items:flex-start;justify-content:center;padding-top:8vh;font:13px system-ui;color:#d1d4dc}
#tvwd .bx{width:640px;max-width:96vw;max-height:82vh;background:#141414;border-radius:12px;display:flex;flex-direction:column;box-shadow:0 12px 40px #000}
#tvwd .tp{padding:14px 18px;border-bottom:1px solid #2a2a2a}#tvwd input{width:100%;background:transparent;border:0;outline:0;color:#fff;font:17px system-ui}
#tvwd .ch{padding:10px 18px 4px;display:flex;gap:8px}#tvwd .ch button{background:#222;border:0;color:#d1d4dc;border-radius:16px;padding:6px 14px;cursor:pointer}#tvwd .ch button.on{background:#fff;color:#111;font-weight:600}
#tvwd .ls{overflow:auto;flex:1;padding:6px 0}#tvwd .r{display:flex;align-items:center;gap:12px;padding:9px 18px;cursor:pointer}#tvwd .r:hover{background:#242833}
#tvwd .r b{display:block;color:#fff;font-size:15px;font-weight:500}#tvwd .r small{color:#8b91a3}#tvwd .r small i{font-style:normal;background:#2a2a2a;border-radius:3px;padding:1px 5px;margin-left:6px;font-size:9px;color:#9aa0b0}
#tvwd .r .x{margin-left:auto;font-size:22px;color:#9aa0b0;width:28px;text-align:center}#tvwd .r .x.on{color:#26a69a}#tvwd .r .x:hover{color:#fff}`;D.head.appendChild(css);

/* ---- sortable header ---- */
const hd=D.createElement('div');hd.id='tvwh';hd.innerHTML='<span data-k=n>Symbol</span><span data-k=p>Last</span><span data-k=c>Chg%</span>';$('#wli').before(hd);
let sk='',sd=1;
const val=(x,k)=>{if(k==='n')return x.s.replace(/^[A-Za-z0-9]+:/,'').toUpperCase();const el=D.getElementById('p_'+x.s);if(!el)return null;
 if(k==='p'){const v=parseFloat(el.firstChild&&el.firstChild.textContent);return isNaN(v)?null:v}const sm=el.querySelector('small'),v=sm?parseFloat(sm.textContent):NaN;return isNaN(v)?null:v};
hd.onclick=e=>{const k=e.target.dataset.k;if(!k)return;if(sk===k)sd=-sd;else{sk=k;sd=k==='n'?1:-1}
 cur().sort((a,b)=>{const x=val(a,k),y=val(b,k);if(x==null&&y==null)return 0;if(x==null)return 1;if(y==null)return -1;return sd*(x>y?1:x<y?-1:0)});save();wlDraw();
 hd.children[0].textContent='Symbol'+(sk==='n'?(sd>0?' ↑':' ↓'):'');hd.children[1].textContent='Last'+(sk==='p'?(sd>0?' ↑':' ↓'):'');hd.children[2].textContent='Chg%'+(sk==='c'?(sd>0?' ↑':' ↓'):'')};

/* ---- "＋" add-symbol dialog ---- */
const plus=D.createElement('button');plus.id='tvwa';plus.title='Add symbol to this list';plus.textContent='＋';$('#wln').before(plus);
plus.onclick=async()=>{let tab='perp',data=[];const m=D.createElement('div');m.id='tvwd';
 m.innerHTML='<div class=bx><div class=tp><input placeholder="Symbol (BTC, ETHUSDT, EURUSD ...)" spellcheck=false></div><div class=ch><button data-t=perp class=on>Crypto · Binance · Swap</button><button data-t=fx>Forex</button></div><div class=ls></div></div>';D.body.appendChild(m);
 const q=m.querySelector('input'),ls=m.querySelector('.ls');q.focus();const has=s=>cur().some(x=>x.s===s);
 const desc=n=>{const b=n.replace(/\.P$/,'').replace(/(USDT|USDC)$/,'');return b+' / '+(/USDC\.P$/.test(n)?'USD Coin':'TetherUS')+' PERPETUAL CONTRACT'};
 const draw=()=>{const k=q.value.trim().toUpperCase().replace(/^BF:|^FX:/,'');const L=data.filter(x=>!k||x.n.toUpperCase().includes(k)).slice(0,300);
  ls.innerHTML=L.length?L.map(x=>`<div class=r data-s="${x.s}"><div><b>${x.n}</b><small>${tab==='perp'?desc(x.n)+'<i>SWAP CRYPTO</i>':'Forex'}</small></div><span class="x${has(x.s)?' on':''}">${has(x.s)?'✓':'＋'}</span></div>`).join(''):'<div class=r>Loading / no results…</div>'};
 const load=async()=>{data=[];draw();try{data=tab==='perp'?await window.tvPerps():FXLIST.map(s=>({s:'FX:'+s,n:s}))}catch(e){ls.innerHTML='<div class=r>Load failed: '+(e.message||e)+'</div>';return}draw()};
 m.querySelector('.ch').onclick=e=>{const t=e.target.dataset.t;if(!t)return;tab=t;m.querySelectorAll('.ch button').forEach(b=>b.classList.toggle('on',b===e.target));load()};
 ls.onclick=e=>{const r=e.target.closest('[data-s]');if(!r)return;const s=r.dataset.s;if(has(s)){const i=cur().findIndex(x=>x.s===s);cur().splice(i,1)}else cur().push({s,l:'',c:0});save();wlDraw();draw()};
 q.oninput=draw;q.onkeydown=e=>{if(e.key==='Escape')m.remove();if(e.key==='Enter'){const f=ls.querySelector('[data-s]');if(f)f.click()}};m.onmousedown=e=>{if(e.target===m)m.remove()};load()};

/* ================= TradingView-style Watchlist panel ================= */
const V=S.tv=S.tv||{};V.wlc=V.wlc||{};
const st=D.createElement('style');st.textContent=`
#wl{background:#0c0c0c;color:#d1d4dc;font:14px system-ui}
#wl>.sh:nth-child(1){display:flex;align-items:center;gap:4px;padding:8px 2px 4px!important}
#wl>.sh:nth-child(2){display:none!important}
#wls{appearance:none;flex:1;background:transparent url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='7' fill='none' stroke='%23d1d4dc' stroke-width='1.6'><path d='M1 1l4 4 4-4'/></svg>") right 6px center no-repeat;border:0;color:#fff;font:700 17px system-ui;cursor:pointer;padding:6px 22px 6px 6px;max-width:190px;text-overflow:ellipsis}
#wln{display:none!important}
#tvwa,#tvwm{background:transparent!important;border:0!important;color:#d1d4dc!important;font-size:22px!important;line-height:1;width:34px;height:34px;padding:0!important;border-radius:6px!important;cursor:pointer}#tvwa:hover,#tvwm:hover{background:#242833!important;color:#fff!important}
#tvwh{display:grid;grid-template-columns:26px minmax(0,1.1fr) minmax(0,1.6fr) 8px;gap:6px;padding:8px 8px 6px;color:#9aa0b0;font-size:13px;border-bottom:1px solid #1d1d1d;margin:0}
#tvwh span{cursor:pointer}#tvwh span:nth-child(1){grid-column:1/3}#tvwh .lc{display:flex;justify-content:space-between;grid-column:3/4}
#wli .it{display:grid!important;grid-template-columns:26px minmax(0,1.1fr) minmax(0,1.6fr) 14px;gap:6px;align-items:center;padding:0 8px!important;height:32px;border:1px solid transparent;border-radius:6px;cursor:pointer;background:transparent!important;margin:0!important;position:relative}
#wli .it:hover{background:#1a1a1a!important}#wli .it.sel{border-color:#d1d4dc}
#wli .it .dot,#wli .it .lb{display:none!important}#wli .it>span:nth-child(3){color:#fff;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#wli .it .pr{display:flex!important;justify-content:space-between;align-items:center;gap:6px;font-variant-numeric:tabular-nums;font-size:14px;color:#d1d4dc;text-align:right}
#wli .it .pr small{font-size:14px!important;margin:0!important}#wli .it .pr:has(small.up){color:#26a69a}#wli .it .pr:has(small.dn){color:#ef5350}
#wli .it [data-a=x]{opacity:0;font-size:12px;text-align:center}#wli .it:hover [data-a=x]{opacity:1}
.tvic{width:20px;height:20px;border-radius:50%;object-fit:cover;flex:none}.tvia{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:700 9px system-ui;color:#fff}
.tvg{display:flex;align-items:center;gap:8px;padding:10px 8px 6px;color:#9aa0b0;font-size:11px;letter-spacing:.4px;cursor:pointer;user-select:none}.tvg i{font-style:normal;display:inline-block;transition:transform .15s}.tvg.c i{transform:rotate(-90deg)}
#tvwd2{border-top:1px solid #1d1d1d;margin-top:10px;padding:14px 10px;color:#d1d4dc}#tvwd2 .t{display:flex;align-items:center;gap:10px;font:700 16px system-ui;color:#fff}#tvwd2 .t .tvic,#tvwd2 .t .tvia{width:30px;height:30px;font-size:12px}
#tvwd2 .s{color:#9aa0b0;font-size:12px;margin:8px 0 2px}#tvwd2 .p{font:600 34px system-ui;margin:14px 0 2px;font-variant-numeric:tabular-nums}#tvwd2 .p small{font-size:13px;color:#9aa0b0;font-weight:400;margin-left:4px}
#tvwd2 .c{font:600 17px system-ui}#tvwd2 .mo{color:#26a69a;font-size:13px;margin:6px 0 14px}#tvwd2 .mo:before{content:'●';margin-right:6px;font-size:10px}
#tvwd2 .v{display:flex;justify-content:space-between;color:#9aa0b0;font-size:12px}#tvwd2 .v b{color:#fff;font-weight:500;display:block;font-size:14px;margin-top:2px}#tvwd2 .bar{height:6px;border-radius:3px;background:#22d3ee;margin-top:8px;overflow:hidden}#tvwd2 .bar div{height:100%;background:#2962ff}
.tvwmenu{position:fixed;z-index:700;background:#1e1e1e;border:1px solid #2a2a2a;border-radius:8px;padding:6px 0;min-width:190px;font:14px system-ui;color:#d1d4dc;box-shadow:0 8px 24px #000a}.tvwmenu div{padding:9px 16px;cursor:pointer}.tvwmenu div:hover{background:#2a2e39}`;D.head.appendChild(st);

/* header: ＋  ⋯ ; sortable column header (replaces the earlier one) */
const old=$('#tvwh');if(old)old.remove();
const hd2=D.createElement('div');hd2.id='tvwh';hd2.innerHTML='<span data-k=n>Symbol</span><span data-k=p class=lc>Last</span><span data-k=c style="text-align:right">Chg%</span>';
hd2.innerHTML='<span data-k=n>Symbol</span><span class=lc><span data-k=p>Last</span><span data-k=c>Chg%</span></span><span></span>';$('#wli').before(hd2);
hd2.style.gridTemplateColumns='26px minmax(0,1.1fr) minmax(0,1.6fr) 14px';hd2.children[0].style.gridColumn='1/3';
hd2.onclick=e=>{const k=e.target.dataset.k;if(!k)return;if(sk===k)sd=-sd;else{sk=k;sd=k==='n'?1:-1}
 cur().sort((a,b)=>{const x=val(a,k),y=val(b,k);if(x==null&&y==null)return 0;if(x==null)return 1;if(y==null)return -1;return sd*(x>y?1:x<y?-1:0)});save();wlDraw();
 hd2.querySelector('[data-k=n]').textContent='Symbol'+(sk==='n'?(sd>0?' ↑':' ↓'):'');hd2.querySelector('[data-k=p]').textContent='Last'+(sk==='p'?(sd>0?' ↑':' ↓'):'');hd2.querySelector('[data-k=c]').textContent='Chg%'+(sk==='c'?(sd>0?' ↑':' ↓'):'')};
const mb=D.createElement('button');mb.id='tvwm';mb.textContent='⋯';mb.title='List actions';$('#tvwa').after(mb);
mb.onclick=e=>{e.stopPropagation();const r=mb.getBoundingClientRect(),m=D.createElement('div');m.className='tvwmenu';
 m.innerHTML='<div data-a=new>Create new list…</div><div data-a=ren>Rename list…</div><div data-a=del>Delete list</div><div data-a=clr>Clear list</div>';D.body.appendChild(m);m.style.top=r.bottom+4+'px';m.style.left=Math.max(4,r.right-m.offsetWidth)+'px';
 const off=()=>{m.remove();D.removeEventListener('mousedown',off,true)};setTimeout(()=>D.addEventListener('mousedown',off,true),0);
 m.onmousedown=ev=>ev.stopPropagation();
 m.onclick=ev=>{const a=ev.target.dataset.a;if(!a)return;m.remove();
  if(a==='new')$('#wln').click();
  else if(a==='ren'){const n=prompt('Rename list',S.wlc);if(n&&n!==S.wlc&&!S.wl[n]){S.wl[n]=S.wl[S.wlc];delete S.wl[S.wlc];S.wlc=n;save();wlDraw()}}
  else if(a==='del'){if(Object.keys(S.wl).length>1&&confirm('Delete list "'+S.wlc+'"?')){delete S.wl[S.wlc];S.wlc=Object.keys(S.wl)[0];save();wlDraw()}}
  else if(a==='clr'){if(confirm('Remove all symbols from this list?')){S.wl[S.wlc]=[];save();wlDraw()}}}};

/* decorate rows: logo, readable name, exchange sections (collapsible), selected highlight */
const GN={BF:'BINANCE FUTURES',BN:'BINANCE SPOT',FX:'FOREX',MT5:'MT5'},GO=['BINANCE FUTURES','BINANCE SPOT','FOREX','MT5'];
const grp=s=>{const m=/^([A-Za-z0-9]+):/.exec(s);if(!m)return/USDT|USDC|BUSD|BTC$/i.test(s)?'BINANCE SPOT':'OTHER';return GN[m[1].toUpperCase()]||m[1].toUpperCase()};
const disp=s=>{const m=/^([A-Za-z0-9]+):(.*)$/.exec(s);if(!m)return s;return m[1].toUpperCase()==='BF'?m[2]+'.P':m[2]};
const baseOf=s=>{let b=s.replace(/^[A-Za-z0-9]+:/,'').replace(/\.P$/,'');b=b.replace(/(USDT|USDC|BUSD|USD)$/,'').replace(/^1000+/,'');return b};
const hue=s=>{let h=0;for(const ch of s)h=(h*31+ch.charCodeAt(0))%360;return h};
function icon(sym){const raw=sym.replace(/^[A-Za-z0-9]+:/,'').toUpperCase(),crypto=/^([A-Za-z0-9]+:)?[A-Z0-9]+(USDT|USDC|BUSD)(\.P)?$/i.test(sym)||/^BF:/i.test(sym),b=baseOf(sym),w=D.createElement('span');w.style.cssText='display:flex;align-items:center;justify-content:center';
 const fb=()=>{w.innerHTML='';const a=D.createElement('span');a.className='tvia';a.style.background=`hsl(${hue(raw)},45%,38%)`;a.textContent=b.slice(0,2).toUpperCase()||raw.slice(0,2);w.appendChild(a)};
 if(crypto&&b){const im=D.createElement('img');im.className='tvic';im.src=`https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/32/color/${b.toLowerCase()}.png`;im.onerror=fb;w.appendChild(im)}else fb();return w}
function decorate(){const L=$('#wli');if(!L)return;const items=[...L.querySelectorAll(':scope>.it')];if(!items.length)return;const list=cur();
 items.forEach(it=>{const x=list[+it.dataset.i];if(!x)return;if(!it.querySelector('.tvic,.tvia')){it.prepend(icon(x.s));const sp=it.children[2];if(sp&&sp.firstChild&&sp.firstChild.nodeType===3)sp.firstChild.nodeValue=disp(x.s)}});
 const by={};items.forEach(it=>{const x=list[+it.dataset.i];if(!x)return;(by[grp(x.s)]=by[grp(x.s)]||[]).push(it)});
 L.querySelectorAll('.tvg').forEach(g=>g.remove());const order=[...GO,...Object.keys(by).filter(k=>!GO.includes(k))];
 order.forEach(g=>{if(!by[g])return;const h=D.createElement('div');h.className='tvg'+(V.wlc[g]?' c':'');h.dataset.g=g;h.innerHTML='<i>⌄</i>'+g;L.appendChild(h);by[g].forEach(it=>{it.style.display=V.wlc[g]?'none':'';L.appendChild(it)})})}
$('#wli').addEventListener('click',e=>{const g=e.target.closest('.tvg');if(!g)return;e.stopPropagation();V.wlc[g.dataset.g]=V.wlc[g.dataset.g]?0:1;save();decorate()},true);
const _w=wlDraw;wlDraw=function(){const r=_w.apply(this,arguments);try{decorate()}catch(e){}return r};
decorate();
setInterval(()=>{const c=(typeof act!=='undefined'&&act)||null;if(!c)return;const sym=c.cfg.sym;$('#wli').querySelectorAll('.it').forEach(it=>{const x=cur()[+it.dataset.i];it.classList.toggle('sel',!!x&&(x.s===sym||x.s==='BF:'+c.name&&c.src==='BF'))})},600);

/* detail panel for the active symbol */
const dp=D.createElement('div');dp.id='tvwd2';$('#wli').after(dp);
const nf=v=>v>=1e9?(v/1e9).toFixed(2)+'B':v>=1e6?(v/1e6).toFixed(2)+'M':v>=1e3?(v/1e3).toFixed(2)+'K':v.toFixed(2);
let dsym='',dstats=null,dt=0;
async function detail(){const c=(typeof act!=='undefined'&&act)||null;if(!c||!c.ag||!c.ag.length)return;const bin=c.src==='BF'||c.src==='BN';
 if(bin&&(dsym!==c.cfg.sym||Date.now()-dt>5000)){dsym=c.cfg.sym;dt=Date.now();const fut=c.src==='BF',base=fut?'https://fapi.binance.com/fapi/v1':'https://api.binance.com/api/v3';
  try{const[t,k]=await Promise.all([jget(`${base}/ticker/24hr?symbol=${c.name}`),jget(`${base}/klines?symbol=${c.name}&interval=1d&limit=31`)]);
   const vols=(Array.isArray(k)?k.slice(0,-1):[]).map(x=>+x[5]);dstats={sym:c.cfg.sym,ch:+t.priceChange,pc:+t.priceChangePercent,vol:+t.volume,avg:vols.length?vols.reduce((s,x)=>s+x,0)/vols.length:0}}catch(e){}}
 const a=c.ag,last=a[a.length-1].close,s=dstats&&dstats.sym===c.cfg.sym?dstats:null,up=s?s.pc>=0:last>=a[a.length-1].open,col=up?'#26a69a':'#ef5350',pr=c.precision||2,txt=last.toFixed(pr),i=txt.length-1,
  nm=c.src==='BF'?c.name+'.P':c.name,b=baseOf(c.cfg.sym),quote=/USDC/.test(c.name)?'USDC':/USD|USDT/.test(c.name)?'USDT':'',exch=c.src==='BF'||c.src==='BN'?'BINANCE':(c.src||'').toUpperCase();
 dp.innerHTML=`<div class=t><span id=tvdi></span>${nm}</div><div class=s>${b} / ${c.src==='BF'?'TetherUS PERPETUAL CONTRACT':nm} · ${exch}</div><div class=s>${c.src==='BF'?'Swap':'Spot'} · ${/USDT|USDC|BUSD|BTC/.test(c.name)?'Crypto':'Forex'}</div>
 <div class=p style="color:#fff">${txt.slice(0,i)}<span style="color:${col}">${txt.slice(i)}</span><small>${quote}</small></div>
 ${s?`<div class=c style="color:${col}">${s.ch>=0?'+':''}${s.ch.toFixed(pr)} &nbsp; ${s.pc>=0?'+':''}${s.pc.toFixed(2)}%</div>`:''}<div class=mo>Market open</div>
 ${s?`<div class=v><div>Volume<b>${nf(s.vol)}</b></div><div style="text-align:right">Avg. volume (30D)<b>${nf(s.avg)}</b></div></div><div class=bar><div style="width:${Math.min(100,Math.round(s.vol/(s.vol+s.avg||1)*100))}%"></div></div>`:''}`;
 $('#tvdi').appendChild(icon(c.cfg.sym))}
setInterval(()=>{try{detail()}catch(e){}},1500);
})();
