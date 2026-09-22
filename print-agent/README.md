# Shop Print/POS Agent

Local Windows background service that runs on a seller's own PC and gives
the admin panel's "Касса" (POS) page access to hardware physically attached
to that PC — a receipt printer and a bank card terminal — regardless of
where the Next.js site itself is hosted. The site's browser JS talks to it
directly over `http://127.0.0.1:<port>` (default `48090`); the server never
touches this machine's hardware at all.

## Why this exists

A cloud-hosted (or even locally-hosted) web server has no way to reach a
USB printer or a serial/wifi card terminal sitting on a *different* computer
than itself. The fix is this small agent: install it once on the till PC,
and the *browser tab* open there — not the server — calls it directly on
localhost.

## What it does

- `GET /health` — lets the site detect "is the agent installed on this PC".
- `POST /print/bon` — silently prints a receipt (given a URL to a printable
  page) on the configured thermal/receipt printer, via a headless Chrome
  screenshot piped through Windows' native print pipeline.
- `POST /pos/charge`, `GET /pos/status`, `GET/POST /pos/config` — bank card
  terminal integration. Two terminal families are supported out of the box:
  - **MAIB** (Arcus2/Ingenico) — via `maib-bridge/`, the bank's own official
    driver (`MAIB_driver_v21.py`), bridged through a 32-bit Python process
    (`arccom.dll` is 32-bit only; this agent itself runs as 64-bit Node).
  - **Victoriabank / Moldindconbank / Fincombank** (Verifone-family,
    wifi/IP) — raw TCP protocol in `pos.js`; this PC listens, the terminal
    connects to it (configured with this PC's IP + a chosen port on the
    terminal's own menu).
- `POST /fiscal/*` — placeholder for a fiscal cash register. **Not
  implemented** (`fiscal.js` is a stub) — the exact device model wasn't
  known when this was built. Wiring a real one in means replacing
  `fiscal.js` with that device's actual serial/byte protocol; every route
  already exists in `agent.js` and reports "not configured" (503) until then.

## Setup on a till PC

1. Install a 32-bit Python (python.org installer, not the Microsoft Store
   one) if using a MAIB terminal — `py -3-32` must work from a terminal.
2. Build the exe: `npm install && npm run build` (produces
   `dist/shop-print-agent.exe`).
3. Copy this whole folder (or just `dist/`, `maib-bridge/`, `install.ps1`,
   `install.bat`) to the till PC and run `install.bat`.
4. Edit the generated `config.json` (path is printed at the end of install)
   to set:
   - `bonPrinterName` — must match the printer's exact name in Windows
     (`Win+R` → `control printers`).
   - `allowedOrigins` — add the real storefront/admin domain once deployed
     (`localhost:3000` is allowed by default for local development).
   - `posTerminals` — one entry per physical terminal attached to this PC
     (see `config.js` for the exact shape).
5. Restart the agent (or just log out/in — the Scheduled Task starts it
   automatically) for `config.json` changes to take effect.

## Development

```
npm install
npm start          # runs agent.js directly, unpackaged
```

`npm run build` bundles with esbuild and packages with `pkg` into a single
`.exe` — no Node install required on the till PC.
