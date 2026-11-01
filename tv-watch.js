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
})();
