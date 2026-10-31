# MultiChart Pro - Local MT5 charts

Run the chart locally and read live candles from your MetaTrader 5 desktop terminal.
The MT5 integration reads market data; it does not place trades.

## Requirements

- Windows
- 64-bit Python 3 and pip
- MetaTrader 5 desktop installed and logged in to your broker
- Internet access for the chart library and any non-MT5 exchange/news data

## Start

1. Open MetaTrader 5 and log in to the account you want to view.
2. Double-click `START.bat`. It installs the Python requirements, starts the local MT5 bridge and web server, and opens the chart.
3. The default chart is `MT5:EURUSD`. If your broker uses a suffix, enter its exact symbol, for example `MT5:EURUSD.a`.

The web app is at <http://127.0.0.1:8000/index.html>; the local MT5 bridge is at <http://127.0.0.1:5000>.
Keep both terminal windows opened while using the chart. A green MT5 indicator means the bridge has returned data. If MT5 is not ready when the chart opens, the chart retries the local connection automatically.

## Check the bridge

- Open <http://127.0.0.1:5000/ping> to check that the bridge can connect to MT5.
- Open <http://127.0.0.1:5000/symbols?q=EUR> to find the exact broker symbol names.
- If the bridge reports that it cannot connect, keep MT5 open, confirm you are logged in, then check the bridge window for the error.

## Manual start

From this folder, run `py -3 -m pip install -r requirements.txt`, then start the bridge with `py -3 mt5_bridge.py`. In a second terminal, run `py -3 -m http.server 8000 --bind 127.0.0.1` and open <http://127.0.0.1:8000/index.html>.

## EDGE Charts UI (edge-ui.js)

`edge-ui.js` must load last (it is already the last `<script>` in `index.html`). It adds the new top bar, left drawing toolbar,
overlay chart headers, volume bars, price-axis countdown, crosshair sync and the right-panel tabs
(Favorites / Crypto perps / Crypto spot / MT5 / Futures / News / Alerts).

- Symbol box: `XAUUSD` uses MT5 when the bridge is connected; `BTCUSDT.P` opens a Binance USDT-M perpetual; `FX:GC=F` opens a Yahoo futures contract.
- Timeframes: `M` and `3M` are approximated as 30-day buckets.
- `⋯` (top right) shows the original control row (time zone, bridge URL, custom TF, etc.).
- Cloudflare: redeploy `worker.js` (it now allows `fapi.binance.com`).

## Drawing Pro (drawing-pro.js)

`drawing-pro.js` must load after `edge-ui.js` (already the last `<script>` in `index.html`). It replaces the left toolbar with a
TradingView-style one: Cursors, Trend tools, Gann & Fibonacci, Patterns, Forecasting/Volume/Measurers, Brushes/Arrows/Shapes,
Annotations, Emoji/Icons, Measure, Zoom, Magnet, Stay-in-drawing-mode, Lock, Hide and Remove.
Click the button to use the last tool of that group; click the small `▸` on its right edge (or right-click) for the fly-out menu.
Star a tool to pin it to the favorites bar. Click a drawing for the floating bar, double-click (or right-click > Settings) for the full
settings dialog (style, text, levels, coordinates, timeframe visibility). Hotkeys: Alt+T/H/J/V/C/F, Alt+Shift+R, Del, Ctrl+Z/Y, Ctrl+D, Esc, Enter.

## Binance USDT perpetuals only
`config.js` has `perpOnly:true`: the right panel lists only Binance USDT-M **perpetual** contracts with status TRADING
(from `fapi/v1/exchangeInfo`), the spot / MT5 / futures tabs are hidden and `BTCUSDT` typed in the symbol box opens `BF:BTCUSDT`.
Set `perpOnly:false` to bring everything back. No API key is needed (public market-data endpoints).
