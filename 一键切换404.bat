@echo off
setlocal DisableDelayedExpansion
title Birthday Website - Switch to 404
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\switch-site.ps1" -Mode closed
set "SWITCH_EXIT=%ERRORLEVEL%"
echo.
pause
exit /b %SWITCH_EXIT%
