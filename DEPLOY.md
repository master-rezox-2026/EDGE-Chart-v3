# Deploy EDGE Charts on Cloudflare Pages (+ Supabase login)

## 1. Supabase (once)
1. Dashboard -> SQL Editor -> paste `supabase.sql` -> Run.
2. Authentication -> Providers -> Email: enabled. (Turn "Confirm email" off if you want instant sign-up, on if you want verified emails.)
3. Authentication -> URL Configuration: set **Site URL** to your Cloudflare URL (e.g. `https://edge-charts.pages.dev`) and add it to Redirect URLs.
4. `config.js` already holds `supabaseUrl` + the **publishable** key (safe to ship in the browser). Never put a `service_role` / secret key in these files.

## 2. Cloudflare Pages
Option A - dashboard (no tools): Workers & Pages -> Create -> Pages -> **Upload assets** -> name `edge-charts` -> drag the whole folder
(index.html, config.js, edge-ui.js, drawing-pro.js, tv-extras*.js, tv-auth.js, tv-mobile.js, multichart-addons.js, pro-addons.js, orderflow-scalper.js, worker.js not needed) -> Deploy.
Option B - CLI: `npx wrangler pages deploy . --project-name edge-charts`
Re-deploy the same way after every change. Custom domain: Pages project -> Custom domains.

## 3. Things to know
* The MT5 bridge is a local program (127.0.0.1) - it does not exist on the hosted site. `perpOnly:true` in config.js already hides MT5.
* Binance REST / WebSocket are called straight from the user's browser. If a country/ISP blocks them, deploy `worker.js` as a Cloudflare Worker proxy and point the app to it.
* The login screen is a client-side gate + per-user cloud sync of layouts / drawings / settings. All market data is public, so that is fine. For real access control put **Cloudflare Access** (Zero Trust) in front of the Pages site.
* Add the scripts to index.html in this order (already done in the supplied index.html): ... tv-extras.js, tv-extras2.js, tv-extras3.js, tv-extras4.js, tv-auth.js, tv-mobile.js
