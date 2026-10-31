/* MultiChart Pro add-on: Drawing Pro (TradingView-style left toolbar + all drawing tools + settings)
   Install: add as the LAST script, after edge-ui.js, right before </body>:
     <script src="drawing-pro.js"></script>
   - Left toolbar with fly-out menus (Trend, Fib/Gann, Patterns, Forecasting, Brushes/Shapes, Annotations, Emoji)
   - Every tool is editable: click a drawing -> floating bar; double-click (or right-click > Settings) -> full settings
   - Drawings are stored per symbol in S.dp and saved with the normal save() (localStorage / cloud sync)
   - Set  PERP_ONLY=false  below to bring back spot / MT5 / futures tabs. */
(()=>{
'use strict';
const PERP_ONLY=!(typeof window!=='undefined'&&window.MCP_CFG&&window.MCP_CFG.perpOnly===false);
const HAS=typeof S!=='undefined'&&typeof Ch!=='undefined'&&typeof document!=='undefined';
const PHI=1.618033988749895,TAU=Math.PI*2,LSD=[[],[7,5],[1.5,4]];

/* ================= coordinate helpers (time <-> logical bar index <-> pixel) ================= */
const stp=c=>(c.tfm||1)*60;
function t2l(c,t){const a=c.view(),n=a.length;if(!n)return null;const s=stp(c);
 if(t>=a[n-1].time)return n-1+(t-a[n-1].time)/s;if(t<=a[0].time)return(t-a[0].time)/s;
 let lo=0,hi=n-1;while(lo<hi){const m=(lo+hi+1)>>1;if(a[m].time<=t)lo=m;else hi=m-1}
 const d=a[lo+1].time-a[lo].time;return lo+(d>0?(t-a[lo].time)/d:0)}
function l2t(c,l){const a=c.view(),n=a.length;if(!n)return null;const s=stp(c);
 if(l>=n-1)return Math.round(a[n-1].time+(l-(n-1))*s);if(l<=0)return Math.round(a[0].time+l*s);
 const i=Math.floor(l);return Math.round(a[i].time+(l-i)*(a[i+1].time-a[i].time))}
const t2x=(c,t)=>{const l=t2l(c,t);return l==null?null:c.c.timeScale().logicalToCoordinate(l)};
const x2t=(c,x)=>{const l=c.c.timeScale().coordinateToLogical(x);return l==null?null:l2t(c,l)};
const fmtP=(c,v)=>{const p=c.precision!=null?c.precision:(Math.abs(v)>=100?2:Math.abs(v)>=1?4:6);return v.toFixed(Math.min(8,p))};
const fmtV=v=>v>=1e9?(v/1e9).toFixed(2)+'B':v>=1e6?(v/1e6).toFixed(2)+'M':v>=1e3?(v/1e3).toFixed(2)+'K':v.toFixed(v<10?2:0);
const fmtD=s=>{s=Math.abs(s);const d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);return(d?d+'d ':'')+(h?h+'h ':'')+(m||(!d&&!h)?m+'m':'')};
const HM=new WeakMap(),IMG=new Map();

/* ================= tool catalog (id, name, points needed, hotkey) ; need -1 = until double-click ================= */
const MENU=[
{id:'trend',tip:'Trend tools',secs:[
 [null,[['tl','Trendline',2,'Alt+T'],['ray','Ray',2],['info','Info line',2],['ext','Extended line',2],['angle','Trend angle',2],['hl','Horizontal line',1,'Alt+H'],['hray','Horizontal ray',1,'Alt+J'],['vl','Vertical line',1,'Alt+V'],['cl','Cross line',1,'Alt+C']]],
 ['Channels',[['pch','Parallel channel',3],['reg','Regression trend',2],['flat','Flat top/bottom',3],['dis','Disjoint channel',4]]],
 ['Pitchforks',[['pf','Pitchfork',3],['spf','Schiff pitchfork',3],['mpf','Modified Schiff pitchfork',3],['ipf','Inside pitchfork',3]]]]},
{id:'fib',tip:'Gann and Fibonacci tools',secs:[
 [null,[['fib','Fib retracement',2,'Alt+F'],['fext','Trend-based fib extension',3],['fch','Fib channel',3],['ftz','Fib time zone',2],['ffan','Fib speed resistance fan',2],['ftime','Trend-based fib time',3],['fcir','Fib circles',2],['fspi','Fib spiral',2],['farc','Fib speed resistance arcs',2],['fwed','Fib wedge',3],['pfan','Pitchfan',3]]],
 ['Gann',[['gbox','Gann box',2],['gsqf','Gann square fixed',2],['gsq','Gann square',2],['gfan','Gann fan',2]]]]},
{id:'pat',tip:'Patterns',secs:[
 ['Chart patterns',[['xabcd','XABCD pattern',5],['cypher','Cypher pattern',5],['hns','Head and shoulders',7],['abcd','ABCD pattern',4],['tri','Triangle pattern',4],['drives','Three drives pattern',7]]],
 ['Elliott waves',[['eimp','Elliott impulse wave (1·2·3·4·5)',6],['ecor','Elliott correction wave (A·B·C)',4],['etri','Elliott triangle wave (A·B·C·D·E)',6],['edbl','Elliott double combo wave (W·X·Y)',4],['etrp','Elliott triple combo wave (W·X·Y·X·Z)',6]]],
 ['Cycles',[['cyc','Cyclic lines',2],['tcyc','Time cycles',2],['sine','Sine line',2]]]]},
{id:'fore',tip:'Forecasting and measurement tools',secs:[
 ['Forecasting',[['long','Long position',2],['short','Short position',2],['pforc','Position forecast',2],['bpat','Bars pattern',3],['ghost','Ghost feed',2],['sector','Sector',3]]],
 ['Volume-based',[['avwap','Anchored VWAP',1],['frvp','Fixed range volume profile',2],['avp','Anchored volume profile',1]]],
 ['Measurers',[['prng','Price range',2],['drng','Date range',2],['dprng','Date and price range',2]]]]},
{id:'brush',tip:'Brushes, arrows and shapes',secs:[
 ['Brushes',[['brush','Brush',0],['hilite','Highlighter',0]]],
 ['Arrows',[['amark','Arrow marker',2],['arr','Arrow',2],['aup','Arrow mark up',1],['adn','Arrow mark down',1]]],
 ['Shapes',[['rect','Rectangle',2,'Alt+Shift+R'],['rrect','Rotated rectangle',3],['path','Path',-1],['circle','Circle',2],['ellipse','Ellipse',2],['poly','Polyline',-1],['tri3','Triangle',3],['arc','Arc',3],['curve','Curve',2],['dcurve','Double curve',2]]]]},
{id:'ann',tip:'Annotation tools',secs:[
 [null,[['text','Text',1],['note','Note',1],['pnote','Price note',2],['pin','Pin',1],['table','Table',1],['callout','Callout',2],['comment','Comment',1],['plabel','Price label',1],['sign','Signpost',1],['flag','Flag mark',1]]],
 ['Content',[['image','Image',1],['post','Post',1],['idea','Idea',1]]]]}
];
const TD={};MENU.forEach(g=>g.secs.forEach(s=>s[1].forEach(([id,n,need,hk])=>TD[id]={id,n,need,hk,g:g.id})));
TD.emoji={id:'emoji',n:'Emoji',need:1,g:'emoji'};TD.icon={id:'icon',n:'Icon',need:1,g:'emoji'};
TD.ruler={id:'ruler',n:'Measure',need:2,g:'ruler'};TD.zoom={id:'zoom',n:'Zoom in',need:2,g:'zoom'};
const POSK=['long','short','pforc'];
const NOFILL=new Set(['tl','ray','info','ext','angle','hl','hray','vl','cl','brush','hilite','arr','curve','dcurve','path','sine','cyc','ftz','ftime','avwap','emoji','icon','image','text','aup','adn','amark','cl']);

/* ================= level templates ================= */
const FC=['#9aa0b0','#f23645','#ff9800','#4caf50','#089981','#00bcd4','#9aa0b0','#2962ff','#f23645','#9c27b0','#e91e63','#ff9800'];
const LVT={fib:[0,.236,.382,.5,.618,.786,1,1.618,2.618,3.618,4.236],fext:[0,.236,.382,.5,.618,.786,1,1.272,1.414,1.618,2,2.618],
 fch:[0,.236,.382,.5,.618,.786,1,1.618,2.618],ftz:[0,1,2,3,5,8,13,21,34,55,89],ffan:[.25,.382,.5,.618,.75,1],
 ftime:[0,.382,.5,.618,1,1.382,1.618,2,2.618],fcir:[.236,.382,.5,.618,.786,1,1.618],fspi:[1],farc:[.236,.382,.5,.618,.786,1],
 fwed:[.236,.382,.5,.618,.786,1],pfan:[.25,.382,.5,.618,.75,1],gbox:[0,.25,.382,.5,.618,.75,1],
 gfan:[1/8,1/4,1/3,1/2,1,2,3,4,8]};
const OFFD={fib:7};
const mkLv=k=>(LVT[k]||[]).map((v,i)=>({v,c:FC[i%FC.length],on:i<(OFFD[k]||99)?1:0}));
const baseStyle=()=>({col:(typeof S!=='undefined'&&S.set&&S.set.dc)||'#e6b422',w:+(typeof S!=='undefined'&&S.set&&S.set.dw)||1,ls:0,fo:.15,tc:'#d1d4dc',fs:12,b:0,i:0});

/* ================= helpers ================= */
const regress=(c,t1,t2,src)=>{const a=c.view();if(!a.length)return null;let i0=Math.round(t2l(c,t1)),i1=Math.round(t2l(c,t2));if(i0>i1)[i0,i1]=[i1,i0];
 i0=Math.max(0,i0);i1=Math.min(a.length-1,i1);const n=i1-i0+1;if(n<3)return null;let sx=0,sy=0,sxy=0,sxx=0;
 for(let i=i0;i<=i1;i++){const x=i-i0,y=a[i][src||'close'];sx+=x;sy+=y;sxy+=x*y;sxx+=x*x}
 const m=(n*sxy-sx*sy)/(n*sxx-sx*sx||1),b=(sy-m*sx)/n;let ss=0;for(let i=i0;i<=i1;i++){const r=a[i][src||'close']-(b+m*(i-i0));ss+=r*r}
 return{i0,i1,m,b,sd:Math.sqrt(ss/n)}};
function vprofile(c,t1,t2,rows,vaPct){const a=c.view();if(!a.length)return null;let i0=Math.round(t2l(c,t1)),i1=Math.round(t2l(c,t2));if(i0>i1)[i0,i1]=[i1,i0];
 i0=Math.max(0,i0);i1=Math.min(a.length-1,i1);if(i1<i0)return null;let lo=Infinity,hi=-Infinity;
 for(let i=i0;i<=i1;i++){lo=Math.min(lo,a[i].low);hi=Math.max(hi,a[i].high)}if(!(hi>lo))return null;
 const R=Math.max(4,Math.min(200,rows|0||24)),h=(hi-lo)/R,rw=Array.from({length:R},()=>({up:0,dn:0}));
 for(let i=i0;i<=i1;i++){const b=a[i],v=b.volume||0,r0=Math.max(0,Math.floor((b.low-lo)/h)),r1=Math.min(R-1,Math.floor((b.high-lo-1e-12)/h)),k=Math.max(1,r1-r0+1);
  for(let r=r0;r<=r1;r++){if(b.close>=b.open)rw[r].up+=v/k;else rw[r].dn+=v/k}}
 let tot=0,poc=0,mx=0;rw.forEach((r,i)=>{const s=r.up+r.dn;tot+=s;if(s>mx){mx=s;poc=i}});
 let l=poc,u=poc,acc=mx;const tgt=tot*((vaPct||70)/100);
 while(acc<tgt&&(l>0||u<R-1)){const dn=l>0?rw[l-1].up+rw[l-1].dn:-1,up=u<R-1?rw[u+1].up+rw[u+1].dn:-1;if(up>=dn){u++;acc+=up}else{l--;acc+=dn}}
 return{rows:rw,lo,hi,h,poc,val:l,vah:u,max:mx,i0,i1}}
function circum(A,B,C){const d=2*(A.x*(B.y-C.y)+B.x*(C.y-A.y)+C.x*(A.y-B.y));if(Math.abs(d)<1e-9)return null;
 const a2=A.x*A.x+A.y*A.y,b2=B.x*B.x+B.y*B.y,c2=C.x*C.x+C.y*C.y,ux=(a2*(B.y-C.y)+b2*(C.y-A.y)+c2*(A.y-B.y))/d,uy=(a2*(C.x-B.x)+b2*(A.x-C.x)+c2*(B.x-A.x))/d;return{x:ux,y:uy,r:Math.hypot(A.x-ux,A.y-uy)}}
const nrm=a=>((a%TAU)+TAU)%TAU;
function arcPts(A,B,C){const o=circum(A,B,C);if(!o)return[A,B];const aA=Math.atan2(A.y-o.y,A.x-o.x),aB=Math.atan2(B.y-o.y,B.x-o.x),aC=Math.atan2(C.y-o.y,C.x-o.x);
 const dC=nrm(aC-aA),eB=nrm(aB-aA),ccw=dC<=eB,sw=ccw?eB:-(TAU-eB),pts=[];for(let i=0;i<=48;i++){const t=aA+sw*i/48;pts.push({x:o.x+o.r*Math.cos(t),y:o.y+o.r*Math.sin(t)})}return pts}
const rng=s=>{let x=(s|0)||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return((x>>>0)%100000)/100000}};
const wrapT=(g,s,mw)=>{const out=[];String(s).split('\n').forEach(par=>{let ln='';par.split(' ').forEach(w=>{const t=ln?ln+' '+w:w;if(g.measureText(t).width>mw&&ln){out.push(ln);ln=w}else ln=t});out.push(ln)});return out};
const inPoly=(pts,x,y)=>{let r=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],b=pts[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)r=!r}return r};
const dseg=(x,y,s)=>{const[x1,y1,x2,y2]=s,dx=x2-x1,dy=y2-y1,l=dx*dx+dy*dy;let t=l?((x-x1)*dx+(y-y1)*dy)/l:0;t=Math.max(0,Math.min(1,t));return Math.hypot(x-(x1+t*dx),y-(y1+t*dy))};

/* ================= renderer ================= */
function paint(g,c,o,W,H,pv){
 const P=o.p.map(q=>({x:t2x(c,q.t),y:c.s.priceToCoordinate(q.p),t:q.t,p:q.p}));
 if(!P.length||P.some(q=>q.x==null||q.y==null))return;
 const hit=pv?null:{s:[],f:[],r:[]};if(hit)HM.set(o,hit);
 const sy=v=>c.s.priceToCoordinate(v),fp=v=>fmtP(c,v),k=o.k,[A,B,C,Q,R5]=P;
 g.save();g.lineJoin='round';g.lineCap='round';g.strokeStyle=o.col;g.fillStyle=o.col;g.lineWidth=o.w;g.setLineDash(LSD[o.ls||0]);g.textBaseline='middle';
 const seg=(x1,y1,x2,y2)=>{g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();hit&&hit.s.push([x1,y1,x2,y2])};
 const path=(pts,close)=>{g.beginPath();pts.forEach((q,i)=>i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y));if(close)g.closePath()};
 const rec=(pts,close)=>{if(!hit)return;for(let i=1;i<pts.length;i++)hit.s.push([pts[i-1].x,pts[i-1].y,pts[i].x,pts[i].y]);if(close&&pts.length>2)hit.s.push([pts[pts.length-1].x,pts[pts.length-1].y,pts[0].x,pts[0].y])};
 const fillP=(pts,col,al)=>{if(pts.length<3)return;g.save();g.globalAlpha*=al==null?o.fo:al;g.fillStyle=col||o.fill||o.col;path(pts,1);g.fill();g.restore();hit&&hit.f.push(pts)};
 const poly=(pts,close,fill,al)=>{if(fill&&NOFILL.has(k)===false)fillP(pts,null,al);path(pts,close);g.stroke();rec(pts,close)};
 const far=(a,b)=>{const m=1e4/(Math.hypot(b.x-a.x,b.y-a.y)||1);return{x:a.x+(b.x-a.x)*m,y:a.y+(b.y-a.y)*m}};
 const ray=(a,b,col)=>{const f=far(a,b);if(col)g.strokeStyle=col;seg(a.x,a.y,f.x,f.y)};
 const dash=f=>{g.save();g.setLineDash([4,4]);g.strokeStyle=o.dc||'#7b8194';f();g.restore()};
 const txt=(s,x,y,op={})=>{if(s==null||s==='')return;const ls=String(s).split('\n'),fs=op.fs||o.fs||12,lh=fs*1.3,pad=op.bg?(op.pad==null?5:op.pad):0;
  g.save();g.setLineDash([]);g.font=`${(op.b==null?o.b:op.b)?'bold ':''}${o.i&&!op.ni?'italic ':''}${fs}px system-ui,sans-serif`;g.textBaseline='middle';
  const w=Math.max(...ls.map(t=>g.measureText(t).width))+pad*2,h=lh*ls.length+pad*2,al=op.al||'center',x0=al==='left'?x:al==='right'?x-w:x-w/2,y0=op.top?y:y-h/2;
  if(op.bg){g.fillStyle=op.bg;g.beginPath();if(g.roundRect)g.roundRect(x0,y0,w,h,op.r==null?4:op.r);else g.rect(x0,y0,w,h);g.fill();if(op.bd){g.strokeStyle=op.bd;g.lineWidth=1;g.stroke()}}
  g.fillStyle=op.col||o.tc||o.col;g.textAlign='left';ls.forEach((t,i)=>g.fillText(t,x0+pad,y0+pad+lh*(i+.5)));g.restore();hit&&hit.r.push([x0,y0,x0+w,y0+h]);return{x0,y0,w,h}};
 const cirP=(cx,cy,rx,ry)=>{const pts=[];for(let i=0;i<64;i++){const t=i/64*TAU;pts.push({x:cx+rx*Math.cos(t),y:cy+ry*Math.sin(t)})}return pts};
 const head=(a,b,sz)=>{const t=Math.atan2(b.y-a.y,b.x-a.x);g.save();g.setLineDash([]);g.beginPath();g.moveTo(b.x,b.y);g.lineTo(b.x-sz*Math.cos(t-.45),b.y-sz*Math.sin(t-.45));g.lineTo(b.x-sz*Math.cos(t+.45),b.y-sz*Math.sin(t+.45));g.closePath();g.fill();g.restore()};
 const lvOn=()=>(o.lv||[]).filter(l=>l.on);
 const lvLab=(l,pr)=>(o.shl===0?'':l.v+(o.shp===0?'':' ('+fp(pr)+')'));
 const dyAt=(a,b,p)=>p.y-(a.y+(b.y-a.y)*(p.x-a.x)/((b.x-a.x)||1e-6));
 const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
 const ptxt=(P_,names,up)=>P_.forEach((q,i)=>{if(!names[i])return;const nb=[P_[i-1],P_[i+1]].filter(Boolean),peak=nb.every(z=>q.y<=z.y);
  const yy=q.y+(peak?-13:13);g.save();g.setLineDash([]);g.fillStyle=o.tc||o.col;g.font='bold '+(o.fs||12)+'px system-ui';g.textAlign='center';g.fillText(names[i],q.x,yy);g.restore()});
 const circLab=(P_,names)=>P_.forEach((q,i)=>{if(!names[i])return;const nb=[P_[i-1],P_[i+1]].filter(Boolean),peak=nb.every(z=>q.y<=z.y),yy=q.y+(peak?-16:16);
  g.save();g.setLineDash([]);g.beginPath();g.arc(q.x,yy,9,0,TAU);g.lineWidth=1.2;g.stroke();g.fillStyle=o.tc||o.col;g.font='bold 11px system-ui';g.textAlign='center';g.fillText(names[i],q.x,yy+.5);g.restore()});
 const ratio=(a,b)=>Math.abs(b)>0?(Math.abs(a/b)).toFixed(3):'–';
 const mid=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
 const rlab=(a,b,s)=>{const m=mid(a,b);txt(s,m.x,m.y,{bg:'rgba(19,23,34,.85)',col:o.col,fs:10,pad:2})};
 try{switch(k){
 case'tl':case'ext':case'ray':case'info':case'angle':{const el=k==='ext'||o.exl,er=k==='ext'||k==='ray'||o.exr,p1=el?far(B,A):A,p2=er?far(A,B):B;seg(p1.x,p1.y,p2.x,p2.y);
  if(o.shp){txt(fp(A.p),A.x-6,A.y,{al:'right',fs:10,bg:'rgba(19,23,34,.8)',pad:2});txt(fp(B.p),B.x+6,B.y,{al:'left',fs:10,bg:'rgba(19,23,34,.8)',pad:2})}
  const dp=B.p-A.p,bars=Math.round((t2l(c,B.t)||0)-(t2l(c,A.t)||0)),ang=Math.atan2(-(B.y-A.y),B.x-A.x)*180/Math.PI;
  if(k==='info')txt(`${dp>=0?'+':''}${fp(dp)} (${(dp/A.p*100).toFixed(2)}%)\n${bars} bars, ${fmtD(B.t-A.t)}\n${ang.toFixed(1)}°`,B.x+10,B.y,{al:'left',bg:'rgba(19,23,34,.9)',bd:o.col,col:'#d1d4dc',fs:11});
  if(k==='angle'){dash(()=>seg(A.x,A.y,Math.max(A.x+40,B.x),A.y));g.save();g.setLineDash([]);g.beginPath();g.arc(A.x,A.y,28,0,-ang*Math.PI/180,ang>0);g.stroke();g.restore();txt(ang.toFixed(1)+'°',A.x+34,A.y+(ang>0?-12:12),{al:'left',fs:11})}
  break}
 case'hl':seg(0,A.y,W,A.y);txt(fp(A.p),W-4,A.y-9,{al:'right',fs:10});break;
 case'hray':seg(A.x,A.y,W,A.y);txt(fp(A.p),W-4,A.y-9,{al:'right',fs:10});break;
 case'vl':seg(A.x,0,A.x,H);break;
 case'cl':seg(0,A.y,W,A.y);seg(A.x,0,A.x,H);break;
 case'pch':{const dy=dyAt(A,B,C),A2={x:A.x,y:A.y+dy},B2={x:B.x,y:B.y+dy},p1=o.exl?far(B,A):A,p2=o.exr?far(A,B):B,q1=o.exl?far(B2,A2):A2,q2=o.exr?far(A2,B2):B2;
  fillP([p1,p2,q2,q1]);seg(p1.x,p1.y,p2.x,p2.y);seg(q1.x,q1.y,q2.x,q2.y);if(o.mid!==0)dash(()=>seg((p1.x+q1.x)/2,(p1.y+q1.y)/2,(p2.x+q2.x)/2,(p2.y+q2.y)/2));break}
 case'reg':{const r=regress(c,A.t,B.t,o.src);if(!r){seg(A.x,A.y,B.x,B.y);break}const a=c.view(),X=i=>c.c.timeScale().logicalToCoordinate(i),dv=+(o.dev||2);
  const yv=(i,m)=>sy(r.b+r.m*(i-r.i0)+m),lines=[0,dv,-dv].map(m=>({a:{x:X(r.i0),y:yv(r.i0,m*r.sd)},b:{x:X(r.i1),y:yv(r.i1,m*r.sd)}}));
  if(lines.some(l=>l.a.y==null||l.b.y==null||l.a.x==null))break;const ext=p=>o.exr?far(p.a,p.b):p.b;
  fillP([lines[1].a,ext(lines[1]),ext(lines[2]),lines[2].a]);lines.forEach((l,i)=>{g.save();if(i)g.setLineDash([5,4]);const e=ext(l);seg(l.a.x,l.a.y,e.x,e.y);g.restore()});break}
 case'flat':{const Fa={x:A.x,y:C.y},Fb={x:B.x,y:C.y};fillP([A,B,Fb,Fa]);seg(A.x,A.y,B.x,B.y);seg(Fa.x,Fa.y,o.exr?W:Fb.x,Fb.y);break}
 case'dis':{fillP([A,B,Q,C]);seg(A.x,A.y,B.x,B.y);seg(C.x,C.y,Q.x,Q.y);break}
 case'pf':case'spf':case'mpf':case'ipf':{const org=k==='spf'?{x:A.x,y:(A.y+B.y)/2}:k==='mpf'?mid(A,B):A,M=mid(B,C),u={x:M.x-org.x,y:M.y-org.y},L=1e4/(Math.hypot(u.x,u.y)||1),
   E=(p)=>({x:p.x+u.x*L,y:p.y+u.y*L});const m2=E(org),b2=E(B),c2=E(C);fillP([org,m2,b2,B]);fillP([org,m2,c2,C]);
   seg(org.x,org.y,m2.x,m2.y);seg(B.x,B.y,b2.x,b2.y);seg(C.x,C.y,c2.x,c2.y);dash(()=>{seg(B.x,B.y,C.x,C.y);if(org!==A)seg(A.x,A.y,org.x,org.y)});
   if(k==='ipf')[lerp(B,M,.5),lerp(M,C,.5)].forEach(p=>{const e=E(p);g.save();g.setLineDash([3,4]);seg(p.x,p.y,e.x,e.y);g.restore()});break}
 case'fib':{const lv=lvOn(),x1=Math.min(A.x,B.x),x2=Math.max(A.x,B.x),xs=o.exl?0:x1,xe=o.exr?W:x2,pr=v=>o.rev?A.p+(B.p-A.p)*v:B.p+(A.p-B.p)*v;
  const ys=lv.map(l=>({l,y:sy(pr(l.v))})).filter(z=>z.y!=null);
  for(let i=1;i<ys.length;i++){g.save();g.globalAlpha*=.1;g.fillStyle=ys[i].l.c;g.fillRect(xs,Math.min(ys[i].y,ys[i-1].y),xe-xs,Math.abs(ys[i].y-ys[i-1].y));g.restore();hit&&hit.f.push([{x:xs,y:Math.min(ys[i].y,ys[i-1].y)},{x:xe,y:Math.min(ys[i].y,ys[i-1].y)},{x:xe,y:Math.max(ys[i].y,ys[i-1].y)},{x:xs,y:Math.max(ys[i].y,ys[i-1].y)}])}
  ys.forEach(z=>{g.strokeStyle=z.l.c;seg(xs,z.y,xe,z.y);if(o.shl!==0)txt(lvLab(z.l,pr(z.l.v)),xs+3,z.y-8,{al:'left',col:z.l.c,fs:o.fs||11,ni:1})});
  if(o.trend!==0)dash(()=>seg(A.x,A.y,B.x,B.y));break}
 case'fext':{const lv=lvOn(),x1=Math.min(B.x,C.x),x2=o.exr?W:Math.max(x1+60,Math.max(B.x,C.x));
  lv.forEach(l=>{const pr=C.p+(B.p-A.p)*l.v,y=sy(pr);if(y==null)return;g.strokeStyle=l.c;seg(x1,y,x2,y);if(o.shl!==0)txt(lvLab(l,pr),x1+3,y-8,{al:'left',col:l.c,fs:o.fs||11,ni:1})});
  dash(()=>{seg(A.x,A.y,B.x,B.y);seg(B.x,B.y,C.x,C.y)});break}
 case'fch':{const dy=dyAt(A,B,C),lv=lvOn();lv.forEach(l=>{g.strokeStyle=l.c;const a2={x:A.x,y:A.y+dy*l.v},b2={x:B.x,y:B.y+dy*l.v},e=o.exr?far(a2,b2):b2;seg(a2.x,a2.y,e.x,e.y);if(o.shl!==0)txt(String(l.v),b2.x+4,b2.y,{al:'left',col:l.c,fs:10,ni:1})});break}
 case'ftz':{lvOn().forEach(l=>{const x=A.x+(B.x-A.x)*l.v;if(x<-5||x>W+5)return;g.strokeStyle=l.c;seg(x,0,x,H);if(o.shl!==0)txt(String(l.v),x+3,10,{al:'left',col:l.c,fs:10,ni:1})});dash(()=>seg(A.x,A.y,B.x,A.y));break}
 case'ffan':{lvOn().forEach(l=>{g.strokeStyle=l.c;ray(A,{x:B.x,y:A.y+(B.y-A.y)*l.v},l.c);ray(A,{x:A.x+(B.x-A.x)*l.v,y:B.y},l.c);if(o.shl!==0)txt(String(l.v),B.x+4,A.y+(B.y-A.y)*l.v,{al:'left',col:l.c,fs:10,ni:1})});dash(()=>seg(A.x,A.y,B.x,B.y));break}
 case'ftime':{lvOn().forEach(l=>{const x=C.x+(B.x-A.x)*l.v;if(x<-5||x>W+5)return;g.strokeStyle=l.c;seg(x,0,x,H);if(o.shl!==0)txt(String(l.v),x+3,10,{al:'left',col:l.c,fs:10,ni:1})});dash(()=>{seg(A.x,A.y,B.x,B.y);seg(B.x,B.y,C.x,C.y)});break}
 case'fcir':{const m=mid(A,B),R0=Math.hypot(B.x-A.x,B.y-A.y)/2;lvOn().forEach(l=>{g.strokeStyle=l.c;const pts=cirP(m.x,m.y,R0*l.v,R0*l.v);path(pts,1);g.stroke();rec(pts,1);if(o.shl!==0)txt(String(l.v),m.x+R0*l.v+3,m.y,{al:'left',col:l.c,fs:10,ni:1})});dash(()=>seg(A.x,A.y,B.x,B.y));break}
 case'fspi':{const d=Math.hypot(B.x-A.x,B.y-A.y),a0=Math.atan2(B.y-A.y,B.x-A.x),r0=d/Math.pow(PHI,4),pts=[];for(let i=0;i<=200;i++){const th=i/200*TAU*1.25,r=r0*Math.pow(PHI,th/(Math.PI/2));pts.push({x:A.x+r*Math.cos(a0+th-TAU),y:A.y+r*Math.sin(a0+th-TAU)})}path(pts);g.stroke();rec(pts);dash(()=>seg(A.x,A.y,B.x,B.y));break}
 case'farc':{const d=Math.hypot(B.x-A.x,B.y-A.y);lvOn().forEach(l=>{g.strokeStyle=l.c;g.beginPath();g.arc(B.x,B.y,d*l.v,Math.PI,TAU);g.stroke();for(let i=0;i<=24;i++){const t=Math.PI+i/24*Math.PI;if(hit&&i)hit.s.push([B.x+d*l.v*Math.cos(t-Math.PI/24),B.y+d*l.v*Math.sin(t-Math.PI/24),B.x+d*l.v*Math.cos(t),B.y+d*l.v*Math.sin(t)])}
   if(o.shl!==0)txt(String(l.v),B.x+d*l.v+3,B.y-6,{al:'left',col:l.c,fs:10,ni:1})});dash(()=>seg(A.x,A.y,B.x,B.y));break}
 case'fwed':{const d=Math.hypot(B.x-A.x,B.y-A.y),a1=Math.atan2(B.y-A.y,B.x-A.x),a2=Math.atan2(C.y-A.y,C.x-A.x);let da=a2-a1;while(da>Math.PI)da-=TAU;while(da<-Math.PI)da+=TAU;
  const lv=lvOn(),mx=Math.max(1,...lv.map(l=>l.v));[a1,a2].forEach(a=>seg(A.x,A.y,A.x+d*mx*Math.cos(a),A.y+d*mx*Math.sin(a)));
  lv.forEach(l=>{g.strokeStyle=l.c;g.beginPath();g.arc(A.x,A.y,d*l.v,a1,a1+da,da<0);g.stroke();for(let i=1;i<=20;i++){const t0=a1+da*(i-1)/20,t1=a1+da*i/20;hit&&hit.s.push([A.x+d*l.v*Math.cos(t0),A.y+d*l.v*Math.sin(t0),A.x+d*l.v*Math.cos(t1),A.y+d*l.v*Math.sin(t1)])}});break}
 case'pfan':{const lv=lvOn().map(l=>({l,p:lerp(B,C,l.v)}));lv.forEach((z,i)=>{if(i){const f1=far(A,lv[i-1].p),f2=far(A,z.p);fillP([A,f1,f2],z.l.c,.08)}});lv.forEach(z=>{g.strokeStyle=z.l.c;ray(A,z.p,z.l.c);if(o.shl!==0)txt(String(z.l.v),z.p.x+4,z.p.y,{al:'left',col:z.l.c,fs:10,ni:1})});dash(()=>seg(B.x,B.y,C.x,C.y));break}
 case'gbox':case'gsq':case'gsqf':{let X2=B.x,Y2=B.y;if(k==='gsqf'){const s=Math.max(Math.abs(B.x-A.x),Math.abs(B.y-A.y));X2=A.x+s*(B.x>=A.x?1:-1);Y2=A.y+s*(B.y>=A.y?1:-1)}
  const x1=Math.min(A.x,X2),x2=Math.max(A.x,X2),y1=Math.min(A.y,Y2),y2=Math.max(A.y,Y2),vs=k==='gbox'?lvOn().map(l=>l):[0,.125,.25,.375,.5,.625,.75,.875,1].map((v,i)=>({v,c:o.col}));
  fillP([{x:x1,y:y1},{x:x2,y:y1},{x:x2,y:y2},{x:x1,y:y2}]);
  vs.forEach(l=>{g.strokeStyle=k==='gbox'?l.c:o.col;const y=y1+(y2-y1)*l.v,x=x1+(x2-x1)*l.v;seg(x1,y,x2,y);seg(x,y1,x,y2);if(k==='gbox'&&o.shl!==0){txt(String(l.v),x1-4,y,{al:'right',col:l.c,fs:10,ni:1});txt(String(l.v),x,y1-8,{col:l.c,fs:10,ni:1})}});
  g.strokeStyle=o.col;seg(x1,y1,x2,y2);seg(x1,y2,x2,y1);if(k!=='gbox'){const mx=(x1+x2)/2,my=(y1+y2)/2;dash(()=>{seg(mx,y1,x2,my);seg(x2,my,mx,y2);seg(mx,y2,x1,my);seg(x1,my,mx,y1)})}break}
 case'gfan':{const lb=['1x8','1x4','1x3','1x2','1x1','2x1','3x1','4x1','8x1'];lvOn().forEach((l,i)=>{const col=FC[i%FC.length];g.strokeStyle=l===undefined?o.col:(l.v===1?o.col:col);const e={x:B.x,y:A.y+(B.y-A.y)*l.v};ray(A,e,g.strokeStyle);if(o.shl!==0){const idx=[1/8,1/4,1/3,1/2,1,2,3,4,8].indexOf(l.v);txt(idx>=0?lb[idx]:String(l.v),e.x+4,e.y,{al:'left',col:g.strokeStyle,fs:10,ni:1})}});break}
 case'xabcd':case'cypher':{poly(P,false,0);const[X,a,b,cc,d]=P;fillP([X,a,b],null,.12);fillP([b,cc,d],null,.12);
  dash(()=>{seg(X.x,X.y,b.x,b.y);seg(a.x,a.y,cc.x,cc.y);seg(b.x,b.y,d.x,d.y);seg(X.x,X.y,k==='cypher'?cc.x:d.x,k==='cypher'?cc.y:d.y);if(k!=='cypher')seg(a.x,a.y,d.x,d.y)});
  const ab=a.p-X.p;rlab(X,b,ratio(b.p-a.p,ab));rlab(a,cc,ratio(cc.p-b.p,b.p-a.p));rlab(b,d,ratio(d.p-cc.p,cc.p-b.p));if(k==='cypher')rlab(X,cc,ratio(cc.p-X.p,ab));else rlab(X,d,ratio(d.p-a.p,ab));
  ptxt(P,['X','A','B','C','D']);break}
 case'hns':{poly(P,false,0);fillP([P[2],P[3],P[4]],null,.15);fillP([P[0],P[1],P[2]],null,.08);fillP([P[4],P[5],P[6]],null,.08);const nk=far(P[2],P[4]);dash(()=>seg(P[2].x,P[2].y,nk.x,nk.y));
  const t=(i,s)=>{const up=P[i].y<P[2].y;txt(s,P[i].x,P[i].y+(up?-14:14),{fs:11,col:o.tc})};t(1,'Left Shoulder');t(3,'Head');t(5,'Right Shoulder');break}
 case'abcd':{poly(P,false,0);fillP([A,B,C],null,.1);fillP([B,C,Q],null,.1);dash(()=>{seg(A.x,A.y,C.x,C.y);seg(B.x,B.y,Q.x,Q.y)});rlab(A,C,ratio(C.p-B.p,B.p-A.p));rlab(B,Q,ratio(Q.p-C.p,C.p-B.p));ptxt(P,['A','B','C','D']);break}
 case'tri':{fillP([A,B,C,Q]);seg(A.x,A.y,B.x,B.y);seg(B.x,B.y,C.x,C.y);seg(C.x,C.y,Q.x,Q.y);seg(A.x,A.y,C.x,C.y);seg(B.x,B.y,Q.x,Q.y);ptxt(P,['A','B','C','D']);break}
 case'drives':{poly(P,false,0);for(let i=1;i<P.length-1;i++)rlab(P[i],P[i+1],ratio(P[i+1].p-P[i].p,P[i].p-P[i-1].p));ptxt(P,['0','1','2','3','4','5','6']);break}
 case'eimp':case'ecor':case'etri':case'edbl':case'etrp':{poly(P,false,0);circLab(P,{eimp:['','1','2','3','4','5'],ecor:['','A','B','C'],etri:['','A','B','C','D','E'],edbl:['','W','X','Y'],etrp:['','W','X','Y','X','Z']}[k]);break}
 case'cyc':{const dx=Math.abs(B.x-A.x);if(dx<3)break;const n0=Math.floor(-A.x/dx);for(let i=n0,m=0;m<500;i++,m++){const x=A.x+i*dx;if(x>W)break;if(x<-1)continue;seg(x,0,x,H)}break}
 case'tcyc':{const dx=B.x-A.x,hh=Math.max(14,Math.abs(B.y-A.y))*(B.y<A.y?-1:1);if(Math.abs(dx)<3)break;const n0=Math.floor(-A.x/Math.abs(dx));for(let i=n0,m=0;m<500;i++,m++){const x=A.x+i*Math.abs(dx);if(x>W)break;if(x+Math.abs(dx)<0)continue;const pts=[];for(let j=0;j<=24;j++){const t=j/24;pts.push({x:x+Math.abs(dx)*t,y:A.y+hh*Math.sin(Math.PI*t)})}path(pts);g.stroke();rec(pts)}break}
 case'sine':{const dx=B.x-A.x;if(Math.abs(dx)<3)break;const m=(A.y+B.y)/2,am=(A.y-B.y)/2,pts=[];for(let x=0;x<=W;x+=3)pts.push({x,y:m+am*Math.cos(Math.PI*(x-A.x)/dx)});path(pts);g.stroke();rec(pts);break}
 case'long':case'short':{const dir=k==='long'?1:-1,rr=+(o.rr||1),d=Math.abs(B.p-A.p),tgt=A.p+dir*d,stop=A.p-dir*d/rr,yT=sy(tgt),yS=sy(stop);if(yT==null||yS==null)break;
  const x1=A.x,x2=Math.max(B.x,A.x+60),tp=o.tp||'#089981',sl=o.sl||'#f23645';
  fillP([{x:x1,y:A.y},{x:x2,y:A.y},{x:x2,y:yT},{x:x1,y:yT}],tp,.22);fillP([{x:x1,y:A.y},{x:x2,y:A.y},{x:x2,y:yS},{x:x1,y:yS}],sl,.22);
  g.strokeStyle=o.col;seg(x1,A.y,x2,A.y);g.strokeStyle=tp;seg(x1,yT,x2,yT);g.strokeStyle=sl;seg(x1,yS,x2,yS);
  const risk=(+o.acc||1000)*(+o.risk||1)/100,qty=risk/(Math.abs(A.p-stop)||1);
  txt(`Target: ${fp(tgt)} (${(dir*d/A.p*100).toFixed(2)}%)`,(x1+x2)/2,(A.y+yT)/2,{col:tp==='#089981'?'#d1d4dc':'#fff',fs:11,ni:1});
  txt(`Stop: ${fp(stop)} (${(-dir*d/rr/A.p*100).toFixed(2)}%)`,(x1+x2)/2,(A.y+yS)/2,{col:'#d1d4dc',fs:11,ni:1});
  if(o.shq!==0)txt(`${k==='long'?'Long':'Short'} · R/R ${rr.toFixed(2)} · Qty ${qty>=100?qty.toFixed(0):qty.toFixed(3)} · Risk ${risk.toFixed(2)}`,(x1+x2)/2,A.y,{bg:'rgba(19,23,34,.9)',col:'#d1d4dc',fs:11,pad:3,ni:1});break}
 case'pforc':{const up=B.p>=A.p,col=up?'#089981':'#f23645';g.strokeStyle=col;g.fillStyle=col;dash(()=>{});seg(A.x,A.y,B.x,B.y);head(A,B,9);const dp=B.p-A.p;
  txt(`${dp>=0?'+':''}${fp(dp)} (${(dp/A.p*100).toFixed(2)}%)\n${Math.round((t2l(c,B.t)||0)-(t2l(c,A.t)||0))} bars, ${fmtD(B.t-A.t)}`,B.x+8,B.y,{al:'left',bg:col,col:'#fff',fs:11,ni:1});break}
 case'bpat':{const a=c.view();let i0=Math.round(t2l(c,A.t)),i1=Math.round(t2l(c,B.t));if(i0>i1)[i0,i1]=[i1,i0];i0=Math.max(0,i0);i1=Math.min(a.length-1,i1);if(i1<i0||i1-i0>800)break;
  const dp=C.p-a[i0].open,dt=C.t-a[i0].time,X=t=>t2x(c,t),w=Math.max(2,(c.c.timeScale().logicalToCoordinate(1)-c.c.timeScale().logicalToCoordinate(0))*.6);let bl=1e9,bh=-1e9;
  dash(()=>{const x1=X(a[i0].time),x2=X(a[i1].time);g.strokeRect(x1,0,x2-x1,H)});
  for(let i=i0;i<=i1;i++){const b=a[i],x=X(b.time+dt),yo=sy(b.open+dp),yc=sy(b.close+dp),yh=sy(b.high+dp),yl=sy(b.low+dp);if(x==null||yo==null||yh==null)continue;
   const col=b.close>=b.open?'#26a69a':'#ef5350';g.save();g.globalAlpha=.75;g.strokeStyle=g.fillStyle=col;g.setLineDash([]);g.lineWidth=1;g.beginPath();g.moveTo(x,yh);g.lineTo(x,yl);g.stroke();g.fillRect(x-w/2,Math.min(yo,yc),w,Math.max(1,Math.abs(yc-yo)));g.restore();
   if(hit){bl=Math.min(bl,x);bh=Math.max(bh,x)}}
  if(hit&&bh>bl){const t=Math.min(...[A.y,B.y,C.y]);hit.f.push([{x:bl,y:0},{x:bh,y:0},{x:bh,y:H},{x:bl,y:H}])}break}
 case'ghost':{const n=Math.max(2,Math.min(300,Math.round((t2l(c,B.t)||0)-(t2l(c,A.t)||0)))),r=rng(o.seed||1),l0=t2l(c,A.t),ts=c.c.timeScale(),a=c.view();
  let vol=0;const m=Math.min(30,a.length);for(let i=a.length-m;i<a.length;i++)vol+=Math.abs(a[i].high-a[i].low);vol=(vol/(m||1))||Math.abs(A.p)*.002;
  const w=Math.max(2,(ts.logicalToCoordinate(1)-ts.logicalToCoordinate(0))*.6);let prev=A.p;
  for(let i=1;i<=n;i++){const tgt=A.p+(B.p-A.p)*i/n,cl=tgt+(r()-.5)*vol*1.4,op=prev,hi=Math.max(op,cl)+r()*vol*.5,lo=Math.min(op,cl)-r()*vol*.5,x=ts.logicalToCoordinate(l0+i),yo=sy(op),yc=sy(cl),yh=sy(hi),yl=sy(lo);prev=cl;if(x==null||yo==null||yh==null)continue;
   const col=cl>=op?'#26a69a':'#ef5350';g.save();g.globalAlpha=.55;g.strokeStyle=g.fillStyle=col;g.setLineDash([]);g.lineWidth=1;g.beginPath();g.moveTo(x,yh);g.lineTo(x,yl);g.stroke();g.fillRect(x-w/2,Math.min(yo,yc),w,Math.max(1,Math.abs(yc-yo)));g.restore()}
  dash(()=>seg(A.x,A.y,B.x,B.y));if(hit)hit.f.push([{x:A.x,y:Math.min(A.y,B.y)-30},{x:B.x,y:Math.min(A.y,B.y)-30},{x:B.x,y:Math.max(A.y,B.y)+30},{x:A.x,y:Math.max(A.y,B.y)+30}]);break}
 case'sector':{const d=Math.hypot(B.x-A.x,B.y-A.y),a1=Math.atan2(B.y-A.y,B.x-A.x),a2=Math.atan2(C.y-A.y,C.x-A.x);let da=a2-a1;while(da>Math.PI)da-=TAU;while(da<-Math.PI)da+=TAU;
  const pts=[A];for(let i=0;i<=40;i++){const t=a1+da*i/40;pts.push({x:A.x+d*Math.cos(t),y:A.y+d*Math.sin(t)})}fillP(pts);path(pts,1);g.stroke();rec(pts,1);break}
 case'avwap':{const a=c.view();let i0=Math.max(0,Math.min(a.length-1,Math.round(t2l(c,A.t))));let pv_=0,vv=0,p2=0;const ts=c.c.timeScale(),L=[],U1=[],D1=[],U2=[],D2=[],mulb=+(o.bm||1);
  for(let i=i0;i<a.length;i++){const b=a[i],tp=(b.high+b.low+b.close)/3,v=b.volume||1;pv_+=tp*v;vv+=v;p2+=tp*tp*v;const w=pv_/vv,sd=Math.sqrt(Math.max(0,p2/vv-w*w)),x=ts.logicalToCoordinate(i);
   if(x==null)continue;L.push({x,y:sy(w)});U1.push({x,y:sy(w+sd*mulb)});D1.push({x,y:sy(w-sd*mulb)});U2.push({x,y:sy(w+2*sd*mulb)});D2.push({x,y:sy(w-2*sd*mulb)})}
  const ok=z=>z.filter(q=>q.y!=null);const l=ok(L);if(o.bands!==0&&l.length>1){fillP(ok(U1).concat(ok(D1).reverse()),o.fill||o.col,.1);g.save();g.setLineDash([3,4]);g.globalAlpha*=.7;[U1,D1,U2,D2].forEach(z=>{const p=ok(z);path(p);g.stroke()});g.restore()}
  if(l.length>1){path(l);g.stroke();rec(l)}g.save();g.setLineDash([]);g.beginPath();g.arc(A.x,A.y,4,0,TAU);g.fill();g.restore();txt('VWAP',A.x+6,A.y-10,{al:'left',fs:10,ni:1});break}
 case'frvp':case'avp':{const a=c.view(),t2=k==='avp'?(a.length?a[a.length-1].time:A.t):B.t,vp=vprofile(c,A.t,t2,o.rows,o.va);if(!vp)break;
  const xA=A.x,xB=k==='avp'?c.c.timeScale().logicalToCoordinate(a.length-1):B.x,wmax=k==='avp'?Math.min(W*.35,Math.abs(xB-xA)||W*.35):Math.abs(xB-xA)*(+(o.wp||70)/100),dirR=xB>=xA?1:-1,up=o.upc||'#2962ff',dn=o.dnc||'#fbc02d';
  if(xB==null)break;const x0=Math.min(xA,xB);
  if(k==='frvp'){g.save();g.setLineDash([4,4]);g.globalAlpha*=.5;seg(xA,0,xA,H);seg(xB,0,xB,H);g.restore()}
  vp.rows.forEach((r,i)=>{const yT=sy(vp.lo+(i+1)*vp.h),yB=sy(vp.lo+i*vp.h);if(yT==null||yB==null)return;const inVA=i>=vp.val&&i<=vp.vah,s=(r.up+r.dn)/vp.max,wu=wmax*s*(r.up/((r.up+r.dn)||1)),wd=wmax*s-wu,al=inVA?.6:.3,hh=Math.max(1,Math.abs(yB-yT)-1);
   g.save();g.globalAlpha=al;g.fillStyle=up;g.fillRect(x0,Math.min(yT,yB),wu,hh);g.fillStyle=dn;g.fillRect(x0+wu,Math.min(yT,yB),wd,hh);g.restore()});
  const yp=sy(vp.lo+(vp.poc+.5)*vp.h);if(yp!=null){g.save();g.strokeStyle=o.pocc||'#f23645';g.setLineDash([]);g.lineWidth=1.5;g.beginPath();g.moveTo(x0,yp);g.lineTo(o.exr?W:x0+wmax,yp);g.stroke();g.restore()}
  if(hit){const y1=sy(vp.hi),y2=sy(vp.lo);if(y1!=null&&y2!=null)hit.f.push([{x:x0,y:y1},{x:x0+wmax,y:y1},{x:x0+wmax,y:y2},{x:x0,y:y2}])}
  if(o.shl!==0){const yv=sy(vp.lo+(vp.vah+1)*vp.h),yl=sy(vp.lo+vp.val*vp.h);if(yv!=null)txt('VAH '+fp(vp.lo+(vp.vah+1)*vp.h),x0+wmax+4,yv,{al:'left',fs:10,ni:1});if(yl!=null)txt('VAL '+fp(vp.lo+vp.val*vp.h),x0+wmax+4,yl,{al:'left',fs:10,ni:1})}break}
 case'prng':{const dp=B.p-A.p,col=dp>=0?'#2962ff':'#f23645',x1=Math.min(A.x,B.x)-(A.x===B.x?40:0),x2=Math.max(A.x,B.x)+(A.x===B.x?40:0),xm=(x1+x2)/2;fillP([{x:x1,y:A.y},{x:x2,y:A.y},{x:x2,y:B.y},{x:x1,y:B.y}],col,.15);g.strokeStyle=col;g.fillStyle=col;
  seg(x1,A.y,x2,A.y);seg(x1,B.y,x2,B.y);seg(xm,A.y,xm,B.y);head({x:xm,y:A.y},{x:xm,y:B.y},8);txt(`${dp>=0?'+':''}${fp(dp)} (${(dp/A.p*100).toFixed(2)}%)`,xm,B.y+(dp>=0?-14:14),{bg:col,col:'#fff',fs:11,ni:1});break}
 case'drng':{const a=c.view(),i0=Math.round(t2l(c,Math.min(A.t,B.t))),i1=Math.round(t2l(c,Math.max(A.t,B.t)));let v=0;for(let i=Math.max(0,i0);i<=Math.min(a.length-1,i1);i++)v+=a[i].volume||0;
  const x1=Math.min(A.x,B.x),x2=Math.max(A.x,B.x),col='#2962ff';fillP([{x:x1,y:0},{x:x2,y:0},{x:x2,y:H},{x:x1,y:H}],col,.1);g.strokeStyle=col;g.fillStyle=col;seg(x1,0,x1,H);seg(x2,0,x2,H);seg(x1,A.y,x2,A.y);head({x:x1,y:A.y},{x:x2,y:A.y},8);
  txt(`${i1-i0} bars, ${fmtD(B.t-A.t)}\nVol ${fmtV(v)}`,(x1+x2)/2,A.y-24,{bg:col,col:'#fff',fs:11,ni:1});break}
 case'dprng':case'ruler':{const a=c.view(),dp=B.p-A.p,i0=Math.round(t2l(c,Math.min(A.t,B.t))),i1=Math.round(t2l(c,Math.max(A.t,B.t)));let v=0;for(let i=Math.max(0,i0);i<=Math.min(a.length-1,i1);i++)v+=a[i].volume||0;
  const col=dp>=0?'#2962ff':'#f23645',x1=Math.min(A.x,B.x),x2=Math.max(A.x,B.x),y1=Math.min(A.y,B.y),y2=Math.max(A.y,B.y),xm=(x1+x2)/2,ym=(y1+y2)/2;
  fillP([{x:x1,y:y1},{x:x2,y:y1},{x:x2,y:y2},{x:x1,y:y2}],col,.15);g.strokeStyle=col;g.fillStyle=col;g.save();g.setLineDash([]);seg(x1,ym,x2,ym);head({x:x1,y:ym},{x:x2,y:ym},8);seg(xm,y1,xm,y2);head({x:xm,y:y1},{x:xm,y:y2},8);g.restore();
  txt(`${dp>=0?'+':''}${fp(dp)} (${(dp/A.p*100).toFixed(2)}%)\n${i1-i0} bars, ${fmtD(B.t-A.t)}\nVol ${fmtV(v)}`,xm,dp>=0?y1-30:y2+30,{bg:col,col:'#fff',fs:11,ni:1});break}
 case'brush':case'hilite':{const w=k==='hilite'?Math.max(o.w,10):o.w;g.save();if(k==='hilite')g.globalAlpha=.35;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';
  g.beginPath();P.forEach((q,i)=>{if(!i)g.moveTo(q.x,q.y);else{const p=P[i-1];g.quadraticCurveTo(p.x,p.y,(p.x+q.x)/2,(p.y+q.y)/2)}});g.stroke();g.restore();if(hit)for(let i=1;i<P.length;i++)hit.s.push([P[i-1].x,P[i-1].y,P[i].x,P[i].y]);break}
 case'arr':seg(A.x,A.y,B.x,B.y);head(A,B,8+o.w*2);break;
 case'amark':{const dx=B.x-A.x,dy=B.y-A.y,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,nx=-uy,ny=ux,hl=Math.min(22,L*.5),sw=3+o.w,hw=10+o.w*2,bx=B.x-ux*hl,by=B.y-uy*hl;
  const pts=[{x:A.x+nx*sw/2,y:A.y+ny*sw/2},{x:bx+nx*sw/2,y:by+ny*sw/2},{x:bx+nx*hw,y:by+ny*hw},B,{x:bx-nx*hw,y:by-ny*hw},{x:bx-nx*sw/2,y:by-ny*sw/2},{x:A.x-nx*sw/2,y:A.y-ny*sw/2}];g.save();g.setLineDash([]);path(pts,1);g.fill();g.restore();hit&&hit.f.push(pts);break}
 case'aup':case'adn':{const s=k==='aup'?1:-1,pts=[A,{x:A.x+13,y:A.y+14*s},{x:A.x+6,y:A.y+14*s},{x:A.x+6,y:A.y+38*s},{x:A.x-6,y:A.y+38*s},{x:A.x-6,y:A.y+14*s},{x:A.x-13,y:A.y+14*s}];g.save();g.setLineDash([]);path(pts,1);g.fill();g.restore();hit&&hit.f.push(pts);if(o.txt)txt(o.txt,A.x,A.y+(46*s),{fs:o.fs});break}
 case'rect':{const pts=[A,{x:B.x,y:A.y},B,{x:A.x,y:B.y}];poly(pts,true,1);break}
 case'rrect':{const dx=B.x-A.x,dy=B.y-A.y,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,h=(C.x-A.x)*nx+(C.y-A.y)*ny;poly([A,B,{x:B.x+nx*h,y:B.y+ny*h},{x:A.x+nx*h,y:A.y+ny*h}],true,1);break}
 case'circle':poly(cirP(A.x,A.y,Math.hypot(B.x-A.x,B.y-A.y),Math.hypot(B.x-A.x,B.y-A.y)),true,1);break;
 case'ellipse':poly(cirP((A.x+B.x)/2,(A.y+B.y)/2,Math.abs(B.x-A.x)/2,Math.abs(B.y-A.y)/2),true,1);break;
 case'path':poly(P,false,0);if(P.length>1&&o.arrow!==0)head(P[P.length-2],P[P.length-1],8+o.w);break;
 case'poly':poly(P,true,1);break;
 case'tri3':poly([A,B,C],true,1);break;
 case'arc':{const pts=arcPts(A,B,C);fillP(pts);path(pts);g.stroke();rec(pts);break}
 case'curve':{const Cc=C||{x:(A.x+B.x)/2+(A.y-B.y)*.25,y:(A.y+B.y)/2+(B.x-A.x)*.25},pts=[];for(let i=0;i<=40;i++){const t=i/40;pts.push({x:(1-t)*(1-t)*A.x+2*(1-t)*t*Cc.x+t*t*B.x,y:(1-t)*(1-t)*A.y+2*(1-t)*t*Cc.y+t*t*B.y})}path(pts);g.stroke();rec(pts);break}
 case'dcurve':{const mx=(A.x+B.x)/2,pts=[];for(let i=0;i<=40;i++){const t=i/40,u=1-t;pts.push({x:u*u*u*A.x+3*u*u*t*mx+3*u*t*t*mx+t*t*t*B.x,y:u*u*u*A.y+3*u*u*t*A.y+3*u*t*t*B.y+t*t*t*B.y})}path(pts);g.stroke();rec(pts);break}
 case'text':txt(o.txt||'Text',A.x,A.y,{bg:o.bg?(o.fill||'#2a2e39'):null,bd:o.bg?o.col:null,pad:6});break;
 case'note':{const bx=A.x+30,by=A.y-44;seg(A.x,A.y,bx,by);g.save();g.setLineDash([]);g.beginPath();g.arc(A.x,A.y,3.5,0,TAU);g.fill();g.restore();txt(o.txt||'Note',bx,by,{al:'left',bg:o.fill||'#2a2e39',bd:o.col,pad:7,col:o.tc});break}
 case'pnote':{seg(A.x,A.y,B.x,B.y);g.save();g.setLineDash([]);g.beginPath();g.arc(A.x,A.y,3.5,0,TAU);g.fill();g.restore();txt(fp(A.p),A.x-6,A.y,{al:'right',bg:o.col,col:'#131722',fs:10,pad:3,ni:1});txt(o.txt||'Price note',B.x,B.y,{al:'left',bg:o.fill||'#2a2e39',bd:o.col,pad:7});break}
 case'pin':{g.save();g.setLineDash([]);g.beginPath();g.moveTo(A.x,A.y);g.bezierCurveTo(A.x-14,A.y-12,A.x-10,A.y-30,A.x,A.y-30);g.bezierCurveTo(A.x+10,A.y-30,A.x+14,A.y-12,A.x,A.y);g.fill();g.fillStyle='#131722';g.beginPath();g.arc(A.x,A.y-21,4,0,TAU);g.fill();g.restore();hit&&hit.f.push([{x:A.x-10,y:A.y-32},{x:A.x+10,y:A.y-32},{x:A.x+6,y:A.y},{x:A.x-6,y:A.y}]);if(o.txt)txt(o.txt,A.x,A.y-48,{bg:o.fill||'#2a2e39',bd:o.col,pad:6});break}
 case'table':{const rw=Math.max(1,o.rows|0||2),cl=Math.max(1,o.cols|0||2),cells=(o.cells||'').split('|'),cw=o.cw||90,ch=(o.fs||12)*2.1;g.save();g.setLineDash([]);g.fillStyle=o.fill||'#2a2e39';g.fillRect(A.x,A.y,cw*cl,ch*rw);hit&&hit.f.push([A,{x:A.x+cw*cl,y:A.y},{x:A.x+cw*cl,y:A.y+ch*rw},{x:A.x,y:A.y+ch*rw}]);g.strokeRect(A.x,A.y,cw*cl,ch*rw);
  for(let r=0;r<rw;r++)for(let q=0;q<cl;q++){if(r)seg(A.x,A.y+r*ch,A.x+cw*cl,A.y+r*ch);if(q&&!r)seg(A.x+q*cw,A.y,A.x+q*cw,A.y+ch*rw);g.fillStyle=o.tc;g.font=`${o.b?'bold ':''}${o.fs||12}px system-ui`;g.textAlign='center';g.textBaseline='middle';g.fillText((cells[r*cl+q]||'').trim(),A.x+q*cw+cw/2,A.y+r*ch+ch/2)}g.restore();break}
 case'callout':{const s=String(o.txt||'Callout'),w=Math.max(60,s.split('\n').reduce((m,t)=>Math.max(m,t.length),0)*(o.fs||12)*.6+16),h=(o.fs||12)*1.3*s.split('\n').length+14,x0=B.x-w/2,y0=B.y-h/2,dx=A.x-B.x,dy=A.y-B.y;let tail;
  if(Math.abs(dx)/w>Math.abs(dy)/h){const sx=dx>0?x0+w:x0;tail=[{x:sx,y:B.y-8},{x:A.x,y:A.y},{x:sx,y:B.y+8}]}else{const sy2=dy>0?y0+h:y0;tail=[{x:B.x-8,y:sy2},{x:A.x,y:A.y},{x:B.x+8,y:sy2}]}
  g.save();g.setLineDash([]);fillP(tail,o.fill||'#2a2e39',1);path(tail);g.stroke();rec(tail);g.restore();txt(s,B.x,B.y,{bg:o.fill||'#2a2e39',bd:o.col,pad:7});break}
 case'comment':{const s=String(o.txt||'Comment');g.save();g.setLineDash([]);const r=txt(s,A.x+8,A.y-26,{al:'left',bg:o.fill||'#2a2e39',bd:o.col,pad:8,r:12});g.fillStyle=o.fill||'#2a2e39';g.beginPath();g.moveTo(A.x,A.y);g.lineTo(A.x+8,A.y-14);g.lineTo(A.x+22,A.y-14);g.closePath();g.fill();g.stroke();g.restore();break}
 case'plabel':{const s=o.txt||fp(A.p),w=g.measureText(s).width+14;g.save();g.setLineDash([]);g.font=`bold ${o.fs||12}px system-ui`;const ww=g.measureText(s).width+14,h=(o.fs||12)+10;const pts=[A,{x:A.x+8,y:A.y-h/2},{x:A.x+8+ww,y:A.y-h/2},{x:A.x+8+ww,y:A.y+h/2},{x:A.x+8,y:A.y+h/2}];path(pts,1);g.fill();hit&&hit.f.push(pts);g.fillStyle='#131722';g.textAlign='left';g.fillText(s,A.x+14,A.y+.5);g.restore();break}
 case'sign':{const h=70;seg(A.x,A.y,A.x,A.y-h);g.save();g.setLineDash([]);g.beginPath();g.arc(A.x,A.y,3.5,0,TAU);g.fill();g.restore();txt(o.txt||'Signpost',A.x,A.y-h-12,{bg:o.col,col:'#131722',pad:7,r:6,ni:1});break}
 case'flag':{g.save();g.setLineDash([]);seg(A.x,A.y,A.x,A.y-34);const pts=[{x:A.x,y:A.y-34},{x:A.x+22,y:A.y-28},{x:A.x,y:A.y-20}];path(pts,1);g.fill();hit&&hit.f.push(pts);g.restore();if(o.txt)txt(o.txt,A.x+26,A.y-28,{al:'left',fs:o.fs});break}
 case'image':{let im=IMG.get(o.id);if(!im&&o.img){im=new Image();im.onload=()=>{im.ok=1};im.src=o.img;IMG.set(o.id,im)}const w=+o.iw||140;
  if(im&&im.ok){const h=w*im.naturalHeight/im.naturalWidth;g.drawImage(im,A.x-w/2,A.y-h/2,w,h);g.save();g.setLineDash([]);if(o.bd!==0)g.strokeRect(A.x-w/2,A.y-h/2,w,h);g.restore();hit&&hit.f.push([{x:A.x-w/2,y:A.y-h/2},{x:A.x+w/2,y:A.y-h/2},{x:A.x+w/2,y:A.y+h/2},{x:A.x-w/2,y:A.y+h/2}])}
  else txt('Image…',A.x,A.y,{bg:'#2a2e39',pad:10});break}
 case'post':{const w=+o.iw||260;g.save();g.setLineDash([]);g.font=`${o.fs||12}px system-ui`;const lines=wrapT(g,o.txt||'Post text',w-24),lh=(o.fs||12)*1.4,h=54+lines.length*lh,x0=A.x,y0=A.y-h;
  g.fillStyle='#15181c';g.beginPath();if(g.roundRect)g.roundRect(x0,y0,w,h,12);else g.rect(x0,y0,w,h);g.fill();g.strokeStyle='#2f3336';g.stroke();hit&&hit.f.push([{x:x0,y:y0},{x:x0+w,y:y0},{x:x0+w,y:A.y},{x:x0,y:A.y}]);
  g.fillStyle='#eff3f4';g.beginPath();g.arc(x0+24,y0+24,12,0,TAU);g.fill();g.fillStyle='#000';g.font='bold 13px system-ui';g.textAlign='center';g.fillText('𝕏',x0+24,y0+25);
  g.textAlign='left';g.fillStyle='#eff3f4';g.font='bold 13px system-ui';g.fillText(o.name||'Name',x0+44,y0+18);g.fillStyle='#71767b';g.font='12px system-ui';g.fillText('@'+(o.handle||'handle'),x0+44,y0+34);
  g.fillStyle='#eff3f4';g.font=`${o.fs||12}px system-ui`;lines.forEach((t,i)=>g.fillText(t,x0+12,y0+54+i*lh));g.restore();seg(A.x,A.y,A.x,A.y+10);break}
 case'idea':{const s=o.txt||'Idea',r=txt('💡 '+s,A.x,A.y-30,{al:'left',bg:o.fill||'#2a2e39',bd:o.col,pad:9,r:8,fs:(o.fs||12)+1});seg(A.x,A.y,A.x+14,A.y-18);g.save();g.setLineDash([]);g.beginPath();g.arc(A.x,A.y,3.5,0,TAU);g.fill();g.restore();break}
 case'emoji':case'icon':{const sz=+o.es||32;g.save();g.setLineDash([]);g.font=`${sz}px system-ui,"Apple Color Emoji","Segoe UI Emoji",sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillStyle=o.col;g.fillText(o.em||'😀',A.x,A.y);g.restore();hit&&hit.f.push([{x:A.x-sz/2,y:A.y-sz/2},{x:A.x+sz/2,y:A.y-sz/2},{x:A.x+sz/2,y:A.y+sz/2},{x:A.x-sz/2,y:A.y+sz/2}]);break}
 }
 const SELF=new Set(['text','note','pnote','pin','callout','comment','plabel','sign','flag','post','idea','aup','adn','table','image','emoji','icon']);
 if(o.txt&&!SELF.has(k)){const xs=P.map(q=>q.x),ys=P.map(q=>q.y);txt(o.txt,(Math.min(...xs)+Math.max(...xs))/2,Math.min(...ys)-12,{fs:o.fs})}
 }finally{g.restore()}}

if(!HAS){if(typeof module!=='undefined')module.exports={paint,TD,MENU,mkLv,baseStyle,t2l,l2t,vprofile,regress,arcPts,circum:circum};return}

/* ================= MultiChart Pro integration ================= */
const D=document,$=s=>D.querySelector(s);
S.dp=S.dp||{};
const O=S.dpo=Object.assign({stay:0,lock:0,favBar:1,snapInd:0,last:{},def:{},fav:['tl','ray','hray','vl','pch','fib','fext','gbox','eimp','ecor','long','short','avwap','frvp','prng','drng','hilite','rect','path','curve']},S.dpo||{});
O.hid=Object.assign({dr:0,ind:0,pos:0},O.hid||{});
S.set=S.set||{};
let tool='cur',pts=[],pc=null,mouse=null,sel=null,drag=null,ds=null,free=null,hist=[],redoS=[],pendEm=null,pendImg=null,curStyle='cross';
let SH=0,CT=0,AL=0,msel=new Set(),clip=null,trail=[],lm=null;
const uid=()=>'d'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const lst=sym=>S.dp[sym]||(S.dp[sym]=[]);
const snapJ=()=>JSON.stringify(S.dp),pushH=()=>{hist.push(snapJ());if(hist.length>80)hist.shift();redoS=[]};
const undo=()=>{if(!hist.length)return;redoS.push(snapJ());S.dp=JSON.parse(hist.pop());sel=null;hideFloat();save()};
const redo=()=>{if(!redoS.length)return;hist.push(snapJ());S.dp=JSON.parse(redoS.pop());sel=null;hideFloat();save()};
const drOn=()=>!(S.edge&&S.edge.dr===0);
const HK={};Object.values(TD).forEach(t=>{if(t.hk)HK[t.hk.toUpperCase()]=t.id});
const visTf=(c,o)=>{if(!o.vis)return true;const m=c.tfm||1,i=m<60?0:m<1440?1:m<10080?2:3;return o.vis[i]!==0};
const shown=(c,o)=>drOn()&&!O.hid.dr&&!(O.hid.pos&&POSK.includes(o.k))&&visTf(c,o);
const touchDef=o=>{const d={};['col','w','ls','fill','fo','tc','fs','b','i'].forEach(k=>{if(o[k]!=null)d[k]=o[k]});O.def[o.k]=d};
const actChart=()=>(typeof act!=='undefined'&&act)||charts[0];

/* ---------- icons ---------- */
const p=d=>`<path d="${d}"/>`,ci=(x,y,r=1.8)=>`<circle cx="${x}" cy="${y}" r="${r}"/>`,rc=(x,y,w,h,r=0)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`;
const pol=a=>p('M'+a.map(q=>q.join(' ')).join('L'))+a.map(q=>ci(q[0],q[1],1.4)).join('');
const fork=p('M12 21V9M6 9V3M18 9V3M6 9h12')+ci(12,21);
const ICO={cross:p('M12 3v7M12 14v7M3 12h7M14 12h7'),dot:ci(12,12,2.6),arrow:p('M6 4l11 7-5 1.5-2.5 5z'),
 tl:p('M5 19L19 5')+ci(5,19)+ci(19,5),ray:p('M5 19L21 3')+ci(5,19),info:p('M5 18L16 7M14 14h7v5h-7z')+ci(5,18),ext:p('M3 21L21 3')+ci(8,16)+ci(16,8),
 angle:p('M5 19h15M5 19L18 8M11 19a6 6 0 0 0-2-4')+ci(5,19)+ci(18,8),hl:p('M3 12h18')+ci(12,12),hray:p('M6 12h15')+ci(6,12),vl:p('M12 3v18')+ci(12,12),cl:p('M12 3v18M3 12h18')+ci(12,12),
 pch:p('M4 14L16 4M8 20L20 10')+ci(4,14)+ci(16,4)+ci(8,20),reg:p('M4 16L20 8M4 11L20 3M4 21L20 13'),flat:p('M4 16L18 6M4 20h14')+ci(4,16)+ci(18,6),dis:p('M4 8L11 4M13 20L20 16')+ci(4,8)+ci(11,4)+ci(13,20)+ci(20,16),
 pf:fork,spf:fork,mpf:fork,ipf:fork+p('M9 9v-3M15 9v-3'),
 fib:p('M3 6h18M3 11h12M3 16h12M3 21h18')+ci(21,6,1.4),fext:p('M3 6h18M3 12h12M3 18h18'),fch:p('M3 16L17 7M3 11L17 2M3 21L17 12'),ftz:p('M5 3v18M9 3v18M13 3v18M19 3v18'),
 ffan:p('M4 20L20 4M4 20L20 10M4 20L20 15M4 20L20 20'),ftime:p('M4 4v16M12 4v16M16 4v16M22 4v16'),fcir:ci(12,12,8,8)+ci(12,12,4),fspi:p('M12 12a2 2 0 0 1 2 2a4 4 0 0 1-4 4a6 6 0 0 1-6-6a8 8 0 0 1 8-8a10 10 0 0 1 10 10'),
 farc:p('M3 20a9 9 0 0 1 18 0M7 20a5 5 0 0 1 10 0'),fwed:p('M4 20L20 6M4 20L12 4M8 20a4 4 0 0 0 3-4M13 20a9 9 0 0 0 5-10'),pfan:p('M4 20L20 4M4 20L20 9M4 20L20 14M4 20L20 19'),
 gbox:rc(3,3,18,18)+p('M3 9h18M3 15h18M9 3v18M15 3v18'),gsqf:rc(3,3,18,18)+p('M3 3L21 21M21 3L3 21'),gsq:rc(3,3,18,18)+p('M3 3L21 21M21 3L3 21M12 3L21 12L12 21L3 12z'),gfan:p('M4 20L20 4M4 20L20 8M4 20L20 12M4 20L20 16'),
 xabcd:pol([[3,18],[7,6],[12,15],[16,5],[21,18]]),cypher:pol([[3,17],[8,6],[13,14],[18,5],[21,15]]),hns:pol([[2,18],[6,12],[9,16],[12,6],[15,16],[18,12],[22,18]]),abcd:pol([[4,18],[9,6],[15,16],[20,4]]),
 tri:pol([[3,6],[20,9],[6,18],[20,15]]),drives:pol([[2,19],[6,12],[9,15],[13,8],[16,11],[20,4]]),eimp:pol([[2,19],[6,10],[9,15],[14,4],[17,11],[21,6]]),ecor:pol([[3,6],[9,16],[14,9],[20,19]]),
 etri:pol([[2,12],[6,5],[10,19],[14,8],[17,15],[21,11]]),edbl:pol([[3,18],[8,6],[13,16],[20,5]]),etrp:pol([[2,18],[6,7],[10,15],[14,6],[18,15],[22,5]]),
 cyc:p('M5 3v18M10 3v18M15 3v18M20 3v18'),tcyc:p('M2 16a5 8 0 0 1 10 0a5 8 0 0 1 10 0'),sine:p('M2 12c3-10 6-10 10 0s7 10 10 0'),
 long:rc(4,4,16,7)+rc(4,11,16,9)+p('M4 11h16'),short:rc(4,4,16,9)+rc(4,13,16,7)+p('M4 13h16'),pforc:p('M4 18L18 6M14 5h5v5')+ci(4,18),bpat:p('M5 6v10M9 8v8M13 5v9M17 9v8')+p('M3 20h18'),
 ghost:p('M4 16l4-5 4 3 6-8')+ci(18,6,1.4),sector:p('M4 20L18 6M4 20L20 16M14 8a8 8 0 0 1 5 6'),avwap:p('M3 15c4-8 8 4 12-4s4 0 6-2')+ci(3,15),
 frvp:p('M3 3v18M4 5h8M4 9h12M4 13h6M4 17h10'),avp:p('M3 3v18M4 5h8M4 9h12M4 13h6M4 17h10')+ci(3,3,1.6),
 prng:p('M12 4v16M9 7l3-3 3 3M9 17l3 3 3-3M5 4h14M5 20h14'),drng:p('M4 12h16M7 9l-3 3 3 3M17 9l3 3-3 3M4 5v14M20 5v14'),dprng:rc(4,4,16,16)+p('M12 7v10M9 10l3-3 3 3M9 14l3 3 3-3'),
 brush:p('M20 4L10 14M10 14c-3 0-4 2-4 4s-2 2-2 2c4 1 8 0 8-4z'),hilite:p('M15 4l5 5-9 9H6v-5zM4 21h16'),amark:p('M5 19L19 5M19 5h-8M19 5v8'),arr:p('M5 19L19 5M15 5h4v4'),aup:p('M12 20V6M6 12l6-6 6 6'),adn:p('M12 4v14M6 12l6 6 6-6'),
 rect:rc(4,6,16,12),rrect:p('M3 14l9-9 9 9-9 9z'),path:p('M4 18L10 8l5 7 6-9'),circle:ci(12,12,8,8),ellipse:`<ellipse cx="12" cy="12" rx="9" ry="6"/>`,poly:p('M4 17L8 6l8 2 4 9z'),tri3:p('M12 5L21 19H3z'),
 arc:p('M4 18a10 10 0 0 1 16 0'),curve:p('M4 18Q12 0 20 18'),dcurve:p('M4 18C12 18 12 6 20 6'),
 text:p('M5 6h14M12 6v13'),note:p('M5 4h14v12H10l-5 4z'),pnote:rc(9,4,12,8)+p('M4 20L10 12'),pin:p('M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11z')+ci(12,10,2),table:rc(3,5,18,14)+p('M3 12h18M12 5v14'),
 callout:p('M4 5h16v11H11l-5 4v-4H4z'),comment:p('M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-5 4v-4H6a2 2 0 0 1-2-2z'),plabel:p('M3 12l5-5h13v10H8z'),sign:p('M12 21V8M5 4h14v6H5z'),flag:p('M6 21V4M6 5h12l-3 4 3 4H6'),
 image:rc(3,4,18,16)+ci(9,10,1.6)+p('M4 18l5-5 4 4 3-3 4 4'),post:p('M5 5l14 14M19 5L5 19'),idea:p('M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 0 0-4-10z'),
 emoji:ci(12,12,9,9)+ci(9,10,1)+ci(15,10,1)+p('M8 14c1 2 7 2 8 0'),icon:p('M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z'),
 ruler:p('M3 17L17 3l4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2'),zoom:ci(11,11,6,6)+p('M16 16l5 5M11 8v6M8 11h6'),magnet:p('M6 4v8a6 6 0 0 0 12 0V4h-4v8a2 2 0 0 1-4 0V4z'),
 stay:p('M4 20l1-4L17 4l3 3L8 19z')+p('M4 20h4'),lock:rc(5,11,14,9,1)+p('M8 11V8a4 4 0 0 1 8 0v3'),unlock:rc(5,11,14,9,1)+p('M8 11V8a4 4 0 0 1 7-2'),
 eye:p('M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z')+ci(12,12,3),eyeoff:p('M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM3 3l18 18'),trash:p('M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13M10 11v6M14 11v6'),star:p('M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z')};
const svg=(id,z=22)=>`<svg viewBox="0 0 24 24" width="${z}" height="${z}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${ICO[id]||ci(12,12,6)}</svg>`;

/* ---------- styles ---------- */
const css=D.createElement('style');
css.textContent=`#ltb{width:50px!important;padding:6px 0!important;gap:1px!important;overflow-y:auto;overflow-x:hidden;scrollbar-width:none}#ltb::-webkit-scrollbar{display:none}
#ltb button.dpb{position:relative;width:44px!important;height:36px!important;display:flex;align-items:center;justify-content:center;background:none;border:0;border-radius:6px;color:#b2b5be;cursor:pointer;padding:0;flex:0 0 auto}
#ltb button.dpb:hover{background:#2a2e39;color:#fff}#ltb button.dpb.act{background:#2962ff;color:#fff}
#ltb .car{position:absolute;right:0;top:0;bottom:0;width:11px;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:8px;color:#6a6f7d;border-radius:0 6px 6px 0}
#ltb .car:hover{background:#363a45;color:#fff}#ltb .sep{height:1px;background:#2a2e39;margin:4px 8px;flex:0 0 auto}
#dpfly{position:fixed;z-index:400;background:#1e222d;border:1px solid #363a45;border-radius:6px;box-shadow:0 6px 24px rgba(0,0,0,.5);padding:4px 0;min-width:250px;max-width:340px;overflow-y:auto;font:13px system-ui;color:#d1d4dc}
#dpfly .sh{padding:10px 14px 4px;font-size:11px;letter-spacing:.06em;color:#787b86;text-transform:uppercase}#dpfly hr{border:0;border-top:1px solid #363a45;margin:4px 0}
#dpfly .dpi{display:flex;align-items:center;gap:10px;padding:6px 14px;cursor:pointer;white-space:nowrap}#dpfly .dpi:hover{background:#2a2e39}#dpfly .dpi.on{background:#2a2e39;color:#fff}
#dpfly .dpi .nm{flex:1;overflow:hidden;text-overflow:ellipsis}#dpfly .dpi .hk{color:#787b86;font-size:11px}#dpfly .dpi .ic{width:22px;display:flex;color:#b2b5be}
#dpfly .fs{color:#4a4f5c;font-size:15px;line-height:1;cursor:pointer;width:18px;text-align:center}#dpfly .fs.on{color:#e6b422}#dpfly .fs:hover{color:#ffd54f}
#dpfly .eg{display:grid;grid-template-columns:repeat(8,1fr);gap:2px;padding:6px 10px}#dpfly .eg span{font-size:20px;text-align:center;padding:3px;border-radius:4px;cursor:pointer}#dpfly .eg span:hover{background:#2a2e39}
#dpfly .tg{width:30px;height:16px;border-radius:9px;background:#434651;position:relative;margin-left:auto}#dpfly .tg:after{content:"";position:absolute;left:2px;top:2px;width:12px;height:12px;border-radius:50%;background:#fff;transition:.15s}#dpfly .tg.on{background:#2962ff}#dpfly .tg.on:after{left:16px}
#dpft{position:fixed;z-index:300;display:none;align-items:center;gap:4px;background:#1e222d;border:1px solid #363a45;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.45);padding:4px 6px;font:12px system-ui;color:#d1d4dc;transform:translateX(-50%)}
#dpft input[type=color]{width:26px;height:24px;padding:0;border:1px solid #363a45;background:none;border-radius:4px;cursor:pointer}#dpft select{background:#131722;color:#d1d4dc;border:1px solid #363a45;border-radius:4px;height:24px}
#dpft button{background:none;border:0;color:#b2b5be;cursor:pointer;width:26px;height:26px;border-radius:4px;font-size:14px}#dpft button:hover{background:#2a2e39;color:#fff}#dpft .sp{width:1px;height:18px;background:#363a45;margin:0 2px}
#dpfav{position:fixed;z-index:120;top:52px;left:50%;transform:translateX(-50%);display:flex;gap:2px;background:#1e222d;border:1px solid #363a45;border-radius:6px;padding:3px;box-shadow:0 3px 12px rgba(0,0,0,.4);max-width:70vw;overflow-x:auto}
#dpfav button{background:none;border:0;color:#b2b5be;width:30px;height:28px;border-radius:4px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:0 0 auto}#dpfav button:hover{background:#2a2e39;color:#fff}#dpfav button.act{background:#2962ff;color:#fff}
#dpset,#dpask{position:fixed;z-index:420;background:#1e222d;border:1px solid #363a45;border-radius:8px;box-shadow:0 10px 40px rgba(0,0,0,.6);font:13px system-ui;color:#d1d4dc;display:none}
#dpset{right:70px;top:70px;width:380px;max-height:calc(100vh - 100px);flex-direction:column}#dpset.on{display:flex}
#dpset .hd{display:flex;align-items:center;padding:12px 14px;font-weight:600;font-size:15px;cursor:move}#dpset .hd span{flex:1}#dpset .hd b{cursor:pointer;color:#787b86;font-size:18px;font-weight:400}
#dpset .tb{display:flex;gap:2px;padding:0 10px;border-bottom:1px solid #363a45;overflow-x:auto}#dpset .tb div{padding:7px 10px;cursor:pointer;color:#787b86;border-bottom:2px solid transparent;white-space:nowrap}#dpset .tb div.on{color:#fff;border-color:#2962ff}
#dpset .bd{padding:10px 14px;overflow-y:auto;flex:1}#dpset .ft{display:flex;justify-content:space-between;padding:10px 14px;border-top:1px solid #363a45}
#dpset label.r{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:6px 0}#dpset label.r>span{flex:1;color:#b2b5be}
#dpset input[type=number],#dpset input[type=text],#dpset select,#dpset textarea,#dpset input[type=datetime-local]{background:#131722;color:#d1d4dc;border:1px solid #363a45;border-radius:4px;padding:4px 6px;font:12px system-ui;width:150px}
#dpset textarea{width:100%;min-height:70px;resize:vertical;box-sizing:border-box}#dpset input[type=color]{width:34px;height:26px;padding:0;border:1px solid #363a45;background:none;border-radius:4px}
#dpset .lv{display:flex;align-items:center;gap:8px;margin:4px 0}#dpset .lv input[type=number]{width:80px}
#dpset button,#dpask button{background:#2a2e39;color:#d1d4dc;border:1px solid #363a45;border-radius:5px;padding:6px 14px;cursor:pointer;font:13px system-ui}#dpset button:hover,#dpask button:hover{background:#363a45}#dpset button.pr,#dpask button.pr{background:#2962ff;border-color:#2962ff;color:#fff}
#dpask{left:50%;top:30%;transform:translateX(-50%);width:340px;padding:14px}#dpask.on{display:block}#dpask textarea{width:100%;min-height:80px;box-sizing:border-box;background:#131722;color:#d1d4dc;border:1px solid #363a45;border-radius:4px;padding:6px;font:13px system-ui;margin:8px 0}
#dpctx{position:fixed;z-index:430;background:#1e222d;border:1px solid #363a45;border-radius:6px;padding:4px 0;font:13px system-ui;color:#d1d4dc;display:none;min-width:170px;box-shadow:0 6px 24px rgba(0,0,0,.5)}#dpctx div{padding:6px 14px;cursor:pointer}#dpctx div:hover{background:#2a2e39}
${PERP_ONLY?'#tc,#e_fut,#e_mt5{display:none!important}':''}`;
D.head.appendChild(css);

/* ---------- geometry for a chart ---------- */
function area(c){const k=c.dpc,ts=c.c.timeScale();let pw=50,th=26;try{pw=c.c.priceScale('right').width()||50}catch(e){}try{th=ts.height()||26}catch(e){}return{W:Math.max(10,k.clientWidth-pw),H:Math.max(10,k.clientHeight-th)}}
function shiftXY(c,x,y){const a=pxs(c,{p:[pts[pts.length-1]]})[0];if(!a||a.x==null||a.y==null)return[x,y];const dx=x-a.x,dy=y-a.y;
 if(['rect','gbox','circle','ellipse'].includes(tool)){const m=Math.max(Math.abs(dx),Math.abs(dy));return[a.x+(dx<0?-m:m),a.y+(dy<0?-m:m)]}
 if(['tl','ray','info','ext','angle','arr','pch'].includes(tool)){const r=Math.hypot(dx,dy),an=Math.round(Math.atan2(dy,dx)/(Math.PI/4))*Math.PI/4;return[a.x+r*Math.cos(an),a.y+r*Math.sin(an)]}
 return[x,y]}
function pt2d(c,x,y,nomag){if(SH&&!nomag&&pc===c&&pts.length&&!drag&&!free){const r=shiftXY(c,x,y);x=r[0];y=r[1];nomag=1}const l=c.c.timeScale().coordinateToLogical(x);let pr=c.s.coordinateToPrice(y);if(l==null||pr==null)return null;let lg=l;let m=+S.set.mag||0;if(CT&&!nomag)m=m?0:1;const a=c.view();
 if(m&&!nomag&&a.length){const i=Math.round(l);if(i>=0&&i<a.length){const b=a[i],nr=[b.open,b.high,b.low,b.close].reduce((q,v)=>Math.abs(v-pr)<Math.abs(q-pr)?v:q),yy=c.s.priceToCoordinate(nr);if(yy!=null&&(m===2||Math.abs(yy-y)<=((S.tv&&+S.tv.mg)||6))){pr=nr;lg=i}}}
 const t=l2t(c,lg);return t==null?null:{t,p:pr}}
const mp=(c,e)=>{const r=c.dpc.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
const pxs=(c,o)=>o.p.map(q=>({x:t2x(c,q.t),y:c.s.priceToCoordinate(q.p)}));
function pick(c,x,y){const L=lst(c.cfg.sym);
 if(sel&&L.includes(sel)&&!sel.lk&&shown(c,sel)&&!['brush','hilite'].includes(sel.k)){const P=pxs(c,sel);for(let i=0;i<P.length;i++)if(P[i].x!=null&&P[i].y!=null&&Math.hypot(P[i].x-x,P[i].y-y)<=9)return{o:sel,i}}
 for(let j=L.length-1;j>=0;j--){const o=L[j];if(!shown(c,o))continue;const h=HM.get(o);if(!h)continue;
  for(const s of h.s)if(dseg(x,y,s)<=Math.max(5,o.w/2+3))return{o,i:-1};
  for(const r of h.r)if(x>=r[0]&&x<=r[2]&&y>=r[1]&&y<=r[3])return{o,i:-1};
  for(const f of h.f)if(inPoly(f,x,y))return{o,i:-1}}
 return null}

/* ---------- render loop ---------- */
function style(k){const s=Object.assign(baseStyle(),O.def[k]||{});if(['hilite'].includes(k)&&!(O.def[k]&&O.def[k].w))s.w=16;if(k==='hilite'&&!(O.def[k]&&O.def[k].col))s.col='#ffd54f';return s}
function attach(c){const cv=c.host.querySelector('.cv');if(!cv)return;if(getComputedStyle(cv).position==='static')cv.style.position='relative';
 const k=D.createElement('canvas');k.className='dpc';k.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;z-index:6;pointer-events:none';cv.appendChild(k);c.dpc=k;
 k.onmousemove=e=>{const q=mp(c,e);mouse={c,x:q.x,y:q.y};try{const l=c.c.timeScale().coordinateToLogical(q.x),a=c.view(),d=pt2d(c,q.x,q.y);if(l!=null&&d&&a.length)c.c.setCrosshairPosition(d.p,a[Math.max(0,Math.min(a.length-1,Math.round(l)))].time,c.s)}catch(_){}};
 k.onmouseleave=()=>{mouse=null;try{c.c.clearCrosshairPosition()}catch(_){}};
 k.onmousedown=e=>{if(e.button)return;e.preventDefault();e.stopPropagation();try{setAct(c)}catch(_){}const q=mp(c,e),d=pt2d(c,q.x,q.y),T=TD[tool];if(!d||!T)return;
  if(tool==='brush'||tool==='hilite'){free={c,pts:[d],px:[q]};return}
  if(pc!==c){pts=[];pc=c}pts.push(d);ds=(pts.length===1&&T.need>1)?{x:q.x,y:q.y}:null;if(T.need>0&&pts.length>=T.need)finishObj(c)};
 k.onmouseup=e=>{if(free)return;if(ds&&pc===c&&pts.length===1){const q=mp(c,e);if(Math.hypot(q.x-ds.x,q.y-ds.y)>8){const d=pt2d(c,q.x,q.y);if(d){pts.push(d);const T=TD[tool];if(T.need>0&&pts.length>=T.need)finishObj(c)}}}ds=null};
 k.ondblclick=e=>{const T=TD[tool];if(!T||T.need>=0||pc!==c)return;e.stopPropagation();while(pts.length>1&&pts[pts.length-1].t===pts[pts.length-2].t&&pts[pts.length-1].p===pts[pts.length-2].p)pts.pop();if(pts.length>=(tool==='poly'?3:2))finishObj(c)};
 k.oncontextmenu=e=>{e.preventDefault();pts=[];pc=null;setTool('cur')};
 cv.addEventListener('mousedown',e=>{if(tool!=='cur'||!drOn())return;const q=mp(c,e);
  if(e.button===1){const h=pick(c,q.x,q.y);if(h){e.preventDefault();e.stopImmediatePropagation();sel=h.o;msel.clear();delSel()}return}
  if(e.button===0&&e.shiftKey&&!pick(c,q.x,q.y)){const d=pt2d(c,q.x,q.y);if(d){e.preventDefault();e.stopImmediatePropagation();try{setAct(c)}catch(_){}setTool('ruler',1);pts=[d];pc=c;ds={x:q.x,y:q.y}}}},true);
 cv.addEventListener('mousemove',e=>{const q=mp(c,e);lm={c,x:q.x,y:q.y};if(e.altKey){trail.push({c,x:q.x,y:q.y,t:Date.now()});if(trail.length>90)trail.shift()}},true);
 cv.addEventListener('mousedown',e=>{if(tool!=='cur'||e.button||!drOn())return;const q=mp(c,e),h=pick(c,q.x,q.y);if(!h){if(sel){sel=null;hideFloat();dropTmp()}return}
  e.stopPropagation();e.preventDefault();try{setAct(c)}catch(_){}if(e.ctrlKey&&sel&&sel!==h.o)msel.add(sel);sel=h.o;if(!e.ctrlKey&&!msel.has(h.o))msel.clear();showFloat(c);if(h.o.lk||O.lock)return;drag={c,o:h.o,i:h.i,x:q.x,y:q.y,orig:JSON.parse(JSON.stringify(h.o.p)),moved:0,cl:e.ctrlKey?1:0,grp:(!e.ctrlKey&&msel.has(h.o)&&msel.size>1)?[...msel].map(x=>({o:x,orig:JSON.parse(JSON.stringify(x.p))})):null}},true);
 cv.addEventListener('mousemove',e=>{if(tool!=='cur'||drag)return;const q=mp(c,e);cv.style.cursor=drOn()&&pick(c,q.x,q.y)?'pointer':''},true);
 cv.addEventListener('dblclick',e=>{if(tool!=='cur'||!drOn())return;const q=mp(c,e),h=pick(c,q.x,q.y);if(h){e.stopPropagation();e.preventDefault();sel=h.o;openSet(h.o,c)}},true);
 cv.addEventListener('contextmenu',e=>{if(tool!=='cur'||!drOn())return;const q=mp(c,e),h=pick(c,q.x,q.y);if(h){e.stopPropagation();e.preventDefault();sel=h.o;showFloat(c);ctxMenu(e.clientX,e.clientY,h.o,c)}},true)}
function one(c){if(!c.c||!c.s||!c.host)return;if(c.dpc&&!c.dpc.isConnected)c.dpc=null;if(!c.dpc){if(!c.host.querySelector('.cv'))return;attach(c)}
 const k=c.dpc,w=k.clientWidth,h=k.clientHeight,r=window.devicePixelRatio||1;if(!w||!h)return;if(k.width!==Math.round(w*r)||k.height!==Math.round(h*r)){k.width=Math.round(w*r);k.height=Math.round(h*r)}
 k.style.pointerEvents=tool==='cur'?'none':'auto';k.style.cursor=tool==='cur'?'':(curStyle==='arrow'?'default':curStyle==='dot'?'cell':'crosshair');k.style.visibility=drOn()?'visible':'hidden';
 if(c.ov)c.ov.style.opacity=O.hid.ind?'0':'';if(c.ofd)c.ofd.style.opacity=O.hid.ind?'0':'';
 const g=k.getContext('2d');g.setTransform(r,0,0,r,0,0);g.clearRect(0,0,w,h);const{W,H}=area(c);g.save();g.beginPath();g.rect(0,0,W,H);g.clip();
 const L=S.dp[c.cfg.sym]||[];
 for(const o of L){if(!shown(c,o))continue;try{paint(g,c,o,W,H,0)}catch(e){if(!one.e){one.e=1;console.error('DrawingPro paint',o.k,e)}}}
 if(sel&&L.includes(sel)&&shown(c,sel)&&!['brush','hilite'].includes(sel.k)){pxs(c,sel).forEach(q=>{if(q.x==null||q.y==null)return;g.beginPath();g.arc(q.x,q.y,5,0,TAU);g.fillStyle='#131722';g.fill();g.lineWidth=2;g.strokeStyle='#2962ff';g.stroke()})}
 msel.forEach(o=>{if(!L.includes(o)||!shown(c,o))return;pxs(c,o).forEach(q=>{if(q.x==null||q.y==null)return;g.beginPath();g.arc(q.x,q.y,5,0,TAU);g.fillStyle='#2962ff';g.fill();g.lineWidth=2;g.strokeStyle='#fff';g.stroke()})});
 const T=TD[tool];
 if(T&&tool!=='cur'&&mouse&&mouse.c===c){const d=pt2d(c,mouse.x,mouse.y);
  if(free&&free.c===c){free.px.length&&(()=>{g.strokeStyle=style(tool).col;g.lineWidth=tool==='hilite'?style(tool).w:style(tool).w;g.globalAlpha=tool==='hilite'?.35:1;g.lineCap='round';g.beginPath();free.px.forEach((q,i)=>i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y));g.stroke();g.globalAlpha=1})()}
  else if(d&&T.need!==0&&tool!=='zoom'){const P=(pc===c?pts:[]).slice();P.push(d);let need=T.need>0?T.need:Math.max(2,P.length);while(P.length<need)P.push(d);
   const o=Object.assign({id:'pv',k:tool,p:P.map(q=>({t:q.t,p:q.p}))},style(tool),extra(tool));try{paint(g,c,o,W,H,1)}catch(e){}}
  else if(tool==='zoom'&&pc===c&&pts.length===1){const a=pxs(c,{p:[pts[0]]})[0];g.strokeStyle='#2962ff';g.fillStyle='rgba(41,98,255,.15)';g.fillRect(a.x,a.y,mouse.x-a.x,mouse.y-a.y);g.strokeRect(a.x,a.y,mouse.x-a.x,mouse.y-a.y)}}
 {const now=Date.now();trail=trail.filter(q=>now-q.t<900);const tr=trail.filter(q=>q.c===c);if(tr.length){g.lineCap='round';g.lineJoin='round';for(let i=1;i<tr.length;i++){const a=Math.max(0,1-(now-tr[i].t)/900);g.strokeStyle='rgba(255,60,60,'+a+')';g.lineWidth=5*a+1;g.beginPath();g.moveTo(tr[i-1].x,tr[i-1].y);g.lineTo(tr[i].x,tr[i].y);g.stroke()}
   if(AL){const l=tr[tr.length-1];g.fillStyle='rgba(255,60,60,.35)';g.beginPath();g.arc(l.x,l.y,14,0,TAU);g.fill();g.fillStyle='#ff3c3c';g.beginPath();g.arc(l.x,l.y,4,0,TAU);g.fill()}}}
 g.restore()}
(function frame(){requestAnimationFrame(frame);(typeof charts!=='undefined'?charts:[]).forEach(c=>{try{one(c)}catch(e){if(!frame.e){frame.e=1;console.error('DrawingPro',e)}}})})();

/* ---------- create / modify ---------- */
function extra(k){const o={};if(LVT[k])o.lv=mkLv(k);
 if(k==='long'||k==='short'){o.rr=1;o.acc=1000;o.risk=1;o.tp='#089981';o.sl='#f23645'}
 if(k==='ghost')o.seed=(Math.random()*1e6)|0;if(k==='reg')o.dev=2;if(k==='avwap'){o.bands=1;o.bm=1}
 if(k==='frvp'||k==='avp'){o.rows=24;o.va=70;o.wp=70;o.upc='#2962ff';o.dnc='#fbc02d';o.pocc='#f23645'}
 if(k==='table'){o.rows=2;o.cols=2;o.cw=90;o.cells='Header 1|Header 2|Cell 1|Cell 2'}
 if(k==='emoji'||k==='icon'){o.em=pendEm||'😀';o.es=32}if(k==='image')o.iw=140;if(k==='post'){o.name='Name';o.handle='handle';o.iw=260}
 if(k==='path')o.arrow=1;if(k==='pch')o.mid=1;if(k==='note'||k==='callout'||k==='comment'||k==='idea'||k==='pnote'||k==='table')o.fill='#2a2e39';return o}
const NEEDTXT=new Set(['text','note','pnote','callout','comment','sign','pin','post','idea']);
function commit(c,o){pushH();lst(c.cfg.sym).push(o);save();sel=o;pts=[];pc=null;ds=null;if(!O.stay)setTool('cur');showFloat(c)}
function finishObj(c){const T=TD[tool],P=pts.map(q=>({t:q.t,p:q.p}));
 if(tool==='zoom'){doZoom(c,P);pts=[];pc=null;setTool('cur');return}
 const o=Object.assign({id:uid(),k:tool,p:P},style(tool),extra(tool));
 if(tool==='image'){if(!pendImg){pts=[];pc=null;return}o.img=pendImg}
 if(tool==='curve'&&P.length===2){const a=pxs(c,{p:P}),m=pt2d(c,(a[0].x+a[1].x)/2+(a[0].y-a[1].y)*.25,(a[0].y+a[1].y)/2+(a[1].x-a[0].x)*.25,1);if(m)o.p.push(m)}
 if(tool==='ruler')o.tmp=1;
 if(NEEDTXT.has(tool)){const kk=tool,keep=pts.slice(),cc=c;pts=[];pc=null;askText(({post:'Post text',idea:'Idea',pin:'Pin text (optional)'}[kk])||'Text',{text:'Text',note:'Note',pnote:'Price note',callout:'Callout',comment:'Comment',sign:'Signpost',post:'Post text',idea:'Idea',pin:''}[kk],v=>{if(v==null)return;o.txt=v;commit(cc,o)});return}
 commit(c,o)}
function doZoom(c,P){const l=P.map(q=>t2l(c,q.t)).sort((a,b)=>a-b),pr=P.map(q=>q.p).sort((a,b)=>a-b);if(l[1]-l[0]<1||pr[1]<=pr[0])return;
 c.c.timeScale().setVisibleLogicalRange({from:l[0],to:l[1]});const pad=(pr[1]-pr[0])*.03;c.s.applyOptions({autoscaleInfoProvider:()=>({priceRange:{minValue:pr[0]-pad,maxValue:pr[1]+pad}})});c.zoomed=1}
function zoomReset(c){c.s.applyOptions({autoscaleInfoProvider:o=>o()});c.zoomed=0;try{c.c.timeScale().fitContent()}catch(e){}}
function delSel(){if(!sel)return;const c=actChart();for(const sym in S.dp){const i=S.dp[sym].indexOf(sel);if(i>=0){pushH();S.dp[sym].splice(i,1)}}sel=null;hideFloat();closeSet();save()}
function clone(o,c){const n=JSON.parse(JSON.stringify(o));n.id=uid();n.p.forEach(q=>q.t+=stp(c)*3);pushH();lst(c.cfg.sym).push(n);sel=n;save();showFloat(c)}
D.addEventListener('mousemove',e=>{
 if(free){const c=free.c,q=mp(c,e),d=pt2d(c,q.x,q.y,1);if(d){free.pts.push(d);free.px.push(q)}return}
 if(!drag)return;const c=drag.c,q=mp(c,e);let o=drag.o;if(!drag.moved){if(Math.hypot(q.x-drag.x,q.y-drag.y)<3)return;drag.moved=1;pushH();if(drag.cl&&drag.i<0){const n=JSON.parse(JSON.stringify(o));n.id=uid();lst(c.cfg.sym).push(n);drag.o=o=n;sel=n;msel.clear()}}
 if(drag.i>=0){const d=pt2d(c,q.x,q.y);if(d)o.p[drag.i]=d}
 else{let dx=q.x-drag.x,dy=q.y-drag.y;if(e.shiftKey){if(Math.abs(dx)>Math.abs(dy))dy=0;else dx=0}
  (drag.grp||[{o,orig:drag.orig}]).forEach(g2=>{if(g2.o.lk)return;g2.o.p=g2.orig.map(z=>{const x=t2x(c,z.t),y=c.s.priceToCoordinate(z.p);if(x==null||y==null)return z;return pt2d(c,x+dx,y+dy,1)||z})})}
 showFloat(c,1)});
D.addEventListener('mouseup',()=>{if(free){const f=free;free=null;if(f.pts.length>1){const o=Object.assign({id:uid(),k:tool,p:f.pts.filter((_,i)=>i%2===0||i===f.pts.length-1).map(q=>({t:q.t,p:q.p}))},style(tool));commit(f.c,o)}return}
 if(drag){if(drag.cl&&!drag.moved&&drag.i<0){msel.has(drag.o)?msel.delete(drag.o):msel.add(drag.o)}if(drag.moved)save();drag=null}});

/* ---------- tool state ---------- */
function dropTmp(){charts.forEach(c=>{const L=lst(c.cfg.sym);for(let i=L.length-1;i>=0;i--)if(L[i].tmp&&L[i]!==sel)L.splice(i,1)})}
const GB={};
function setTool(k,quiet){if(k==='image'&&!quiet){return pickImage(()=>setTool('image',1))}
 if(k!=='cur'&&!TD[k])return;tool=k;pts=[];pc=null;ds=null;free=null;if(k!=='cur'){sel=null;hideFloat()}
 const T=TD[k];if(T&&T.g&&T.g!=='ruler'&&T.g!=='zoom'&&T.g!=='emoji')O.last[T.g]=k;if(k==='emoji'||k==='icon')O.last.emoji=k;
 dropTmp();
 refreshBar();save()}
function pickImage(cb){const f=D.createElement('input');f.type='file';f.accept='image/*';f.onchange=()=>{const file=f.files[0];if(!file)return;const rd=new FileReader();rd.onload=()=>{const im=new Image();im.onload=()=>{const m=Math.min(1,480/Math.max(im.width,im.height)),cv=D.createElement('canvas');cv.width=Math.round(im.width*m);cv.height=Math.round(im.height*m);cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);pendImg=cv.toDataURL(file.type==='image/png'?'image/png':'image/jpeg',.85);cb()};im.src=rd.result};rd.readAsDataURL(file)};f.click()}

/* ---------- left toolbar ---------- */
const ltb=$('#ltb');
const cur0=g=>O.last[g.id]||g.secs[0][1][0][0];
const BAR=[{id:'cur',cursor:1,tip:'Cursors'}].concat(MENU,[{id:'emoji',tip:'Emojis and icons'},'sep',{id:'ruler',single:'ruler',tip:'Measure'},{id:'zoom',tip:'Zoom in',fly:1},'sep',{id:'magnet',tip:'Magnet mode',fly:1},{id:'stay',tip:'Stay in drawing mode',single:1},{id:'lock',tip:'Lock all drawings',single:1},{id:'hide',tip:'Hide',fly:1},'sep',{id:'trash',tip:'Remove objects',fly:1}]);
function buildBar(){if(!ltb)return;ltb.onclick=null;ltb.innerHTML='';
 BAR.forEach(g=>{if(g==='sep'){const s=D.createElement('div');s.className='sep';ltb.appendChild(s);return}
  const b=D.createElement('button');b.className='dpb';b.dataset.g=g.id;b.title=g.tip;const hasFly=!g.single;b.innerHTML='<span></span>'+(hasFly?'<i class="car" data-car="1">▸</i>':'');ltb.appendChild(b);GB[g.id]=b});
 const sp=D.createElement('div');sp.style.flex='1';ltb.appendChild(sp);const st=D.createElement('button');st.className='dpb';st.dataset.g='star';st.title='Show favorite drawing tools';st.innerHTML=`<span></span>`;ltb.appendChild(st);GB.star=st;
 ltb.addEventListener('click',e=>{const b=e.target.closest('button.dpb');if(!b)return;e.stopPropagation();const id=b.dataset.g,g=BAR.find(x=>x&&x.id===id);
  if(e.target.closest('[data-car]')||id==='cur'&&false){openFly(b,id);return}
  if(id==='star'){O.favBar=+!O.favBar;refreshBar();save();return}
  if(id==='cur'){setTool('cur');return}
  if(id==='ruler'){setTool(tool==='ruler'?'cur':'ruler');return}
  if(id==='zoom'){setTool(tool==='zoom'?'cur':'zoom');return}
  if(id==='magnet'){S.set.mag=S.set.mag?0:1;const m=$('#magnet');if(m)m.value=S.set.mag;save();refreshBar();return}
  if(id==='stay'){O.stay=+!O.stay;refreshBar();save();return}
  if(id==='lock'){O.lock=+!O.lock;if(O.lock){sel=null;hideFloat()}refreshBar();save();return}
  if(id==='hide'){const all=O.hid.dr||O.hid.ind||O.hid.pos;O.hid.dr=O.hid.ind=O.hid.pos=+!all;refreshBar();save();return}
  if(id==='trash'){openFly(b,id);return}
  if(id==='emoji'){openFly(b,id);return}
  const gg=MENU.find(x=>x.id===id);if(gg){const t=cur0(gg);setTool(tool===t?'cur':t)}});
 ltb.addEventListener('contextmenu',e=>{const b=e.target.closest('button.dpb');if(!b)return;e.preventDefault();openFly(b,b.dataset.g)});
 refreshBar()}
function refreshBar(){if(!ltb)return;const T=TD[tool]||{};
 BAR.forEach(g=>{if(!g||g==='sep')return;const b=GB[g.id];if(!b)return;let ic=g.id,on=false;
  if(g.cursor){ic=curStyle;on=tool==='cur'}else if(MENU.find(x=>x.id===g.id)){const gg=MENU.find(x=>x.id===g.id);ic=cur0(gg);on=T.g===g.id}
  else if(g.id==='emoji'){ic=O.last.emoji||'emoji';ic=ic==='icon'?'icon':'emoji';on=T.g==='emoji'}
  else if(g.id==='ruler'){on=tool==='ruler'}else if(g.id==='zoom'){on=tool==='zoom'}else if(g.id==='magnet'){on=!!S.set.mag}
  else if(g.id==='stay'){on=!!O.stay}else if(g.id==='lock'){ic=O.lock?'lock':'unlock';on=!!O.lock}else if(g.id==='hide'){const h=O.hid.dr||O.hid.ind||O.hid.pos;ic=h?'eyeoff':'eye';on=!!h}
  b.classList.toggle('act',on);b.firstChild.innerHTML=svg(ic);if(MENU.find(x=>x.id===g.id))b.title=g.tip+' — '+(TD[cur0(MENU.find(x=>x.id===g.id))]||{}).n});
 if(GB.star){GB.star.innerHTML=`<span>${svg('star')}</span>`;GB.star.classList.toggle('act',!!O.favBar)}
 buildFav()}
function buildFav(){let f=$('#dpfav');if(!O.favBar||!O.fav.length){if(f)f.style.display='none';return}if(!f){f=D.createElement('div');f.id='dpfav';D.body.appendChild(f);f.onclick=e=>{const b=e.target.closest('button');if(b){const id=b.dataset.t;setTool(tool===id?'cur':id)}}}
 f.style.display='flex';f.innerHTML=O.fav.filter(id=>TD[id]).map(id=>`<button data-t="${id}" title="${TD[id].n}" class="${tool===id?'act':''}">${svg(id,20)}</button>`).join('')}

/* ---------- fly-out ---------- */
let fly=null;
const EMO=['😀','😂','😍','😎','🤔','😡','😱','🥳','👍','👎','👏','🙏','💪','🔥','💰','💎','🚀','🌙','⭐','⚡','🎯','🏆','📈','📉','🐂','🐻','🐳','🦈','⚠️','✅','❌','❤️'];
const ICN=['✔','✖','★','☆','⚑','➜','⬆','⬇','●','■','▲','▼','◆','♥','☀','☂','$','€','₿','⚠','⌛','☎','✉','✂'];
function closeFly(){if(fly){fly.remove();fly=null}}
function itemH(id){const T=TD[id];return`<div class="dpi${tool===id?' on':''}" data-t="${id}"><span class="ic">${svg(id)}</span><span class="nm">${T.n}</span>${T.hk?`<span class="hk">${T.hk}</span>`:''}<b class="fs${O.fav.includes(id)?' on':''}" data-star="${id}">★</b></div>`}
const act2=(a,ic,nm,on)=>`<div class="dpi${on?' on':''}" data-a="${a}"><span class="ic">${svg(ic)}</span><span class="nm">${nm}</span>${on===2?'':''}</div>`;
function openFly(btn,id){closeFly();let h='';const gg=MENU.find(x=>x.id===id);
 if(gg)h=gg.secs.map(([t,it],i)=>(i?'<hr>':'')+(t?`<div class="sh">${t}</div>`:'')+it.map(x=>itemH(x[0])).join('')).join('');
 else if(id==='cur')h=[['cross','Cross'],['dot','Dot'],['arrow','Arrow']].map(([k,n])=>`<div class="dpi${curStyle===k?' on':''}" data-a="cur:${k}"><span class="ic">${svg(k)}</span><span class="nm">${n}</span></div>`).join('');
 else if(id==='emoji')h=`<div class="sh">Emojis</div><div class="eg">${EMO.map(e=>`<span data-em="${e}" data-k="emoji">${e}</span>`).join('')}</div><hr><div class="sh">Icons</div><div class="eg">${ICN.map(e=>`<span data-em="${e}" data-k="icon">${e}</span>`).join('')}</div>`;
 else if(id==='zoom')h=act2('zoomin','zoom','Zoom in')+act2('zoomout','zoom','Zoom out (reset)');
 else if(id==='magnet')h=`<div class="dpi${S.set.mag===1?' on':''}" data-a="mag:1"><span class="ic">${svg('magnet')}</span><span class="nm">Weak magnet</span></div><div class="dpi${S.set.mag===2?' on':''}" data-a="mag:2"><span class="ic">${svg('magnet')}</span><span class="nm">Strong magnet</span></div><hr><div class="dpi" data-a="snapi"><span class="nm">Snap to indicators</span><span class="tg${O.snapInd?' on':''}"></span></div>`;
 else if(id==='hide')h=[['dr','Hide drawings'],['ind','Hide indicators'],['pos','Hide positions and orders']].map(([k,n])=>`<div class="dpi${O.hid[k]?' on':''}" data-a="hide:${k}"><span class="nm">${n}</span>${O.hid[k]?'<span class="hk">✓</span>':''}</div>`).join('')+`<div class="dpi" data-a="hide:all"><span class="nm">Hide all</span></div>`;
 else if(id==='trash')h=`<div class="dpi" data-a="rm:sym"><span class="ic">${svg('trash')}</span><span class="nm">Remove drawings (this symbol)</span></div><div class="dpi" data-a="rm:sel"><span class="nm">Remove selected drawing</span><span class="hk">Del</span></div><div class="dpi" data-a="rm:all"><span class="nm">Remove all drawings (all symbols)</span></div>`;
 else return;
 fly=D.createElement('div');fly.id='dpfly';fly.innerHTML=h;D.body.appendChild(fly);const br=btn.getBoundingClientRect(),lr=ltb.getBoundingClientRect();
 fly.style.left=(lr.right+2)+'px';fly.style.maxHeight=(innerHeight-16)+'px';let top=br.top;if(top+fly.offsetHeight>innerHeight-8)top=Math.max(8,innerHeight-8-fly.offsetHeight);fly.style.top=top+'px';
 fly.onclick=e=>{const st=e.target.closest('[data-star]');if(st){const k=st.dataset.star,i=O.fav.indexOf(k);if(i>=0)O.fav.splice(i,1);else O.fav.push(k);st.classList.toggle('on');save();buildFav();return}
  const em=e.target.closest('[data-em]');if(em){pendEm=em.dataset.em;O.last.emoji=em.dataset.k;closeFly();setTool(em.dataset.k);return}
  const it=e.target.closest('[data-t]');if(it){closeFly();setTool(it.dataset.t);return}
  const a=e.target.closest('[data-a]');if(!a)return;const[x,y]=a.dataset.a.split(':');
  if(x==='cur'){curStyle=y;closeFly();setTool('cur');return}
  if(x==='zoomin'){closeFly();setTool('zoom');return}if(x==='zoomout'){closeFly();zoomReset(actChart());return}
  if(x==='mag'){S.set.mag=+y;const m=$('#magnet');if(m)m.value=y;save();refreshBar();closeFly();return}
  if(x==='snapi'){O.snapInd=+!O.snapInd;a.querySelector('.tg').classList.toggle('on',!!O.snapInd);save();return}
  if(x==='hide'){if(y==='all'){const all=O.hid.dr&&O.hid.ind&&O.hid.pos;O.hid.dr=O.hid.ind=O.hid.pos=+!all}else O.hid[y]=+!O.hid[y];save();refreshBar();closeFly();return}
  if(x==='rm'){closeFly();if(y==='sel')delSel();else if(y==='sym'){const c=actChart();if(c&&lst(c.cfg.sym).length&&confirm('Remove all drawings on '+c.cfg.sym+'?')){pushH();S.dp[c.cfg.sym]=[];sel=null;hideFloat();save()}}
   else if(confirm('Remove ALL drawings on ALL symbols?')){pushH();S.dp={};sel=null;hideFloat();save()}}}}
D.addEventListener('mousedown',e=>{if(fly&&!fly.contains(e.target)&&!e.target.closest('#ltb'))closeFly();const cx=$('#dpctx');if(cx&&!cx.contains(e.target))cx.style.display='none'},true);
D.addEventListener('mousedown',e=>{if(fly&&e.target.closest('#ltb')&&!e.target.closest('[data-car]')&&!e.target.closest('button.dpb[data-g="emoji"]')&&!e.target.closest('button.dpb[data-g="trash"]'))closeFly()},true);

/* ---------- floating bar ---------- */
let ft=null;
function hideFloat(){if(ft)ft.style.display='none'}
function showFloat(c,keep){if(!sel)return hideFloat();if(!ft){ft=D.createElement('div');ft.id='dpft';D.body.appendChild(ft);
  ft.oninput=ft.onchange=e=>{const t=e.target,k=t.dataset.q;if(!k||!sel)return;sel[k]=(k==='w'||k==='ls')?+t.value:t.value;touchDef(sel);save()};
  ft.onclick=e=>{const b=e.target.closest('button');if(!b||!sel)return;const a=b.dataset.a,c2=actChart();if(a==='set')openSet(sel,c2);else if(a==='text')openSet(sel,c2,'Text');else if(a==='lock'){sel.lk=sel.lk?0:1;showFloat(c2)}else if(a==='clone')clone(sel,c2);else if(a==='del')delSel()}}
 const o=sel;if(!keep||!ft.dataset.id||ft.dataset.id!==o.id){ft.dataset.id=o.id;ft.innerHTML=`<input type="color" data-q="col" title="Line / main color" value="${/^#[0-9a-f]{6}$/i.test(o.col)?o.col:'#e6b422'}">`
   +((!NOFILL.has(o.k)||['text'].includes(o.k))?`<input type="color" data-q="fill" title="Fill color" value="${/^#[0-9a-f]{6}$/i.test(o.fill||o.col)?(o.fill||o.col):'#e6b422'}">`:'')
   +`<select data-q="w" title="Thickness">${[1,2,3,4,6,8,12,16,24].map(n=>`<option${o.w===n?' selected':''}>${n}</option>`).join('')}</select><select data-q="ls" title="Style"><option value="0"${o.ls==0?' selected':''}>Solid</option><option value="1"${o.ls==1?' selected':''}>Dashed</option><option value="2"${o.ls==2?' selected':''}>Dotted</option></select><span class="sp"></span>`
   +`<button data-a="text" title="Text">T</button><button data-a="clone" title="Clone (Ctrl+D)">⧉</button><button data-a="lock" title="${o.lk?'Unlock':'Lock'}">${o.lk?'🔒':'🔓'}</button><button data-a="del" title="Delete">🗑</button><button data-a="set" title="Settings">⚙</button>`}
 const cv=(c||actChart()).host.querySelector('.cv'),r=cv.getBoundingClientRect();ft.style.display='flex';ft.style.left=(r.left+r.width/2)+'px';ft.style.top=(r.top+8)+'px'}

/* ---------- context menu ---------- */
function ctxMenu(x,y,o,c){let m=$('#dpctx');if(!m){m=D.createElement('div');m.id='dpctx';D.body.appendChild(m)}
 m.innerHTML=`<div data-a="set">Settings…</div><div data-a="clone">Clone</div><div data-a="lock">${o.lk?'Unlock':'Lock'}</div><div data-a="front">Bring to front</div><div data-a="back">Send to back</div><div data-a="del">Delete</div>`;
 m.style.left=Math.min(x,innerWidth-190)+'px';m.style.top=Math.min(y,innerHeight-190)+'px';m.style.display='block';
 m.onclick=e=>{const a=e.target.dataset.a;if(!a)return;m.style.display='none';const L=lst(c.cfg.sym);
  if(a==='set')openSet(o,c);else if(a==='clone')clone(o,c);else if(a==='lock'){o.lk=o.lk?0:1;save();showFloat(c)}else if(a==='del')delSel();
  else if(a==='front'){L.splice(L.indexOf(o),1);L.push(o);save()}else if(a==='back'){L.splice(L.indexOf(o),1);L.unshift(o);save()}}}

/* ---------- text prompt ---------- */
function askText(title,val,cb){let m=$('#dpask');if(!m){m=D.createElement('div');m.id='dpask';D.body.appendChild(m)}
 m.innerHTML=`<b>${title}</b><textarea>${val||''}</textarea><div style="display:flex;gap:8px;justify-content:flex-end"><button data-n="1">Cancel</button><button class="pr" data-y="1">OK</button></div>`;m.classList.add('on');const ta=m.querySelector('textarea');setTimeout(()=>{ta.focus();ta.select()},30);
 const done=v=>{m.classList.remove('on');cb(v)};m.onclick=e=>{if(e.target.dataset.y)done(ta.value);else if(e.target.dataset.n)done(null)};
 ta.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();done(ta.value)}else if(e.key==='Escape')done(null);e.stopPropagation()}}

/* ---------- settings dialog ---------- */
const EXT=new Set(['tl','pch','reg','fib','fext','fch','flat','pf','spf','mpf','ipf','ffan','frvp']),SHPR=new Set(['tl','ext','ray','fib','fext','info']),FILLX=new Set(['text','note','pnote','callout','comment','idea','table']);
const toLoc=t=>{const d=new Date(t*1000),z=n=>String(n).padStart(2,'0');return`${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`};
let setO=null,setC=null,setTab='Style';
function spec(o){const k=o.k,F=[],add=(ty,key,lb,op)=>F.push({ty,key,lb,op:op||{}}),T=[];
 if(!['emoji','icon','image','post','table'].includes(k)){add('col','col',k==='brush'||k==='hilite'?'Color':'Line color');add('num','w','Thickness',{min:1,max:40,step:1});if(!['aup','adn','amark'].includes(k))add('sel','ls','Line style',{o:[['Solid',0],['Dashed',1],['Dotted',2]]})}
 if(!NOFILL.has(k)||FILLX.has(k)){add('col','fill',k==='text'?'Background color':'Fill color');add('num','fo','Fill opacity',{min:0,max:1,step:.05})}
 if(k==='text')add('chk','bg','Show background');
 if(EXT.has(k)){add('chk','exl','Extend left');add('chk','exr','Extend right')}
 if(SHPR.has(k))add('chk','shp','Show price labels');if(k==='pch')add('chk','mid','Middle line');
 if(k==='fib'){add('chk','trend','Trend line');add('chk','rev','Reverse')}
 if(o.lv){add('chk','shl','Show level labels');if(!SHPR.has(k))add('chk','shp','Show prices')}
 if(k==='reg'){add('num','dev','Deviation (σ)',{min:.5,max:6,step:.1});add('sel','src','Source',{o:[['Close','close'],['High','high'],['Low','low'],['Open','open']]})}
 if(k==='long'||k==='short'){add('num','rr','Risk/Reward',{min:.1,max:50,step:.1});add('num','acc','Account size',{min:1,max:1e9,step:1});add('num','risk','Risk %',{min:.01,max:100,step:.1});add('col','tp','Target color');add('col','sl','Stop color');add('chk','shq','Show qty/risk label')}
 if(k==='frvp'||k==='avp'){add('num','rows','Row count',{min:4,max:200,step:1});add('num','va','Value area %',{min:10,max:100,step:1});if(k==='frvp')add('num','wp','Width % of range',{min:10,max:200,step:5});add('col','upc','Up volume color');add('col','dnc','Down volume color');add('col','pocc','POC color');add('chk','exr','Extend POC right');add('chk','shl','Show VAH/VAL')}
 if(k==='avwap'){add('chk','bands','Show bands');add('num','bm','Band multiplier',{min:.1,max:5,step:.1})}
 if(k==='table'){add('num','rows','Rows',{min:1,max:20,step:1});add('num','cols','Columns',{min:1,max:10,step:1});add('num','cw','Cell width',{min:30,max:300,step:5});add('txt','cells','Cells (separate with |, row by row)')}
 if(k==='post'){add('str','name','Name');add('str','handle','Handle');add('num','iw','Card width',{min:150,max:500,step:10})}
 if(k==='image'){add('num','iw','Width (px)',{min:30,max:900,step:10});add('chk','bd','Border')}
 if(k==='emoji'||k==='icon'){add('str','em','Symbol');add('num','es','Size',{min:10,max:200,step:2});add('col','col','Color')}
 if(k==='path')add('chk','arrow','Arrow at end');if(k==='ghost')add('num','seed','Random seed',{min:1,max:1e9,step:1});
 const tx=[];tx.push({ty:'txt',key:'txt',lb:['text','note','pnote','callout','comment','sign','pin','post','idea','aup','adn','flag'].includes(k)?'Text':'Label text',op:{}});tx.push({ty:'col',key:'tc',lb:'Text color',op:{}},{ty:'num',key:'fs',lb:'Font size',op:{min:8,max:80,step:1}},{ty:'chk',key:'b',lb:'Bold',op:{}},{ty:'chk',key:'i',lb:'Italic',op:{}});
 return{Style:F,Text:tx}}
const defC=(o,key)=>({shl:1,trend:1,shq:1,bands:1,mid:1,arrow:1,bd:1,shp:['tl','ext','ray','info'].includes(o.k)?0:1}[key]||0);
const fld=(o,f)=>{const v=o[f.key],id=`data-k="${f.key}" data-ty="${f.ty}"`;let inp='';
 if(f.ty==='col')inp=`<input type="color" ${id} value="${/^#[0-9a-f]{6}$/i.test(v||'')?v:(f.key==='fill'&&/^#[0-9a-f]{6}$/i.test(o.col)?o.col:'#808080')}">`;
 else if(f.ty==='num')inp=`<input type="number" ${id} min="${f.op.min}" max="${f.op.max}" step="${f.op.step}" value="${v==null?'':v}">`;
 else if(f.ty==='chk')inp=`<input type="checkbox" ${id} ${(v==null?defC(o,f.key):!!+v)?'checked':''}>`;
 else if(f.ty==='sel')inp=`<select ${id}>${f.op.o.map(([n,x])=>`<option value="${x}"${(v==null?f.op.o[0][1]:v)==x?' selected':''}>${n}</option>`).join('')}</select>`;
 else if(f.ty==='str')inp=`<input type="text" ${id} value="${String(v==null?'':v).replace(/"/g,'&quot;')}">`;
 else if(f.ty==='txt')return`<div style="margin:6px 0"><div style="color:#b2b5be;margin-bottom:4px">${f.lb}</div><textarea ${id}>${String(v==null?'':v).replace(/</g,'&lt;')}</textarea></div>`;
 return`<label class="r"><span>${f.lb}</span>${inp}</label>`};
function setBody(){const o=setO,sp=spec(o),tabs=['Style','Text'];if(o.lv)tabs.splice(1,0,'Levels');if(o.p.length<=12)tabs.push('Coordinates');tabs.push('Visibility');if(!tabs.includes(setTab))setTab='Style';
 const P=$('#dpset');P.querySelector('.hd span').textContent=(TD[o.k]||{}).n||o.k;P.querySelector('.tb').innerHTML=tabs.map(t=>`<div class="${t===setTab?'on':''}" data-tab="${t}">${t}</div>`).join('');let h='';
 if(setTab==='Style'||setTab==='Text')h=sp[setTab].map(f=>fld(o,f)).join('');
 else if(setTab==='Levels')h=(o.lv||[]).map((l,i)=>`<div class="lv"><input type="checkbox" data-li="${i}" data-lf="on" ${l.on?'checked':''}><input type="number" step="any" data-li="${i}" data-lf="v" value="${l.v}"><input type="color" data-li="${i}" data-lf="c" value="${/^#[0-9a-f]{6}$/i.test(l.c)?l.c:'#808080'}"></div>`).join('')+`<div style="color:#787b86;margin-top:6px;font-size:11px">Tick to show a level, edit the value, pick its color.</div>`;
 else if(setTab==='Coordinates')h=o.p.map((q,i)=>`<div style="margin:8px 0"><div style="color:#b2b5be;margin-bottom:4px">Point ${i+1}</div><div style="display:flex;gap:6px"><input type="datetime-local" step="1" data-ci="${i}" data-cf="t" value="${toLoc(q.t)}" style="flex:1"><input type="number" step="any" data-ci="${i}" data-cf="p" value="${q.p}" style="width:110px"></div></div>`).join('');
 else if(setTab==='Visibility')h=['Minutes','Hours','Days','Weeks / Months'].map((n,i)=>`<label class="r"><span>${n}</span><input type="checkbox" data-vi="${i}" ${(o.vis&&o.vis[i]===0)?'':'checked'}></label>`).join('')+`<div style="color:#787b86;margin-top:6px;font-size:11px">Choose the timeframe groups where this drawing is shown.</div>`;
 P.querySelector('.bd').innerHTML=h;const l=P.querySelector('.lock');if(l)l.textContent=o.lk?'Unlock':'Lock'}
function openSet(o,c,tab){setO=o;setC=c||actChart();setTab=tab||'Style';let P=$('#dpset');if(!P){P=D.createElement('div');P.id='dpset';P.innerHTML='<div class="hd"><span></span><b data-x="1">×</b></div><div class="tb"></div><div class="bd"></div><div class="ft"><div style="display:flex;gap:8px"><button data-a="del">Delete</button><button data-a="clone">Clone</button><button class="lock" data-a="lock">Lock</button></div><button class="pr" data-a="ok">OK</button></div>';D.body.appendChild(P);
  P.onclick=e=>{const t=e.target;if(t.dataset.x||t.dataset.a==='ok'){closeSet();return}if(t.dataset.tab){setTab=t.dataset.tab;setBody();return}
   if(t.dataset.a==='del'){delSel();return}if(t.dataset.a==='clone'){clone(setO,setC);return}if(t.dataset.a==='lock'){setO.lk=setO.lk?0:1;setBody();save()}};
  const ap=e=>{const t=e.target,o2=setO;if(!o2)return;
   if(t.dataset.k){const f=t.dataset.k,ty=t.dataset.ty;o2[f]=ty==='chk'?+t.checked:ty==='num'?(Number.isFinite(parseFloat(t.value))?parseFloat(t.value):o2[f]):ty==='sel'?(isNaN(+t.value)?t.value:+t.value):t.value;
    if(['w','ls','col','fill','fo','tc','fs','b','i'].includes(f))touchDef(o2);if(f==='rows'||f==='cols'){}}
   else if(t.dataset.li!=null){const l=o2.lv[+t.dataset.li],f=t.dataset.lf;l[f]=f==='on'?+t.checked:f==='v'?(Number.isFinite(parseFloat(t.value))?parseFloat(t.value):l.v):t.value}
   else if(t.dataset.ci!=null){const q=o2.p[+t.dataset.ci];if(t.dataset.cf==='t'){const s=new Date(t.value).getTime()/1000;if(Number.isFinite(s))q.t=Math.round(s)}else{const v=parseFloat(t.value);if(Number.isFinite(v))q.p=v}}
   else if(t.dataset.vi!=null){o2.vis=o2.vis||[1,1,1,1];o2.vis[+t.dataset.vi]=+t.checked}
   save();if(ft&&ft.dataset.id===o2.id)ft.dataset.id=''};
  P.oninput=ap;P.onchange=ap;P.addEventListener('keydown',e=>e.stopPropagation());
  const hd=P.querySelector('.hd');hd.onmousedown=e=>{if(e.target.dataset.x)return;const r=P.getBoundingClientRect(),dx=e.clientX-r.left,dy=e.clientY-r.top,mv=ev=>{P.style.left=(ev.clientX-dx)+'px';P.style.top=(ev.clientY-dy)+'px';P.style.right='auto'},up=()=>{D.removeEventListener('mousemove',mv);D.removeEventListener('mouseup',up)};D.addEventListener('mousemove',mv);D.addEventListener('mouseup',up)}}
 P.classList.add('on');setBody()}
function closeSet(){const P=$('#dpset');if(P)P.classList.remove('on');setO=null}

/* ---------- keyboard ---------- */
/* ---------- extra hotkeys ---------- */
const flags=e=>{SH=e.shiftKey?1:0;CT=(e.ctrlKey||e.metaKey)?1:0;AL=e.altKey?1:0};
D.addEventListener('mousemove',flags,true);D.addEventListener('keyup',flags,true);addEventListener('blur',()=>{SH=CT=AL=0});
D.addEventListener('keydown',e=>{flags(e);const tg=(e.target.tagName||'').toUpperCase();if(tg==='INPUT'||tg==='TEXTAREA'||tg==='SELECT'||e.target.isContentEditable)return;
 const k=(e.key||'').toLowerCase(),ctl=e.ctrlKey||e.metaKey,grp=()=>{const g=new Set(msel);if(sel)g.add(sel);return[...g]};
 if(ctl&&e.altKey&&e.code==='KeyH'){e.preventDefault();e.stopImmediatePropagation();const all=O.hid.dr&&O.hid.ind&&O.hid.pos;O.hid.dr=O.hid.ind=O.hid.pos=+!all;save();refreshBar();return}
 if(ctl&&!e.altKey&&k==='c'&&grp().length){clip=grp().map(o=>JSON.parse(JSON.stringify(o)));e.preventDefault();e.stopImmediatePropagation();return}
 if(ctl&&!e.altKey&&k==='v'&&clip&&clip.length){e.preventDefault();e.stopImmediatePropagation();const c=actChart();pushH();let dt=stp(c)*3,dp=0;
  if(lm&&lm.c===c){const d=pt2d(c,lm.x,lm.y,1);if(d){dt=d.t-clip[0].p[0].t;dp=d.p-clip[0].p[0].p}}
  msel.clear();clip.forEach(o=>{const n=JSON.parse(JSON.stringify(o));n.id=uid();n.p.forEach(q=>{q.t+=dt;q.p+=dp});lst(c.cfg.sym).push(n);msel.add(n);sel=n});if(msel.size<2)msel.clear();save();showFloat(c);return}
 if((e.key==='Delete'||e.key==='Backspace')&&msel.size){e.preventDefault();e.stopImmediatePropagation();pushH();grp().forEach(o=>{for(const sym in S.dp){const i=S.dp[sym].indexOf(o);if(i>=0)S.dp[sym].splice(i,1)}});msel.clear();sel=null;hideFloat();closeSet();save();return}
 if(e.key.startsWith('Arrow')&&!ctl&&!e.altKey&&grp().length){e.preventDefault();e.stopImmediatePropagation();const c=actChart(),sp=c.c.timeScale().options().barSpacing||6,dx=e.key==='ArrowLeft'?-sp:e.key==='ArrowRight'?sp:0,dy=e.key==='ArrowUp'?-4:e.key==='ArrowDown'?4:0;pushH();
  grp().forEach(o=>{if(o.lk)return;o.p=o.p.map(z=>{const x=t2x(c,z.t),y=c.s.priceToCoordinate(z.p);if(x==null||y==null)return z;return pt2d(c,x+dx,y+dy,1)||z})});save();showFloat(c,1)}},true);
D.addEventListener('keydown',e=>{const tg=(e.target.tagName||'').toUpperCase();if(tg==='INPUT'||tg==='TEXTAREA'||tg==='SELECT'||e.target.isContentEditable)return;const kz=(e.key||'').toLowerCase();
 if((e.ctrlKey||e.metaKey)&&kz==='z'&&!e.shiftKey&&hist.length){e.preventDefault();e.stopImmediatePropagation();undo();return}
 if((e.ctrlKey||e.metaKey)&&(kz==='y'||(e.shiftKey&&kz==='z'))&&redoS.length){e.preventDefault();e.stopImmediatePropagation();redo()}},true);
D.addEventListener('keydown',e=>{const tg=(e.target.tagName||'').toUpperCase();if(tg==='INPUT'||tg==='TEXTAREA'||tg==='SELECT'||e.target.isContentEditable)return;
 const kk=(e.key||'').toLowerCase();
 if(e.key==='Escape'){if(tool!=='cur'||pts.length){setTool('cur')}else if(sel){sel=null;hideFloat()}closeFly();return}
 if((e.key==='Delete'||e.key==='Backspace')&&sel){e.preventDefault();delSel();return}
 if(e.key==='Enter'&&tool!=='cur'&&TD[tool]&&TD[tool].need<0&&pc&&pts.length>=(tool==='poly'?3:2)){finishObj(pc);return}
 if((e.ctrlKey||e.metaKey)&&kk==='d'&&sel){e.preventDefault();clone(sel,actChart());return}
 if(e.altKey&&e.code&&e.code.startsWith('Key')){const id=HK[(e.shiftKey?'ALT+SHIFT+':'ALT+')+e.code.slice(3)];if(id){e.preventDefault();setTool(id)}}});

window.addEventListener('resize',()=>{closeFly();if(sel)showFloat(actChart())});

/* ---------- perp-only: Binance USDT-M perpetuals ---------- */
if(PERP_ONLY)setTimeout(()=>{const b=$('#e_perp');if(b&&!b.classList.contains('on'))b.click()},900);

buildBar();
window.DrawingPro={tool:()=>tool,set:setTool,list:()=>S.dp,export:()=>JSON.stringify(S.dp),import:j=>{S.dp=JSON.parse(j);save()}};
})();
