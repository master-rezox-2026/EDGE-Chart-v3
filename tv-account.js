/* TV Account - load LAST (after tv-settings.js). TradingView-style avatar at the far left of the top bar
   with the account menu: user, Home, Help Center, What's new, App settings, Drawings panel toggle, Language, Keyboard shortcuts, Log out.
   Hides the old bottom-right "Logout" chip from tv-auth.js (its logout code is reused). */
(()=>{
const D=document,$=s=>D.querySelector(s),bar=$('#etop');
if(typeof S==='undefined'||!bar)return;
const V=S.tv=S.tv||{};
const css=D.createElement('style');css.textContent=`
#tvuser{display:none!important}
body.tvno-dp #ltb{display:none!important}
#tvav{position:relative;flex:none;width:30px;height:30px;border-radius:50%;margin:0 8px 0 2px;cursor:pointer;color:#fff;font:700 14px system-ui;display:flex;align-items:center;justify-content:center;user-select:none}
#tvav:hover{box-shadow:0 0 0 3px rgba(255,255,255,.18)}
#tvav b{position:absolute;right:-6px;top:-6px;min-width:16px;height:16px;border-radius:8px;background:#f23645;color:#fff;font:700 10px/16px system-ui;text-align:center;padding:0 4px;box-sizing:border-box}
#tvam{position:fixed;z-index:700;left:6px;top:44px;width:264px;background:#0f0f0f;border:1px solid #2a2a2a;border-radius:10px;box-shadow:0 12px 40px #000;padding:6px 0;font:14.5px system-ui;color:#d1d4dc;display:none}
#tvam .lg{display:flex;align-items:center;gap:8px;padding:12px 16px 12px;font-weight:800;font-size:19px;color:#fff;letter-spacing:.2px}#tvam .lg i{color:#e6b422;font-style:normal}#tvam .lg small{font-weight:600;font-size:17px}
#tvam hr{border:0;border-top:1px solid #2a2a2a;margin:6px 0}
#tvam .it{display:flex;align-items:center;gap:14px;height:40px;padding:0 16px;cursor:pointer;white-space:nowrap}#tvam .it:hover{background:#1e1e1e}
#tvam .it svg{width:20px;height:20px;flex:none;color:#d1d4dc}#tvam .it .sp{flex:1}#tvam .it .rt{color:#868993;font-size:14px}
#tvam .it.me .av{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:700 12px system-ui;color:#fff;flex:none}
#tvam .it.me{font-weight:600;color:#fff}#tvam .it.out,#tvam .it.out svg{color:#f23645}
#tvam .bg{background:#f23645;color:#fff;border-radius:9px;font:700 11px system-ui;padding:1px 7px}
#tvam .tg{width:42px;height:24px;border-radius:12px;background:#4a4a4a;position:relative;flex:none;transition:.15s}#tvam .tg::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.15s}
#tvam .tg.on{background:#2962ff}#tvam .tg.on::after{left:21px}
.tvh{position:fixed;inset:0;z-index:720;background:#0008;display:flex;align-items:center;justify-content:center;font:14px system-ui;color:#d1d4dc}
.tvh .bx{background:#1e1e1e;border-radius:12px;width:520px;max-width:94vw;max-height:84vh;overflow:auto;padding:20px 24px;box-shadow:0 12px 40px #000}
.tvh h3{margin:0 0 14px;color:#fff;font-size:19px;display:flex;justify-content:space-between}.tvh h3 span{cursor:pointer;color:#9aa0b0}
.tvh .r{display:flex;justify-content:space-between;gap:20px;padding:8px 0;border-bottom:1px solid #2a2a2a}.tvh kbd{background:#2a2e39;border-radius:5px;padding:2px 8px;font:12px system-ui;color:#fff;white-space:nowrap}
.tvh p{margin:0 0 10px;line-height:1.5}.tvh b{color:#fff}`;D.head.appendChild(css);

const ic=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const IC={home:ic('<path d="M4 11l8-7 8 7M6 10v10h12V10"/>'),help:ic('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-.8.6-1.5 1-1.5 2M12 17v.5"/>'),
 neu:ic('<path d="M13 3L5 13h6l-1 8 8-10h-6z"/>'),cog:ic('<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><circle cx="12" cy="12" r="3"/>'),
 dp:ic('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 4v16"/>'),lang:ic('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'),
 kb:ic('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/>'),out:ic('<path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9"/>')};

const NEWS=['TradingView-style Settings dialog (7 tabs, templates)','Account menu with Drawings-panel toggle and shortcuts','Mobile drawing mode with crosshair trackpad','CEX Screener for Binance USDT/USDC perpetuals','Cloud sync of layouts, drawings and settings'];
const sess=()=>{try{return JSON.parse(localStorage.getItem('tv_sess'))}catch(e){return null}};
const hue=s=>{let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))%360;return`hsl(${h},45%,45%)`};
const unseen=()=>Math.max(0,NEWS.length-(+V.wnSeen||0));

const av=D.createElement('div');av.id='tvav';bar.prepend(av);
const menu=D.createElement('div');menu.id='tvam';D.body.appendChild(menu);
function paint(){const s=sess(),e=(s&&s.email)||'',l=(e[0]||'?').toUpperCase();
 av.style.background=e?hue(e):'#555';av.innerHTML=l+(unseen()?`<b>${unseen()}</b>`:'');av.title=e||'Not signed in'}
function modal(h,b){const m=D.createElement('div');m.className='tvh';m.innerHTML=`<div class=bx><h3>${h}<span>✕</span></h3>${b}</div>`;
 m.onmousedown=e=>{if(e.target===m)m.remove()};m.querySelector('h3 span').onclick=()=>m.remove();D.addEventListener('keydown',function k(e){if(e.key==='Escape'){m.remove();D.removeEventListener('keydown',k)}});D.body.appendChild(m)}
const SC=[['Alt + T','Trend line'],['Alt + H','Horizontal line'],['Alt + J','Horizontal ray'],['Alt + V','Vertical line'],['Alt + C','Cross line'],['Alt + F','Fib retracement'],['Alt + Shift + R','Rectangle'],['Alt + R','Reset chart view'],['Alt + A','Add alert'],['Ctrl + Z / Ctrl + Y','Undo / redo drawing'],['Ctrl + D','Duplicate drawing'],['Del','Delete selected drawing'],['Enter','Finish drawing'],['Esc','Cancel tool / close dialog'],['Ctrl + / ','Keyboard shortcuts']];
const shortcuts=()=>modal('Keyboard shortcuts',SC.map(x=>`<div class=r><span>${x[1]}</span><kbd>${x[0]}</kbd></div>`).join(''));
const helpC=()=>modal('Help Center',`<p><b>Symbols:</b> type e.g. <b>BTCUSDT</b> in the top search box and press Enter (Binance USDT-M perpetuals).</p><p><b>Drawing:</b> pick a tool on the left toolbar; click the ▸ edge or right-click it for the fly-out menu. Double-click a drawing for its settings.</p><p><b>Settings:</b> gear icon, double-click the chart, or right-click → Settings.</p><p><b>Phone:</b> drag to move the crosshair, tap to place a point.</p><p><b>Cloud:</b> your layouts, drawings and settings sync to your account automatically.</p>`);
const whatsNew=()=>{modal("What's new",`<p>${NEWS.map(n=>'• '+n).join('</p><p>')}</p>`);V.wnSeen=NEWS.length;save();paint()};

function build(){const s=sess(),e=(s&&s.email)||'Not signed in',nm=e.split('@')[0],dp=!D.body.classList.contains('tvno-dp');
 menu.innerHTML=`<div class=lg><i>◆</i>EDGE <small>Charts</small></div><hr>
 <div class="it me"><span class=av style="background:${s?hue(e):'#555'}">${(e[0]||'?').toUpperCase()}</span>${nm}<span class=sp></span><span class=rt>›</span></div>
 <div class=it data-a=home>${IC.home}Home</div><div class=it data-a=help>${IC.help}Help Center</div>
 <div class=it data-a=new>${IC.neu}What's new<span class=sp></span>${unseen()?`<span class=bg>${unseen()}</span>`:''}</div><hr>
 <div class=it data-a=set>${IC.cog}App settings…</div>
 <div class=it data-a=dp>${IC.dp}Drawings panel<span class=sp></span><span class="tg${dp?' on':''}"></span></div>
 <div class=it style="cursor:default">${IC.lang}Language<span class=sp></span><span class=rt>English ›</span></div>
 <div class=it data-a=kb>${IC.kb}Keyboard shortcuts<span class=sp></span><span class=rt>Ctrl + /</span></div><hr>
 <div class="it out" data-a=out>${IC.out}${s?'Log out':'Log in'}</div>`}
const close=()=>menu.style.display='none';
av.onclick=e=>{e.stopPropagation();if(menu.style.display==='block'){close();return}build();menu.style.display='block'};
D.addEventListener('mousedown',e=>{if(menu.style.display==='block'&&!menu.contains(e.target)&&!av.contains(e.target))close()},true);
D.addEventListener('keydown',e=>{if(e.key==='Escape')close();if((e.ctrlKey||e.metaKey)&&e.key==='/'){e.preventDefault();shortcuts()}});
menu.onclick=e=>{const a=(e.target.closest('[data-a]')||{dataset:{}}).dataset.a;if(!a)return;
 if(a==='dp'){D.body.classList.toggle('tvno-dp');V.dpOff=+D.body.classList.contains('tvno-dp');save();window.dispatchEvent(new Event('resize'));build();return}
 close();
 if(a==='home')location.href=location.pathname;
 else if(a==='help')helpC();else if(a==='new')whatsNew();else if(a==='kb')shortcuts();
 else if(a==='set')window.tvSettings&&tvSettings();
 else if(a==='out'){const c=$('#tvuser');if(c)c.click();else location.reload()}};
if(V.dpOff)D.body.classList.add('tvno-dp');
paint();setInterval(paint,2000);
})();
