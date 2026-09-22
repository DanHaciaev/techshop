# Shop Print/POS Agent — one-time setup, per seller PC.
#
# Run this ONCE (double-click "Run with PowerShell", or from an elevated
# prompt: powershell -ExecutionPolicy Bypass -File install.ps1). It:
#   1. Copies shop-print-agent.exe (+ config.json) into a permanent folder
#      under this Windows user's own profile.
#   2. Registers a Scheduled Task that starts the agent automatically every
#      time this user logs in (hidden window — never visible, no icon to
#      accidentally close).
#   3. Starts it immediately, so printing/charging work right away without a
#      logoff/logon cycle.
#
# After this, closing/reopening the browser or restarting the PC never
# requires touching this script again.

$ErrorActionPreference = 'Stop'

# Registering a Scheduled Task requires an elevated (Administrator) process
# even for a task that only runs under this same user's own login. Rather
# than ask the operator to remember "Run as Administrator", re-launch
# ourselves elevated (one UAC prompt) and exit the non-elevated copy.
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  try {
    Start-Process powershell -Verb RunAs -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSCommandPath`"")
  } catch {
    Write-Host ''
    Write-Host 'Установка требует подтверждения окна UAC (Windows запросила права администратора) — запрос был отклонён или произошла ошибка.' -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ''
    Write-Host 'Нажмите Enter, чтобы закрыть...' -ForegroundColor DarkGray
    Read-Host | Out-Null
  }
  exit
}

# Everything below is wrapped so a failure prints a real, readable error and
# waits for a keypress instead of the window just vanishing.
try {
  $installDir = Join-Path $env:LOCALAPPDATA 'ShopPrintAgent'
  New-Item -ItemType Directory -Force -Path $installDir | Out-Null

  $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

  # Accept either layout: exe directly beside install.ps1, or inside a "dist"
  # subfolder next to it (how the repo itself is organized: print-agent/dist/).
  $exeCandidates = @(
    (Join-Path $scriptDir 'shop-print-agent.exe'),
    (Join-Path $scriptDir 'dist\shop-print-agent.exe')
  )
  $exeSource = $exeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if (-not $exeSource) {
    throw "Не найден shop-print-agent.exe рядом с install.ps1 (ни напрямую, ни в dist\). Запустите install.ps1 из той же папки, куда был распакован агент."
  }
  $sourceDir = Split-Path -Parent $exeSource
  Copy-Item -Path $exeSource -Destination $installDir -Force

  $configSource = Join-Path $sourceDir 'config.json'
  $configDest = Join-Path $installDir 'config.json'
  if ((Test-Path $configSource) -and -not (Test-Path $configDest)) {
    # Never overwrite an existing config.json on re-install — an admin may
    # have already customized printer/terminal settings on this exact PC.
    Copy-Item -Path $configSource -Destination $configDest
  }

  # MAIB (Arcus2) needs its own bridge folder — bridge.py, arccom.dll and the
  # rest — sitting right next to the INSTALLED exe (maib.js resolves it via
  # path.dirname(process.execPath), not the zip's own folder layout).
  #
  # The 32-bit Python bridge process (maib.js spawns "py -3-32 bridge.py" and
  # keeps it running across charges) keeps arccom.dll/dialogs.dll/itpos.dll
  # loaded in memory the whole time it's alive — copying over those files
  # while it's still running fails with "file is used by another process".
  # Stopping the main exe below doesn't touch this CHILD process at all, so
  # it has to be found and stopped separately, by its own command line
  # (there is no PID tracked anywhere to kill it by) — matching only
  # processes actually running OUR bridge.py, never some unrelated Python
  # the seller has on that PC for something else.
  function Wait-ProcessGone($name, $timeoutMs = 5000) {
    $deadline = (Get-Date).AddMilliseconds($timeoutMs)
    while ((Get-Date) -lt $deadline) {
      if (-not (Get-Process -Name $name -ErrorAction SilentlyContinue)) { return }
      Start-Sleep -Milliseconds 200
    }
  }

  # The same "used by another process" failure can hit the copy itself even
  # after the process is confirmed gone — antivirus briefly re-scanning the
  # freshly-freed exe, or the OS finishing its own handle cleanup a beat
  # later. A few retries with a short pause covers that.
  function Copy-ItemWithRetry($src, $dst, [switch]$Recurse) {
    for ($i = 1; $i -le 5; $i++) {
      try { Copy-Item -Path $src -Destination $dst -Recurse:$Recurse -Force; return } catch {
        if ($i -eq 5) { throw }
        Start-Sleep -Milliseconds 500
      }
    }
  }

  try {
    Get-CimInstance Win32_Process -Filter "Name = 'python.exe' OR Name = 'pythonw.exe'" -ErrorAction SilentlyContinue |
      Where-Object { $_.CommandLine -and $_.CommandLine -like '*bridge.py*' } |
      ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    Wait-ProcessGone 'python'
    Wait-ProcessGone 'pythonw'
  } catch { }

  $bridgeCandidates = @(
    (Join-Path $scriptDir 'maib-bridge'),
    (Join-Path $scriptDir 'dist\maib-bridge')
  )
  $bridgeSource = $bridgeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if ($bridgeSource) {
    Copy-ItemWithRetry $bridgeSource (Join-Path $installDir 'maib-bridge') -Recurse

    # MAIB_driver_v21.py (the bank's own file, unmodified) imports func_timeout
    # from PyPI — not stdlib. Missing this doesn't fail until the FIRST real
    # charge attempt (bridge.py crashes on import, with nothing printed
    # anywhere an operator would see except agent.log) — worth trying to
    # install it right now, while Python's freshly on everyone's mind.
    # Best-effort: if `py` isn't installed yet, this just no-ops.
    try {
      $pyCheck = Get-Command 'py' -ErrorAction SilentlyContinue
      if ($pyCheck) {
        & py -3-32 -m pip install --quiet func_timeout 2>&1 | Out-Null
      }
    } catch { }
  }

  $exeDest = Join-Path $installDir 'shop-print-agent.exe'
  $vbsDest = Join-Path $installDir 'run-hidden.vbs'
  $taskName = 'ShopPrintAgent'

  # Stop any already-running copy before replacing/re-registering — avoids a
  # "file in use" copy failure on re-install, and two instances fighting over
  # the same port.
  Get-Process -Name 'shop-print-agent' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  Wait-ProcessGone 'shop-print-agent'
  Copy-ItemWithRetry $exeSource $exeDest

  # The zip was downloaded through a browser, so Windows tagged every file
  # inside it with a Zone.Identifier "this came from the internet" marker —
  # copying the exe carries that marker right along with it. That marker is
  # what triggers an "unknown publisher" warning on EVERY launch, not just
  # the first manual double-click — including the hidden Scheduled Task
  # launch below, with nobody there to click "Run anyway", so the agent
  # silently never actually starts after a reboot. Unblock-File strips that
  # marker from the installed copy.
  Unblock-File -Path $exeDest -ErrorAction SilentlyContinue

  # The Scheduled Task's -Hidden setting only hides the TASK from Task
  # Scheduler's list — it does nothing to the console window of the process
  # it launches. Pointing the task straight at the .exe pops a real, visible
  # console window on screen at every login, with no icon or explanation —
  # an operator tidying up windows closes it, silently killing printing/
  # charging until someone notices and relaunches by hand. A tiny VBScript
  # launcher is the standard way to start a console app with truly zero
  # window (unlike PowerShell's own -WindowStyle Hidden, which can still
  # flash a window briefly).
  $vbsContent = 'Set objShell = CreateObject("WScript.Shell")' + "`r`n" + ('objShell.Run """' + $exeDest + '""", 0, False')
  Set-Content -Path $vbsDest -Value $vbsContent -Encoding ASCII

  $action = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument ('"' + $vbsDest + '"')
  $trigger = New-ScheduledTaskTrigger -AtLogOn
  $settings = New-ScheduledTaskSettingsSet -Hidden -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
  Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null

  Start-ScheduledTask -TaskName $taskName

  Write-Host ''
  Write-Host "Установлено — агент запущен и будет стартовать автоматически при каждом входе в систему." -ForegroundColor Green
  Write-Host "Проверка: откройте http://127.0.0.1:48090/health в браузере — должно появиться { ""ok"": true, ... }." -ForegroundColor Cyan
  Write-Host "Настройка (имя принтера, терминалы и т.д.): $configDest" -ForegroundColor Cyan
} catch {
  Write-Host ''
  Write-Host "ОШИБКА при установке:" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
}
Write-Host ''
Write-Host 'Нажмите Enter, чтобы закрыть...' -ForegroundColor DarkGray
Read-Host | Out-Null
