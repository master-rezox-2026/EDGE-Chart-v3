/* TV Speed - load LAST. Faster loading + smoother live feed:
   1. exCandles for Binance spot/futures: history pages are fetched IN PARALLEL (was one after another).
   2. Stale-while-revalidate cache (memory + IndexedDB): reopening a symbol / timeframe paints instantly from cache,
      then fresh candles are fetched in the background and merged into the chart without moving the view.
   3. agg() is incremental: a live tick only re-aggregates the last bucket instead of the whole history every message. */
(()=>{
if(typeof Ch==='undefined'||typeof exCandles==='undefined'||typeof charts==='undefined'||typeof jget==='undefined')return;

/* ---------- 3. incremental agg ---------- */
const oAgg=window.agg||agg,AC=new WeakMap();
function run(d,sec,o,from){let si=from;for(let i=from;i<d.length;i++){const x=d[i],t=Math.floor(x.time/sec)*sec,l=o[o.length-1];
  if(l&&l.time===t){if(x.high>l.high)l.high=x.high;if(x.low<l.low)l.low=x.low;l.close=x.close;l.volume+=x.volume}else{o.push({...x,time:t});si=i}}return si}
window.agg=function(d,sec){if(!(sec>0)||!d||d.length<60)return oAgg(d,sec);
 let m=AC.get(d);if(!m){m=new Map();AC.set(d,m)}const e=m.get(sec),n=d.length;
 if(e&&n>=e.n&&e.f===d[0]){const o=e.o;o.pop();e.si=run(d,sec,o,e.si);e.n=n;return o}
 const o=[],si=run(d,sec,o,0);m.set(sec,{o,si,n,f:d[0]});return o};

/* ---------- 1+2. fast, cached history ---------- */
const KL={BF:'https://fapi.binance.com/fapi/v1/klines',BN:'https://api.binance.com/api/v3/klines'};
let _db=null;const idb=()=>_db||(_db=new Promise(r=>{try{const q=indexedDB.open('edge-cache',1);q.onupgradeneeded=()=>q.result.createObjectStore('k');q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)}catch(e){r(null)}}));
const cget=async k=>{const d=await idb();if(!d)return null;return new Promise(r=>{try{const q=d.transaction('k').objectStore('k').get(k);q.onsuccess=()=>r(q.result||null);q.onerror=()=>r(null)}catch(e){r(null)}})};
const cput=async(k,v)=>{const d=await idb();if(!d)return;try{d.transaction('k','readwrite').objectStore('k').put(v,k)}catch(e){}};
const mem=new Map(),busy=new Set();
const put=(k,v)=>{mem.set(k,v);if(mem.size>24)mem.delete(mem.keys().next().value);cput(k,v)};
async function par(src,name,nat,pages){const per=nat*60000,now=Date.now(),lim=1000,u=KL[src],iv=BN[nat];
 const R=await Promise.allSettled(Array.from({length:pages},(_,k)=>{const end=now-k*lim*per;return jget(`${u}?symbol=${name}&interval=${iv}&limit=${lim}`+(k?`&startTime=${end-lim*per}&endTime=${end-1}`:''))}));
 if(R[0].status!=='fulfilled'||!Array.isArray(R[0].value))throw(R[0].reason||Error('no data'));
 const m=new Map();R.forEach(r=>{if(r.status==='fulfilled'&&Array.isArray(r.value))r.value.forEach(k=>m.set(k[0],{time:k[0]/1000,open:+k[1],high:+k[2],low:+k[3],close:+k[4],volume:+k[5]}))});
 return[...m.values()].sort((a,b)=>a.time-b.time)}
const mergeArr=(a,b)=>{const m=new Map();a.forEach(x=>m.set(x.time,x));b.forEach(x=>m.set(x.time,x));return[...m.values()].sort((x,y)=>x.time-y.time)};
function apply(src,name,nat,fresh){charts.forEach(c=>{if(c.src!==src||c.name!==name||c.nat!==nat||!c.raw||!c.ok||!c.s)return;
  try{c.raw=mergeArr(c.raw,fresh);if(c.rp!=null)return;c.ag=agg(c.raw,c.tfm*60);c.s.setData(c.seriesData(c.view()));c.n=c.ag.length;c.ind();c.updateOhlc();if(c.style!=='footprint')c.c.timeScale().scrollToRealTime()}catch(e){}})}
async function reval(key,src,name,nat,hit){if(busy.has(key))return;busy.add(key);
 try{const f=await par(src,name,nat,1),d=mergeArr(hit.d,f);put(key,{t:Date.now(),d:d.slice(-4000)});apply(src,name,nat,f)}catch(e){}busy.delete(key)}
const oEx=window.exCandles;
window.exCandles=async function(src,name,nat,c){
 if((c&&c<=10)||!KL[src]||!BN[nat])return oEx.apply(this,arguments);
 const key=src+'|'+name+'|'+nat,pages=src==='BF'?3:2,per=nat*60;
 try{const hit=mem.get(key)||await cget(key);
  if(hit&&hit.d&&hit.d.length>200&&(Date.now()/1000-hit.d[hit.d.length-1].time)<per*800){mem.set(key,hit);reval(key,src,name,nat,hit);return hit.d.slice()}
  const d=await par(src,name,nat,pages);put(key,{t:Date.now(),d});return d.slice()}
 catch(e){return oEx.apply(this,arguments)}};
})();
