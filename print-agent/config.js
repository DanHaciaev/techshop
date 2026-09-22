const fs = require('fs')
const path = require('path')

// Reads config.json sitting next to the .exe (pkg exposes the real exe's own
// directory via process.execPath when packaged — `__dirname` inside a pkg
// snapshot points at the virtual filesystem, not a real path on disk, so a
// config file placed alongside the exe has to be located this way instead).
const DEFAULTS = {
  // Deliberately not 47990 — a dev machine testing this agent may also have
  // an unrelated print-agent (a different project) already listening there.
  port: 48090,
  // Origins allowed to call this agent — anything else gets a 403. Prevents
  // some unrelated website open in the same browser from silently printing
  // or charging a card through this agent (it listens on localhost,
  // reachable by ANY page the operator has open, not just this app).
  allowedOrigins: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  bonPrinterName: 'POS-80',
  bonPaperWidthUnits: 283,
  chromiumPath: '',
  // Fiscal cash register — not wired up yet (device model unknown at the
  // time this template was built). Empty comPort means "not configured";
  // /fiscal/* endpoints answer 503 until a real driver is written for
  // whatever device a given deployment actually has (see fiscal.js).
  fiscalComPort: '',
  fiscalBaudRate: 115200,
  // Bank card terminals physically attached to THIS PC — a plain array, not
  // a single driver/port pair, because one till can have more than one
  // terminal plugged in at once. Each entry: { id, driver, comPort, terminalPort }.
  // 'MAIB' talks through maib-bridge/ (see maib.js) via comPort's Arcus2
  // installation. 'VB'/'MICB'/'FCB' (Victoriabank/Moldindconbank/Fincombank,
  // Verifone-family) talk over terminalPort (wifi/ethernet — this PC listens
  // on that port, the terminal is pointed at this PC's IP+port from ITS OWN
  // menu). Two Verifone entries MUST use two DIFFERENT ports.
  posTerminals: [],
  // ISO 4217 numeric currency code the terminal protocol expects — '498' = MDL.
  posCurrency: '498',
  // Path to a 32-bit Python interpreter — arccom.dll (MAIB/Arcus2) is a
  // 32-bit-only DLL; this agent runs as a 64-bit Node process, so
  // maib-bridge/bridge.py runs as its own separate 32-bit process instead.
  // Empty = try the `py -3-32` launcher alias (works with the standard
  // python.org installer, not the Microsoft Store one).
  maibPython32Path: '',
}

function configDir() {
  // pkg-packaged exe: process.pkg is set, and the real exe lives at
  // process.execPath. Plain `node agent.js` (dev): next to this file.
  return process.pkg ? path.dirname(process.execPath) : __dirname
}

function loadConfig() {
  const file = path.join(configDir(), 'config.json')
  let overrides = {}
  try {
    if (fs.existsSync(file)) overrides = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (e) {
    console.error('[config] failed to read config.json, using defaults:', e.message)
  }
  return { ...DEFAULTS, ...overrides }
}

// Writes the defaults out as a real config.json the first time the agent
// runs anywhere — so there's always something on disk an operator/IT admin
// can find and hand-edit (e.g. a different printer name) without needing to
// know the defaults live in code.
function ensureConfigFile() {
  const file = path.join(configDir(), 'config.json')
  if (!fs.existsSync(file)) {
    try { fs.writeFileSync(file, JSON.stringify(DEFAULTS, null, 2) + '\n') } catch (e) {
      console.error('[config] could not write default config.json:', e.message)
    }
  }
}

// Merges `updates` into whatever's currently on disk (not just DEFAULTS —
// an admin's other settings, e.g. bonPrinterName, must survive a POS-only
// save) and writes the result back.
function saveConfig(updates) {
  const file = path.join(configDir(), 'config.json')
  let current = {}
  try {
    if (fs.existsSync(file)) current = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch { /* start from DEFAULTS below if the existing file is unreadable */ }
  const next = { ...DEFAULTS, ...current, ...updates }
  fs.writeFileSync(file, JSON.stringify(next, null, 2) + '\n')
  return next
}

module.exports = { loadConfig, ensureConfigFile, configDir, saveConfig }
