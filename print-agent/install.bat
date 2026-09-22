@echo off
REM Shop Print/POS Agent — double-click this file to install.
REM
REM install.ps1 alone can fail silently on a fresh Windows PC: PowerShell's
REM default "script execution is disabled on this system" policy blocks a
REM .ps1 from running at all, even via right-click -> "Run with PowerShell",
REM and the window then closes before anyone can read why. This .bat sidesteps
REM that entirely — a .bat file has no such restriction — and explicitly
REM bypasses the policy just for this one script, only in this one process.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
