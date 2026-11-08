/* TV HTF - load LAST. "ICT HTF Candles (fadi)" indicator: up to 6 higher-timeframe candle groups drawn to the right of the live candles,
   with labels + remaining time, Fair Value Gaps, Volume Imbalances, trace lines and a full Inputs / Style / Visibility settings dialog.
   Add it from Indicators -> "ICT HTF Candles (fadi)". HTF data is fetched from the exchange (or aggregated from the chart's data). */
(()=>{
const D=document,$=s=>D.querySelector(s);
if(typeof S==='undefined'||typeof charts==='undefined'||typeof exCandles==='undefined')return;
const V=S.tv=S.tv||{};
const DEF={h_on:0,h_hide:0,
 h_tf:[{on:0,tf:'5m',n:10},{on:1,tf:'15m',n:10},{on:1,tf:'1h',n:10},{on:1,tf:'4h',n:10},{on:1,tf:'D',n:10},{on:1,tf:'W',n:10}],
 h_lim:6,h_cdo:0,h_cdoH:0,
 h_bu:'#4a6fa5',h_bd:'#a8a3ab',h_ou:'#4a6fa5',h_od:'#a8a3ab',h_wu:'#4a6fa5',h_wd:'#a8a3ab',h_pad:10,h_gap:1,h_hgap:10,h_w:1,h_op:100,
 h_lab:1,h_labC:'#b2b5be',h_labS:'large',h_lpos:'both',h_lal:'align',h_rem:1,h_remC:'#b2b5be',h_remS:'normal',h_iv:0,h_ivC:'#4a5170',h_ivS:'small',
 h_fvg:1,h_fvgC:'#a39a1c',h_fvgA:35,h_vi:1,h_viC:'#2e9e44',h_viA:45,
 h_tr:0,h_tO:'#787b86',h_tOs:'dotted',h_tOw:1,h_tC:'#787b86',h_tCs:'dotted',h_tCw:1,h_tH:'#787b86',h_tHs:'dotted',h_tHw:1,h_tL:'#787b86',h_tLs:'dotted',h_tLw:1,h_anc:'first',
 h_pl:0,h_plC:'#4a5170',h_plS:'small',h_vm:1,h_vh:1,h_vd:1,h_vw:1};
const KEYS=Object.keys(DEF);KEYS.forEach(k=>{if(V[k]===undefined)V[k]=JSON.parse(JSON.stringify(DEF[k]))});
if(!Array.isArray(V.tfc))V.tfc=[];

/* ---------- timeframe maths (case sensitive: m = minute, M = month) ---------- */
const tfInfo=tf=>{tf=String(tf);if(tf==='D')return{min:1440,k:'s',sec:86400};if(tf==='W')return{min:10080,k:'w',sec:604800};
 let m=tf.match(/^(\d*)M$/);if(m){const n=+m[1]||1;return{min:n*43200,k:'M',n}}
 m=tf.match(/^(\d*)(m|h|d|w)$/);if(!m)return null;const mins=(+m[1]||1)*{m:1,h:60,d:1440,w:10080}[m[2]];return{min:mins,k:m[2]==='w'?'w':'s',sec:mins*60}};
const offOf=I=>(V.h_cdo&&I.k!=='M'&&I.sec>=86400)?(+V.h_cdoH||0)*3600:0;
const bStart=(t,I,off)=>{if(I.k==='M'){const d=new Date(t*1000),m=d.getUTCFullYear()*12+d.getUTCMonth(),k=Math.floor(m/I.n)*I.n;return Date.UTC(Math.floor(k/12),k%12,1)/1000}
 if(I.k==='w'){const o=4*86400+off;return Math.floor((t-o)/I.sec)*I.sec+o}
 if(I.sec>=86400)return Math.floor((t-off)/I.sec)*I.sec+off;return Math.floor(t/I.sec)*I.sec};
const bEnd=(s,I)=>{if(I.k==='M'){const d=new Date(s*1000),m=d.getUTCFullYear()*12+d.getUTCMonth()+I.n;return Date.UTC(Math.floor(m/12),m%12,1)/1000}return s+I.sec};
const aggH=(d,I,off)=>{const o=[];for(const x of d){const t=bStart(x.time,I,off),l=o[o.length-1];if(l&&l.time===t){l.high=Math.max(l.high,x.high);l.low=Math.min(l.low,x.low);l.close=x.close}else o.push({time:t,open:x.open,high:x.high,low:x.low,close:x.close})}return o};
const tfName=tf=>{tf=String(tf);if(tf==='D')return '1D';if(tf==='W')return '1W';let m=tf.match(/^(\d*)M$/);if(m)return(m[1]||1)+'M';m=tf.match(/^(\d+)(m|h|d|w)$/);return m?m[1]+(m[2]==='m'?'m':m[2].toUpperCase()):tf};
const hms=s=>{s=Math.max(0,Math.floor(s));const d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),z=n=>String(n).padStart(2,'0');return(d?d+'d ':'')+(d||h?z(h)+':':'')+z(m)+':'+z(s%60)};
const SZ={tiny:8,small:10,normal:12,large:14,huge:18};

/* ---------- data ---------- */
const cache={};
async function loadTf(c,tf,n){const I=tfInfo(tf);if(!I)return[];const off=offOf(I),key=[c.src,c.name,tf,off].join('|'),now=Date.now(),ce=cache[key];
 if(ce&&ce.busy)return ce.d||[];if(ce&&now-ce.t<25000&&ce.n>=n)return ce.d;cache[key]={d:ce&&ce.d,t:ce?ce.t:0,n,busy:1};
 let d=null;try{if(c.src!=='MT5'&&c.src!=='FX'&&XTF[c.src]){const pref=off?60:(I.k==='M'?1440:I.min),nat=NAT.find(x=>x<=pref&&pref%x===0&&XTF[c.src][x]);
   if(nat){const span=I.k==='M'?I.n*31*86400:I.sec,cnt=Math.min(1000,Math.ceil((n+2)*span/(nat*60))+3);d=await exCandles(c.src,c.name,nat,cnt)}}}catch(e){d=null}
 if(!d||!d.length)d=c.raw||[];const r=aggH(d,I,off).slice(-(n+1));cache[key]={d:r,t:Date.now(),n};return r}
setInterval(()=>Object.keys(cache).forEach(k=>{if(cache[k]&&!cache[k].busy)cache[k].t=0}),30000);

/* ---------- active groups for a chart ---------- */
const chartMin=c=>Math.max(1,c.tfm||1);
const visOk=c=>{const m=chartMin(c);return m<60?V.h_vm:m<1440?V.h_vh:m<10080?V.h_vd:V.h_vw};
function groups(c){if(!V.h_on||V.h_hide||!visOk(c))return[];const cm=chartMin(c),out=[];
 V.h_tf.forEach(x=>{if(!x.on)return;const I=tfInfo(x.tf);if(I&&I.min>cm)out.push({tf:x.tf,n:Math.max(1,Math.min(60,+x.n||10)),I,min:I.min})});
 out.sort((a,b)=>a.min-b.min);return out.slice(0,Math.max(1,+V.h_lim||6))}

/* ---------- drawing ---------- */
const LSD={solid:[],dotted:[1.5,3],dashed:[6,4]};
const rgba=(h,a)=>{h=String(h||'#000').replace('#','');if(h.length===3)h=h.replace(/./g,'$&$&');const n=parseInt(h,16)||0;return`rgba(${n>>16&255},${n>>8&255},${n&255},${a/100})`};
function cvs(c){const cv=c.host.querySelector('.cv');if(!cv)return null;let k=c._htfc;if(!k||!k.isConnected){k=c._htfc=D.createElement('canvas');k.className='tvhtf';k.style.cssText='position:absolute;left:0;top:0;pointer-events:none;z-index:2';cv.style.position='relative';cv.appendChild(k);c._htfs=null}return k}
function draw(c){const k=cvs(c);if(!k)return;const gs=groups(c),cv=k.parentNode,ts=c.c&&c.c.timeScale();
 if(!gs.length||!ts||!c.s){if(k._on){k.getContext('2d').clearRect(0,0,k.width,k.height);k._on=0}c._htfNeed=0;return}
 const a=c.view();if(!a.length)return;const now=Date.now(),W=cv.clientWidth,H=cv.clientHeight,bsP=ts.options().barSpacing||6;
 c._hd=c._hd||{};c._hq=c._hq||{};
 gs.forEach(g=>{const key=g.tf+'|'+g.n+'|'+c.name+'|'+c.src+'|'+V.h_cdo+V.h_cdoH;if(now-(c._hq[key]||0)>25000&&!c._hq[key+'b']){c._hq[key+'b']=1;loadTf(c,g.tf,g.n).then(d=>{c._hd[g.tf]=d;c._hq[key]=Date.now();c._hq[key+'b']=0;c._htfv=(c._htfv||0)+1}).catch(()=>{c._hq[key+'b']=0;c._hq[key]=Date.now()})}});
 const pad=+V.h_pad,w=+V.h_w||1,gap=+V.h_gap,hg=+V.h_hgap;let cells=pad;gs.forEach(g=>{g.cs=(c._hd[g.tf]||[]).slice(-g.n);cells+=g.cs.length*(w+gap)+hg});
 let unit=bsP;if(cells*unit>W*.55)unit=Math.max(1.2,W*.55/cells);
 const need=cells*unit/bsP+1;if(Math.abs((c._htfNeed||0)-need)>.5){c._htfNeed=need;try{ts.applyOptions({rightOffset:Math.max(+V.ro||0,need)})}catch(e){}}
 const y0=c.s.priceToCoordinate(a[a.length-1].close),y1=c.s.priceToCoordinate(a[a.length-1].close*1.01),vr=ts.getVisibleLogicalRange();
 const sig=[W,H,y0,y1,vr&&vr.to.toFixed(1),vr&&vr.from.toFixed(1),a.length,c._htfv,Math.floor(now/1000),JSON.stringify([V.h_tf,V.h_lim,V.h_bu,V.h_bd,V.h_fvg,V.h_vi,V.h_tr,V.h_lab,V.h_rem,V.h_iv,V.h_pl,V.h_op,V.h_lpos,V.h_lal,pad,w,gap,hg,V.h_labS,V.h_remS,V.h_ivS,V.h_plS,V.h_anc,V.h_fvgA,V.h_viA,V.h_fvgC,V.h_viC,V.h_labC,V.h_remC,V.h_ivC,V.h_plC,V.h_ou,V.h_od,V.h_wu,V.h_wd,V.h_tO,V.h_tC,V.h_tH,V.h_tL,V.h_tOs,V.h_tCs,V.h_tHs,V.h_tLs,V.h_tOw,V.h_tCw,V.h_tHw,V.h_tLw])].join();
 if(sig===c._htfs)return;c._htfs=sig;k._on=1;
 const dpr=devicePixelRatio||1;if(k.width!==W*dpr||k.height!==H*dpr){k.width=W*dpr;k.height=H*dpr;k.style.width=W+'px';k.style.height=H+'px'}
 let pw=56,th=26;try{pw=c.c.priceScale('right').width()||56;th=ts.height()||26}catch(e){}
 const g=k.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,W,H);g.save();g.beginPath();g.rect(0,0,W-pw,H-th);g.clip();
 const xLast=ts.logicalToCoordinate(a.length-1);if(xLast==null){g.restore();return}
 const Y=p=>c.s.priceToCoordinate(p),U=V.h_op/100;let x=xLast+pad*unit;const last=c.raw&&c.raw[c.raw.length-1],cw=w*unit;
 gs.forEach(G=>{const cs=G.cs.map(o=>({...o}));if(!cs.length){x+=hg*unit;return}
  const lc=cs[cs.length-1],bs=bStart(last?last.time:lc.time,G.I,offOf(G.I));if(last&&bs===lc.time){lc.high=Math.max(lc.high,last.high);lc.low=Math.min(lc.low,last.low);lc.close=last.close}
  const gx0=x,cell=(w+gap)*unit,gEnd=gx0+cs.length*cell-gap*unit;let hiY=1e9,loY=-1e9;
  const X=j=>gx0+j*cell;
  /* imbalances first (under candles) */
  if(V.h_fvg)for(let i=2;i<cs.length;i++){const p0=cs[i-2],p2=cs[i];let top,bot;if(p2.low>p0.high){bot=p0.high;top=p2.low;let f=0;for(let j=i+1;j<cs.length;j++)if(cs[j].low<=bot)f=1;if(f)continue}else if(p2.high<p0.low){top=p0.low;bot=p2.high;let f=0;for(let j=i+1;j<cs.length;j++)if(cs[j].high>=top)f=1;if(f)continue}else continue;
   const ya=Y(top),yb=Y(bot);if(ya==null||yb==null)continue;g.fillStyle=rgba(V.h_fvgC,V.h_fvgA);g.fillRect(X(i-1),Math.min(ya,yb),gEnd-X(i-1),Math.max(1,Math.abs(yb-ya)))}
  if(V.h_vi)for(let i=1;i<cs.length;i++){const p=cs[i-1],q=cs[i],pb=[Math.min(p.open,p.close),Math.max(p.open,p.close)],qb=[Math.min(q.open,q.close),Math.max(q.open,q.close)];let top,bot;
   if(qb[0]>pb[1]&&q.low<=p.high){bot=pb[1];top=qb[0]}else if(qb[1]<pb[0]&&q.high>=p.low){top=pb[0];bot=qb[1]}else continue;
   const ya=Y(top),yb=Y(bot);if(ya==null||yb==null)continue;g.fillStyle=rgba(V.h_viC,V.h_viA);g.fillRect(X(i-1),Math.min(ya,yb),cell*2-gap*unit,Math.max(1,Math.abs(yb-ya)))}
  /* candles */
  g.globalAlpha=U;cs.forEach((o,j)=>{const up=o.close>=o.open,xc=X(j)+cw/2,yo=Y(o.open),yc=Y(o.close),yh=Y(o.high),yl=Y(o.low);if(yo==null||yc==null||yh==null||yl==null)return;
   hiY=Math.min(hiY,yh);loY=Math.max(loY,yl);
   g.strokeStyle=up?V.h_wu:V.h_wd;g.lineWidth=1;g.beginPath();g.moveTo(Math.round(xc)+.5,yh);g.lineTo(Math.round(xc)+.5,yl);g.stroke();
   const bw=Math.max(2,cw*.86),bt=Math.min(yo,yc),bh=Math.max(1,Math.abs(yc-yo));g.fillStyle=up?V.h_bu:V.h_bd;g.fillRect(xc-bw/2,bt,bw,bh);g.strokeStyle=up?V.h_ou:V.h_od;g.strokeRect(xc-bw/2+.5,bt+.5,Math.max(1,bw-1),Math.max(0,bh-1))});
  g.globalAlpha=1;
  /* trace lines of the live HTF candle */
  if(V.h_tr){const o=lc,xs=V.h_anc==='last'?xLast:(()=>{const q=ts.timeToCoordinate(o.time);return q==null?0:q})(),xe=X(cs.length-1)+cw;
   [['O',o.open],['C',o.close],['H',o.high],['L',o.low]].forEach(([n,p])=>{const yy=Y(p);if(yy==null)return;g.strokeStyle=V['h_t'+n];g.lineWidth=+V['h_t'+n+'w']||1;g.setLineDash(LSD[V['h_t'+n+'s']]||[]);g.beginPath();g.moveTo(xs,Math.round(yy)+.5);g.lineTo(xe,Math.round(yy)+.5);g.stroke();g.setLineDash([]);
    if(V.h_pl){g.font=SZ[V.h_plS]+'px system-ui';g.fillStyle=V.h_plC;g.textAlign='left';g.textBaseline='bottom';g.fillText(p.toFixed(c.precision||2),xe+4,yy-1)}})}
  /* labels */
  const cx=(gx0+gEnd)/2,pos=V.h_lpos,fol=V.h_lal==='follow',put=top=>{const it=[];
   if(V.h_lab)it.push([tfName(G.tf),`700 ${SZ[V.h_labS]}px system-ui`,V.h_labC,SZ[V.h_labS]]);
   if(V.h_rem)it.push([hms(bEnd(lc.time,G.I)-now/1000),`${SZ[V.h_remS]}px system-ui`,V.h_remC,SZ[V.h_remS]]);
   if(V.h_iv)it.push([String(G.min),`${SZ[V.h_ivS]}px system-ui`,V.h_ivC,SZ[V.h_ivS]]);
   if(!it.length)return;const tot=it.reduce((s2,q)=>s2+q[3]+3,0),ar=H-th;
   let yy=top?(fol&&hiY<1e8?Math.max(4,hiY-8-tot):4):(fol&&loY>-1e8?Math.min(ar-4-tot,loY+8):ar-4-tot);
   g.textAlign='center';g.textBaseline='top';it.forEach(q=>{g.font=q[1];g.fillStyle=q[2];g.fillText(q[0],cx,yy);yy+=q[3]+3})};
  if(pos==='top'||pos==='both')put(1);if(pos==='bottom'||pos==='both')put(0);
  x=gEnd+(gap+hg)*unit});
 g.restore()}
setInterval(()=>charts.forEach(c=>{try{draw(c)}catch(e){}}),120);

/* ---------- chip on the first chart ---------- */
const css=D.createElement('style');css.textContent=`
.tvhc{position:absolute;left:8px;top:58px;z-index:30;display:none;align-items:center;gap:2px;background:#1c1c1ccc;border:1px solid #2d2d2d;border-radius:8px;color:#d1d4dc;font:12px system-ui;padding:2px 4px 2px 10px}
.tvhc button{all:unset;cursor:pointer;width:24px;height:22px;display:flex;align-items:center;justify-content:center;border-radius:5px;color:#9aa0b0;font-size:13px}.tvhc button:hover{background:#2c2c2c;color:#fff}
.tvh2 .tabs{display:flex;gap:26px;margin:0 22px;padding:0;position:relative;border-bottom:3px solid #3a3a3a}.tvh2 .tabs div{padding:8px 0 10px;margin-bottom:-3px;font-weight:700;font-size:15px;color:#868993;cursor:pointer;border-bottom:3px solid transparent}.tvh2 .tabs div.on{color:#fff;border-color:#fff}
.tvh2 .ct{padding:6px 26px 18px 22px!important}.tvh2 .bx{width:520px!important;max-width:96vw}.tvh2 .rw>label{flex:1}.tvh2 .ctl select{min-width:100px}.tvh2 .ctl input[type=number]{width:100px}.tvh2 .ctl input[type=number].s{width:70px}
.tvh2 .ft .tp{gap:10px}`;D.head.appendChild(css);
function chip(){const c=charts[0];if(!c||!c.host)return;const cv=c.host.querySelector('.cv');if(!cv)return;let h=cv.querySelector('.tvhc');
 if(!h){h=D.createElement('div');h.className='tvhc';h.innerHTML='<span>ICT HTF Candles (fadi)</span><button data-a=eye title="Show / hide">👁</button><button data-a=set title="Settings">⚙</button><button data-a=x title="Remove">✕</button>';cv.appendChild(h);
  h.onmousedown=e=>e.stopPropagation();h.ondblclick=e=>e.stopPropagation();
  h.onclick=e=>{const a=e.target.dataset.a;if(a==='eye'){V.h_hide=+!V.h_hide;save()}else if(a==='set')open();else if(a==='x'){V.h_on=0;save()}}}
 h.style.display=V.h_on?'flex':'none';h.querySelector('[data-a=eye]').style.opacity=V.h_hide?.4:1}
setInterval(chip,400);

/* ---------- settings dialog ---------- */
const OPT=(()=>{const L=[];[['1m','1 minute'],['2m','2 minutes'],['3m','3 minutes'],['5m','5 minutes'],['10m','10 minutes'],['15m','15 minutes'],['30m','30 minutes'],['45m','45 minutes'],['1h','1 hour'],['2h','2 hours'],['3h','3 hours'],['4h','4 hours'],['7h','7 hours'],['D','1 day'],['W','1 week'],['M','1 month'],['3M','3 months'],['6M','6 months'],['12M','12 months']].forEach(x=>L.push(x));return L})();
const tfOpts=()=>{const L=OPT.slice();(V.tfc||[]).forEach(t=>{if(!L.some(x=>x[0]===t))L.push([t,tfName(t)])});L.sort((a,b)=>tfInfo(a[0]).min-tfInfo(b[0]).min);return L};
const SIZES=['tiny','small','normal','large','huge'].map(x=>[x,x]),LST=[['solid','——'],['dotted','····'],['dashed','- - -']],WID=[1,2,3,4].map(x=>[String(x),String(x)]);
const HRS=[['0','Midnight'],...Array.from({length:23},(_,i)=>[String(i+1),(i+1)%12===0?(i+1===12?'12 PM':'12 AM'):((i+1)%12)+((i+1)<12?' AM':' PM')])];
const TABS=['Inputs','Style','Visibility'];
let tab='Inputs';
const sel=(k,o)=>`<select data-k="${k}">${o.map(x=>`<option value="${x[0]}" ${String(V[k])===x[0]?'selected':''}>${x[1]}</option>`).join('')}</select>`;
const sw=(k,a)=>`<span class=sw data-sw=${k} ${a?`data-a=${a}`:''}><i style="background:${a?rgba(V[k],V[a]):V[k]}"></i></span>`;
const num=(k,mn,mx,s)=>`<input type=number class="${s?'s':''}" data-k="${k}" min=${mn} max=${mx} value="${V[k]}">`;
const ck=(k,l,ctl,sub)=>`<div class="rw ${sub?'in':''}"><label><input type=checkbox data-k=${k} ${V[k]?'checked':''}><span>${l}</span></label><div class=ctl>${ctl||''}</div></div>`;
const rw=(l,ctl)=>`<div class="rw lbl"><label><span>${l}</span></label><div class=ctl>${ctl}</div></div>`;
const hh=t=>`<div class=hh>${t}</div>`;
function pane(){const o=tfOpts();
 if(tab==='Inputs')return V.h_tf.map((x,i)=>`<div class=rw><label><input type=checkbox data-t=${i} data-f=on ${x.on?'checked':''}><span>HTF ${i+1}</span></label><div class=ctl><select data-t=${i} data-f=tf>${o.map(q=>`<option value="${q[0]}" ${x.tf===q[0]?'selected':''}>${q[1]}</option>`).join('')}</select><input type=number data-t=${i} data-f=n min=1 max=60 value="${x.n}"></div></div>`).join('')+
  rw('Limit to next HTFs only',num('h_lim',1,6))+ck('h_cdo','Custom daily candle open',sel('h_cdoH',HRS))+
  hh('Styling')+rw('Body',sw('h_bu')+sw('h_bd'))+rw('Borders',sw('h_ou')+sw('h_od'))+rw('Wick',sw('h_wu')+sw('h_wd'))+
  rw('Padding from current candles',num('h_pad',0,100))+rw('Space between candles',num('h_gap',0,20))+rw('Space between Higher Timeframes',num('h_hgap',0,100))+rw('Candle Width',num('h_w',1,10))+
  hh('Label settings')+ck('h_lab','HTF Label',sw('h_labC')+sel('h_labS',SIZES))+rw('Label Positions',sel('h_lpos',[['top','Top'],['bottom','Bottom'],['both','Both']]))+rw('Label Alignment',sel('h_lal',[['align','Align'],['follow','Follow']]))+
  ck('h_rem','Remaining time',sw('h_remC')+sel('h_remS',SIZES))+ck('h_iv','Interval Value',sw('h_ivC')+sel('h_ivS',SIZES))+
  hh('Imbalance')+ck('h_fvg','Fair Value Gap',sw('h_fvgC','h_fvgA'))+ck('h_vi','Volume Imbalance',sw('h_viC','h_viA'))+
  hh('Trace')+ck('h_tr','Trace lines')+[['Open','O'],['Close','C'],['High','H'],['Low','L']].map(([l,n])=>rw(l,sw('h_t'+n)+sel('h_t'+n+'s',LST)+sel('h_t'+n+'w',WID))).join('')+
  rw('Anchor to',sel('h_anc',[['first','First Time'],['last','Last Time']]))+ck('h_pl','Price Label',sw('h_plC')+sel('h_plS',SIZES));
 if(tab==='Style')return hh('Candles')+rw('Opacity',`<input type=range data-k=h_op min=10 max=100 value="${V.h_op}" style="width:190px"><span style="color:#868993">${V.h_op}%</span>`)+`<div class=note>Colors, labels, imbalances and trace lines are set on the Inputs tab.</div>`;
 return hh('Show on timeframes')+ck('h_vm','Minutes')+ck('h_vh','Hours')+ck('h_vd','Days')+ck('h_vw','Weeks / Months')+`<div class=note>Choose the chart timeframe groups where the HTF candles are shown.</div>`}
function open(){D.querySelectorAll('.tvh2').forEach(x=>x.remove());const snap=JSON.stringify(KEYS.map(k=>V[k])),m=D.createElement('div');m.className='tvs tvh2';
 m.innerHTML=`<div class=bx><h3>ICT HTF Candles (fadi)<span data-x>✕</span></h3><div class=tabs></div><div class=ct></div><div class=ft><button class=tp data-d>Defaults ⌄</button><span class=sp></span><button class=cn data-c>Cancel</button><button class=ok data-o>Ok</button></div></div>`;
 D.body.appendChild(m);const tb=m.querySelector('.tabs'),ct=m.querySelector('.ct');
 const draw2=()=>{tb.innerHTML=TABS.map(t=>`<div class="${t===tab?'on':''}" data-t="${t}">${t}</div>`).join('');const y=ct.scrollTop;ct.innerHTML=pane();ct.scrollTop=y};draw2();
 tb.onclick=e=>{const t=e.target.dataset.t;if(t){tab=t;draw2();ct.scrollTop=0}};
 const bump=()=>{charts.forEach(c=>{c._htfs=null;c._hq={}});save()};
 const upd=e=>{const t=e.target;if(t.dataset.t!=null){const x=V.h_tf[+t.dataset.t],f=t.dataset.f;x[f]=f==='on'?!!t.checked:f==='n'?Math.max(1,Math.min(60,+t.value||10)):t.value;bump();return}
  const k=t.dataset.k;if(!k)return;V[k]=t.type==='checkbox'?+t.checked:(t.type==='number'||t.type==='range'||['h_cdoH','h_lim'].includes(k)||/^h_t[OCHL]w$/.test(k))?+t.value:t.value;
  if(k==='h_lim')V[k]=Math.max(1,Math.min(6,V[k]||6));bump();if(e.type==='change'&&k==='h_op')draw2()};
 ct.oninput=e=>{if(e.target.type==='range'||e.target.type==='number')upd(e)};ct.onchange=upd;
 ct.onclick=e=>{const s=e.target.closest('[data-sw]');if(s){e.stopPropagation();window.tvColorPop&&tvColorPop(m,s,(k,v)=>{V[k]=v;bump()},()=>{})}};
 const cancel=()=>{const a=JSON.parse(snap);KEYS.forEach((k,i)=>V[k]=a[i]);bump();m.remove()};
 m.onmousedown=e=>{if(e.target===m)cancel();const cp=m.querySelector('.cpop');if(cp&&!e.target.closest('.cpop')&&!e.target.closest('[data-sw]'))cp.remove()};
 m.querySelector('[data-x]').onclick=cancel;m.querySelector('[data-c]').onclick=cancel;m.querySelector('[data-o]').onclick=()=>{bump();m.remove()};
 m.querySelector('[data-d]').onclick=()=>{if(confirm('Reset HTF Candles settings to defaults?')){KEYS.forEach(k=>{if(k!=='h_on'&&k!=='h_hide')V[k]=JSON.parse(JSON.stringify(DEF[k]))});bump();draw2()}}}

/* ---------- Indicators dialog entry ---------- */
const add=()=>{const ls=$('#tvil');if(!ls||ls._htf)return;ls._htf=1;
 const inj=()=>{const q=(D.querySelector('#tvq')||{value:''}).value.toLowerCase();if(q&&!/htf|ict|fadi|candle|higher/.test(q)){ls.querySelectorAll('[data-htf]').forEach(x=>x.remove());return}
  if(ls.querySelector('[data-htf]'))return;const d=D.createElement('div');d.className='ind';d.dataset.htf=1;d.innerHTML=`<b>${V.h_on?'✓':''}</b>ICT HTF Candles (fadi)`;ls.appendChild(d)};
 new MutationObserver(inj).observe(ls,{childList:true});inj();
 ls.addEventListener('click',e=>{const d=e.target.closest('[data-htf]');if(!d)return;e.stopPropagation();V.h_on=+!V.h_on;V.h_hide=0;save();d.firstChild.textContent=V.h_on?'✓':'';if(V.h_on)open()},true)};
setInterval(add,300);
window.tvHtf={open,toggle:()=>{V.h_on=+!V.h_on;save()}};
})();
