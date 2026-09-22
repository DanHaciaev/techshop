// Fiscal cash register — not implemented. Which physical device this
// deployment has (and its protocol) is unknown at the time this template was
// built; wiring a specific model in blind (byte-level serial protocols vary
// completely by manufacturer) would be worse than not pretending to support
// one at all.
//
// agent.js already gates every /fiscal/* route on `cfg.fiscalComPort` being
// set (see its own comment) — left empty by default in config.js, so these
// functions are never actually called out of the box. They exist so
// agent.js's require() doesn't fail, and so a real implementation can be
// dropped in later (Datecs, ISA, or whatever device a given store actually
// has) without changing agent.js's route wiring at all — same function
// names/shapes it already expects.
function notImplemented(name) {
  return async () => {
    throw new Error(`Fiscal: "${name}" nu este implementat pentru acest dispozitiv (modelul nu a fost încă integrat).`)
  }
}

module.exports = {
  openReceipt: notImplemented('openReceipt'),
  sellPayClose: notImplemented('sellPayClose'),
  getDeviceInfo: notImplemented('getDeviceInfo'),
  cancelReceipt: notImplemented('cancelReceipt'),
  report: notImplemented('report'),
  cashOut: notImplemented('cashOut'),
}
