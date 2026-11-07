@echo off
setlocal DisableDelayedExpansion
title Birthday Website - Restore Birthday
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\switch-site.ps1" -Mode birthday
set "SWITCH_EXIT=%ERRORLEVEL%"
echo.
pause
exit /b %SWITCH_EXIT%
