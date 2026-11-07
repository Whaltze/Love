@echo off
setlocal

rem The BAT file stays ASCII-only for compatibility with Windows cmd.exe.
set "PROJECT_ROOT=%~dp0"
set "PUSH_SCRIPT=%PROJECT_ROOT%scripts\auto-push.ps1"

title Birthday Website - One Click Push

if not exist "%PUSH_SCRIPT%" (
  echo Push script not found:
  echo %PUSH_SCRIPT%
  echo.
  pause
  exit /b 1
)

rem ExecutionPolicy Bypass applies only to this process.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%PUSH_SCRIPT%" %*
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if "%EXIT_CODE%"=="0" (
  echo Auto commit and push finished.
) else (
  echo Auto push did not finish. Review the error above.
)

rem Keep the window open when launched by double-click.
pause
exit /b %EXIT_CODE%
