/* EDGE Charts service worker: caches the app files so it opens instantly and works as an installed app. Market data is never cached. */
const V='edge-v1',FILES=['./','index.html','config.js','edge-ui.js','drawing-pro.js','tv-extras.js','tv-extras2.js','tv-extras3.js','tv-extras4.js','tv-auth.js','tv-mobile.js','tv-icons.js','tv-watch.js','tv-settings.js','tv-account.js','tv-drawbar.js','tv-tf.js','tv-htf.js','tv-speed.js','tv-nav.js','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(FILES.map(f=>c.add(f).catch(()=>0)))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET'||u.origin!==location.origin)return;
 e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));return res}).catch(()=>caches.match(r)))});
