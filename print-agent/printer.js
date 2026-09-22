const { execFile } = require('child_process')
const { writeFile, unlink } = require('fs/promises')
const { existsSync } = require('fs')
const { tmpdir } = require('os')
const { join } = require('path')
const { promisify } = require('util')
const puppeteer = require('puppeteer-core')

const execFileAsync = promisify(execFile)

// Thermal receipt printers overwhelmingly report their real native
// resolution as 203 DPI. Chrome renders at 96 CSS px/inch baseline, so this
// scale factor makes a screenshot's pixels land ~1:1 on the printer's own
// dots instead of being resampled by the Windows driver.
const PRINTER_NATIVE_DPI = 203
const NATIVE_SCALE = PRINTER_NATIVE_DPI / 96

function getChromePath(cfgOverride) {
  if (cfgOverride) return cfgOverride
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH
  if (process.platform === 'win32') {
    const candidates = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    ]
    return candidates.find(p => p && existsSync(p)) || candidates[0]
  }
  const candidates = ['/usr/bin/chromium-browser', '/usr/bin/chromium', '/usr/bin/google-chrome']
  return candidates.find(p => existsSync(p)) || candidates[0]
}

let _browser = null
async function getBrowser(cfg) {
  if (_browser) {
    try { await _browser.version(); return _browser } catch { _browser = null }
  }
  _browser = await puppeteer.launch({
    executablePath: getChromePath(cfg.chromiumPath),
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  return _browser
}

// Chrome anti-aliases text/QR edges into a range of gray pixels — invisible
// on a screen, but these are monochrome thermal printers with no real
// grayscale of their own: the Windows print driver has to DITHER every gray
// pixel of a screenshot into a scattered pattern of black/white dots, which
// reads as blurry/grainy next to a native browser print job. Cranking
// contrast right before the screenshot snaps every anti-aliased edge pixel
// back to solid black or solid white, so there's nothing left for the
// driver to dither. page.evaluate() is given a STRING body, not a function
// reference — a pkg-packaged .exe bytecode-compiles the bundle, and
// Function.prototype.toString() on a bytecoded function doesn't return
// usable source, which is what Puppeteer needs to ship the function over CDP.
async function sharpenForThermalPrint(page, contrastPct = 220) {
  await page.evaluate(`
    (() => {
      const style = document.createElement('style')
      style.textContent = 'html { filter: grayscale(1) contrast(${contrastPct}%); }'
      document.head.appendChild(style)
    })()
  `)
}

// Draws one image, scaled to the page's own width, onto whatever roll-size
// paper form is configured for that printer. Kept as its own tiny
// PowerShell script per call (not a persistent process) so a print failure
// never leaves the printer's spooler in a weird state.
async function printSinglePage(pngBuffer, printerName, paperWidthUnits) {
  const tmp = join(tmpdir(), `pos-print-${Date.now()}.png`)
  await writeFile(tmp, pngBuffer)
  try {
    if (process.platform !== 'win32') {
      await execFileAsync('lp', ['-d', printerName, tmp], { timeout: 30_000 })
      return
    }
    const escapedTmp = tmp.replace(/\\/g, '\\\\')
    const escapedPrinter = printerName.replace(/'/g, "''")
    const ps = `
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('${escapedTmp}')
$pd = New-Object System.Drawing.Printing.PrintDocument
$pd.PrinterSettings.PrinterName = '${escapedPrinter}'
$sizes = $pd.PrinterSettings.PaperSizes
$roll = $sizes | Where-Object { $_.Width -eq ${paperWidthUnits} } | Sort-Object Height -Descending | Select-Object -First 1
if (-not $roll) { $roll = $sizes | Sort-Object Height -Descending | Select-Object -First 1 }
if ($roll) { $pd.DefaultPageSettings.PaperSize = $roll }
$pd.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins(0,0,0,0)
$captured = $img
$pd.add_PrintPage({
  param($s,$ev)
  # NearestNeighbor, not bicubic — the source is already effectively binary
  # after sharpenForThermalPrint's hard contrast threshold, so there's
  # nothing left to smooth; bicubic would only ring against the QR code's
  # hard edges instead.
  $ev.Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  $ev.Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $ratio = $captured.Height / $captured.Width
  $w = $ev.PageBounds.Width
  $h = [int]($w * $ratio)
  $ev.Graphics.DrawImage($captured, $ev.PageBounds.X, $ev.PageBounds.Y, $w, $h)
  $ev.HasMorePages = $false
})
$pd.Print()
$img.Dispose()
$pd.Dispose()
`
    await execFileAsync('powershell', ['-NoProfile', '-NonInteractive', '-Command', ps], { timeout: 30_000 })
  } finally {
    await unlink(tmp).catch(() => {})
  }
}

// Bon (receipt) — one continuous-roll receipt, width fixed by the roll,
// height sized to content. Two-pass viewport: measure content height first,
// then re-set the viewport to that exact height before the real screenshot,
// so the clip isn't cut short or padded with blank space.
async function printBon(url, cfg) {
  const viewportWidth = Math.round((cfg.bonPaperWidthUnits / 100) * 96)
  const browser = await getBrowser(cfg)
  const page = await browser.newPage()
  try {
    await page.emulateMediaType('print')
    await page.setViewport({ width: viewportWidth, height: 2000, deviceScaleFactor: NATIVE_SCALE })
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30_000 })
    await sharpenForThermalPrint(page)

    const totalH = await page.evaluate('document.body.scrollHeight')
    await page.setViewport({ width: viewportWidth, height: totalH + 20, deviceScaleFactor: NATIVE_SCALE })

    const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: viewportWidth, height: totalH } })
    await printSinglePage(Buffer.from(png), cfg.bonPrinterName, cfg.bonPaperWidthUnits)
  } finally {
    await page.close()
  }
}

module.exports = { printBon }
