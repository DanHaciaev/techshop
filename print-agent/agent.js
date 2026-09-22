// Shop print/POS agent — runs on the OPERATOR's own PC (not the web server),
// so a browser tab open on the storefront/admin can print silently and
// charge cards through whichever hardware is physically attached HERE. The
// site itself may be hosted anywhere (Vercel, etc.) and has no access to
// this machine's hardware at all — this is the piece that makes it possible.
const http = require('http')
const fs = require('fs')
const path = require('path')
const { loadConfig, ensureConfigFile, configDir, saveConfig } = require('./config')
const { printBon } = require('./printer')
const fiscal = require('./fiscal')
const pos = require('./pos')

ensureConfigFile()
const cfg = loadConfig()

// The Scheduled Task runs this hidden (no visible window), so console.log
// alone is invisible once the operator isn't the one who double-clicked the
// exe by hand. Logging to a file is the only thing that survives to explain
// a "silent printing/payment stopped working" report after the fact.
const logFile = path.join(configDir(), 'agent.log')
function log(line) {
  const msg = `[${new Date().toISOString()}] ${line}`
  console.log(msg)
  try { fs.appendFileSync(logFile, msg + '\n') } catch { /* best-effort */ }
}

process.on('uncaughtException', e => log(`FATAL (uncaught): ${e && e.stack || e}`))
process.on('unhandledRejection', e => log(`FATAL (unhandled rejection): ${e && e.stack || e}`))

function isAllowedOrigin(origin) {
  if (!origin) return false
  return cfg.allowedOrigins.includes(origin)
}

// Every response carries CORS headers for the CALLING page's own origin
// (never `*` — this agent executes real print/charge jobs) — checked again
// per-request against `allowedOrigins`, not just echoed back blindly.
//
// Access-Control-Allow-Private-Network handles Chrome's Private Network
// Access policy, which inserts an extra preflight whenever a page loaded
// from a PUBLIC address fetches a PRIVATE address (127.0.0.1) — even for a
// plain GET. That preflight only succeeds if the response echoes this
// header back.
function withCors(req, res) {
  const origin = req.headers.origin
  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Private-Network', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => {
      data += chunk
      if (data.length > 1_000_000) { reject(new Error('Body too large')); req.destroy() }
    })
    req.on('end', () => {
      if (!data) return resolve({})
      try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
    })
    req.on('error', reject)
  })
}

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

const server = http.createServer(async (req, res) => {
  withCors(req, res)

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  const url = new URL(req.url, `http://127.0.0.1:${cfg.port}`)

  // /health has no origin check — it's how the site silently detects "is the
  // agent installed on this PC at all" before trusting anything else here.
  // It leaks no capability (no printing, no charging), so a permissive
  // check is fine.
  if (req.method === 'GET' && url.pathname === '/health') {
    send(res, 200, { ok: true, agent: 'shop-print-agent', version: '1.0.0' })
    return
  }

  const origin = req.headers.origin
  if (!isAllowedOrigin(origin)) {
    send(res, 403, { ok: false, error: 'Origine nepermisă' })
    return
  }

  try {
    if (req.method === 'POST' && url.pathname === '/print/bon') {
      const { url: printUrl } = await readJsonBody(req)
      if (!printUrl || typeof printUrl !== 'string') return send(res, 400, { ok: false, error: 'url lipsește' })
      await printBon(printUrl, cfg)
      log(`OK bon (origin=${origin})`)
      return send(res, 200, { ok: true })
    }

    // Fiscal cash register — device model not integrated yet (see fiscal.js).
    // Same "not configured on this PC yet" shape whether that's because
    // fiscalComPort was never set, or because it was set but no real driver
    // exists for that device — the caller doesn't need to tell those apart.
    if (url.pathname === '/fiscal/receipt' || url.pathname === '/fiscal/x-report' || url.pathname === '/fiscal/z-report' || url.pathname === '/fiscal/refund') {
      if (!cfg.fiscalComPort) {
        return send(res, 503, { ok: false, offline: true, error: 'Aparatul fiscal nu este configurat pe acest calculator (fiscalComPort lipsește din config.json).' })
      }
    }

    if (req.method === 'POST' && url.pathname === '/fiscal/receipt') {
      const { items, payment } = await readJsonBody(req)
      if (!Array.isArray(items) || !items.length) return send(res, 400, { ok: false, error: 'Niciun articol de vândut' })
      if (!payment || typeof payment.amount !== 'number') return send(res, 400, { ok: false, error: 'Sumă de plată lipsă' })
      try {
        const open = await fiscal.openReceipt(cfg)
        const cleanItems = items.map(it => ({ name: String(it.name || 'Produs'), price: Number(it.price), quantity: Number(it.quantity) || 1 }))
        const paidMode = payment.method === 'card' ? 1 : 0
        await fiscal.sellPayClose(cfg, cleanItems, paidMode, Number(payment.amount))
        return send(res, 200, { ok: true })
      } catch (e) {
        log(`EROARE fiscal receipt: ${e && e.message || e}`)
        try { await fiscal.cancelReceipt(cfg) } catch { /* best-effort */ }
        return send(res, 500, { ok: false, error: String(e && e.message || e) })
      }
    }

    if (req.method === 'POST' && url.pathname === '/fiscal/refund') {
      const { amount } = await readJsonBody(req)
      if (!amount || typeof amount !== 'number' || amount <= 0) return send(res, 400, { ok: false, error: 'Sumă de retur lipsă' })
      try {
        await fiscal.cashOut(cfg, amount)
        return send(res, 200, { ok: true })
      } catch (e) {
        return send(res, 500, { ok: false, error: String(e && e.message || e) })
      }
    }

    if (req.method === 'POST' && (url.pathname === '/fiscal/x-report' || url.pathname === '/fiscal/z-report')) {
      const type = url.pathname === '/fiscal/z-report' ? 'Z' : 'X'
      try {
        await fiscal.report(cfg, type)
        return send(res, 200, { ok: true })
      } catch (e) {
        return send(res, 500, { ok: false, error: String(e && e.message || e) })
      }
    }

    // JSON config for an admin's own settings page to read/write THIS PC's
    // local list of terminals from client-side JS. POST replaces the WHOLE
    // list (client sends everything back) — simpler than a per-row
    // add/edit/delete API for what's normally 1-3 entries.
    if (url.pathname === '/pos/config') {
      if (req.method === 'GET') {
        return send(res, 200, { ok: true, terminals: cfg.posTerminals.map(t => ({ ...t, ...pos.allTerminalsStatus(cfg).find(s => s.id === t.id) })) })
      }
      if (req.method === 'POST') {
        const body = await readJsonBody(req)
        const terminals = Array.isArray(body.terminals) ? body.terminals : []
        Object.assign(cfg, saveConfig({
          posTerminals: terminals.map((t, i) => ({
            id: t.id || `${t.driver}-${Date.now().toString(36)}-${i}`,
            driver: t.driver || '',
            comPort: (t.comPort || '').trim(),
            terminalPort: (t.terminalPort || '').trim(),
          })),
        }))
        log(`OK /pos/config updated (origin=${origin}): ${cfg.posTerminals.map(t => `${t.driver}:${t.driver === 'MAIB' ? t.comPort : t.terminalPort}`).join(', ') || '(none)'}`)
        pos.syncListeners(cfg, log)
        return send(res, 200, { ok: true, terminals: cfg.posTerminals.map(t => ({ ...t, ...pos.allTerminalsStatus(cfg).find(s => s.id === t.id) })) })
      }
    }

    // Bank card terminal — same "not configured on this PC yet" shape as the
    // /fiscal/* guard above.
    if (url.pathname === '/pos/charge' || url.pathname === '/pos/status') {
      if (!cfg.posTerminals.length) {
        return send(res, 503, { ok: false, offline: true, error: 'Niciun terminal bancar configurat pe acest calculator.' })
      }
    }

    if (req.method === 'POST' && url.pathname === '/pos/charge') {
      const { amount, terminalId } = await readJsonBody(req)
      if (!amount || typeof amount !== 'number' || amount <= 0) return send(res, 400, { ok: false, error: 'Sumă de plată lipsă' })
      if (!terminalId || typeof terminalId !== 'string') return send(res, 400, { ok: false, error: 'Terminal neselectat' })

      let fields
      try {
        fields = await pos.charge(cfg, terminalId, amount, log)
      } catch (e) {
        log(`EROARE pos charge (origin=${origin}, terminal=${terminalId}): ${e && e.message || e}`)
        return send(res, 500, { ok: false, error: String(e && e.message || e) })
      }
      const approved = fields.RespCode === '000'
      if (!approved) {
        log(`REFUZAT pos charge (origin=${origin}, terminal=${terminalId}, sumă=${amount}, RespCode=${fields.RespCode}): ${fields.RespMSG || ''}`)
        return send(res, 200, { ok: false, declined: true, error: fields.RespMSG || `Tranzacție refuzată (${fields.RespCode})` })
      }
      log(`OK pos charge (origin=${origin}, terminal=${terminalId}, sumă=${amount}, TransactionID=${fields.TransactionID || ''})`)
      return send(res, 200, { ok: true, transactionId: fields.TransactionID || '', receiptText: fields.RCPT || '' })
    }

    if (req.method === 'GET' && url.pathname === '/pos/status') {
      return send(res, 200, { ok: true, terminals: pos.allTerminalsStatus(cfg) })
    }

    send(res, 404, { ok: false, error: 'Not found' })
  } catch (e) {
    log(`EROARE request failed (origin=${origin}): ${e && e.stack || e}`)
    send(res, 500, { ok: false, error: String(e && e.message || e) })
  }
})

// Without this, a second copy racing for the same port throws an unhandled
// 'error' event and silently kills the WHOLE process — which then makes
// every subsequent print/charge look exactly like "agent not installed"
// from the website's side, with nothing to explain why.
server.on('error', e => {
  if (e && e.code === 'EADDRINUSE') {
    log(`EROARE: portul ${cfg.port} este deja folosit — probabil o altă copie a agentului rulează deja.`)
  } else {
    log(`EROARE server: ${e && e.stack || e}`)
  }
})

server.listen(cfg.port, '127.0.0.1', () => {
  log(`Shop Print/POS Agent — ascult pe http://127.0.0.1:${cfg.port}`)
  log(`Bon: ${cfg.bonPrinterName}`)
  log(`Origini permise: ${cfg.allowedOrigins.join(', ')}`)
})

// Starts (or, on a later settings save, resyncs) the raw TCP listeners each
// configured Verifone terminal connects to — see pos.js. Runs
// unconditionally on boot; pos.syncListeners itself no-ops when no
// terminals are configured yet.
pos.syncListeners(cfg, log)
