<#
  Switch the local website between birthday and closed (404) mode.
  No Git, Node.js, or administrator rights are required for switching.

  powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\switch-site.ps1 birthday
  powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\switch-site.ps1 closed
  powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\switch-site.ps1 status
#>
[CmdletBinding()]
param(
  [ValidateSet('birthday', 'closed', 'status')]
  [string]$Mode = 'status'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$modesRoot = Join-Path $projectRoot '.site-modes'
$modePath = Join-Path $modesRoot 'current-mode.txt'
$lockPath = Join-Path $modesRoot 'switch.lock'
$liveFiles = @('index.html', 'sw.js')
$switchLock = $null

function Test-SameFile {
  param([string]$First, [string]$Second)
  if (!(Test-Path -LiteralPath $First -PathType Leaf) -or
      !(Test-Path -LiteralPath $Second -PathType Leaf)) { return $false }
  return [Convert]::ToBase64String([IO.File]::ReadAllBytes($First)) -ceq
         [Convert]::ToBase64String([IO.File]::ReadAllBytes($Second))
}

function Get-CurrentMode {
  foreach ($candidate in @('birthday', 'closed')) {
    $template = Join-Path (Join-Path $modesRoot $candidate) 'index.html'
    if (Test-SameFile (Join-Path $projectRoot 'index.html') $template) {
      return $candidate
    }
  }
  # The live page may have been edited since the last switch.
  if (Test-Path -LiteralPath $modePath -PathType Leaf) {
    $savedMode = [IO.File]::ReadAllText($modePath).Trim().ToLowerInvariant()
    if ($savedMode -in @('birthday', 'closed')) { return $savedMode }
  }
  throw 'Cannot identify the current mode. Check .site-modes/current-mode.txt (birthday or closed).'
}

function Write-AtomicFile {
  param([string]$Path, [byte[]]$Bytes)
  $temporaryPath = $Path + '.' + [guid]::NewGuid().ToString('N') + '.tmp'
  try {
    [IO.File]::WriteAllBytes($temporaryPath, $Bytes)
    if ([IO.File]::Exists($Path)) {
      [IO.File]::Replace($temporaryPath, $Path, [NullString]::Value)
    } else {
      [IO.File]::Move($temporaryPath, $Path)
    }
  } finally {
    if ([IO.File]::Exists($temporaryPath)) { [IO.File]::Delete($temporaryPath) }
  }
}

try {
  if ($Mode -eq 'status') {
    Write-Host ('Current local mode: ' + (Get-CurrentMode)) -ForegroundColor Cyan
    exit 0
  }

  # Prevent two double-clicks from overwriting each other's snapshots.
  $switchLock = [IO.File]::Open($lockPath, [IO.FileMode]::OpenOrCreate,
    [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
  $currentMode = Get-CurrentMode
  $targetMode = $Mode.ToLowerInvariant()
  $targetDirectory = Join-Path $modesRoot $targetMode

  foreach ($name in $liveFiles) {
    if (!(Test-Path -LiteralPath (Join-Path $targetDirectory $name) -PathType Leaf)) {
      throw "Missing mode template: $targetMode/$name. No pages were replaced."
    }
  }
  $requiredPaths = if ($targetMode -eq 'birthday') {
    @('birthday-content.js', 'script.js', 'style.css', 'assets', 'photos')
  } else { @('cat.png') }
  foreach ($relativePath in $requiredPaths) {
    if (!(Test-Path -LiteralPath (Join-Path $projectRoot $relativePath))) {
      throw "Missing website file: $relativePath. No pages were replaced."
    }
  }

  $alreadyActive = $currentMode -eq $targetMode
  foreach ($name in $liveFiles) {
    if (!(Test-SameFile (Join-Path $projectRoot $name) (Join-Path $targetDirectory $name))) {
      $alreadyActive = $false
    }
  }
  if ($alreadyActive) {
    Write-Host "Already in $targetMode mode. No files changed." -ForegroundColor Green
    exit 0
  }

  # Keep a dated copy before updating either the templates or the live entry.
  $backupName = (Get-Date -Format 'yyyyMMdd-HHmmss-fff') + '-' + [guid]::NewGuid().ToString('N').Substring(0, 8)
  $backupDirectory = Join-Path (Join-Path $modesRoot 'backups') $backupName
  [IO.Directory]::CreateDirectory($backupDirectory) | Out-Null
  $previousFiles = @{}
  foreach ($name in $liveFiles) {
    $livePath = Join-Path $projectRoot $name
    if (Test-Path -LiteralPath $livePath -PathType Leaf) {
      $previousFiles[$name] = [IO.File]::ReadAllBytes($livePath)
      [IO.File]::WriteAllBytes((Join-Path $backupDirectory $name), $previousFiles[$name])
    }
  }
  [IO.File]::WriteAllText((Join-Path $backupDirectory 'mode.txt'), $currentMode)

  # Save edits to the page/worker being left, so switching back preserves them.
  $currentDirectory = Join-Path $modesRoot $currentMode
  [IO.Directory]::CreateDirectory($currentDirectory) | Out-Null
  foreach ($name in $liveFiles) {
    if ($previousFiles.ContainsKey($name)) {
      Write-AtomicFile (Join-Path $currentDirectory $name) $previousFiles[$name]
    }
  }

  $replacedFiles = @()
  try {
    # Update the worker first and the visible entry last.
    foreach ($name in @('sw.js', 'index.html')) {
      Write-AtomicFile (Join-Path $projectRoot $name) ([IO.File]::ReadAllBytes((Join-Path $targetDirectory $name)))
      $replacedFiles += $name
    }
    Write-AtomicFile $modePath ([Text.Encoding]::ASCII.GetBytes($targetMode + "`n"))
  } catch {
    $switchError = $_
    foreach ($name in $replacedFiles) {
      $livePath = Join-Path $projectRoot $name
      if ($previousFiles.ContainsKey($name)) {
        Write-AtomicFile $livePath $previousFiles[$name]
      } elseif ([IO.File]::Exists($livePath)) {
        [IO.File]::Delete($livePath)
      }
    }
    throw $switchError
  }

  Write-Host "Local website switched to: $targetMode" -ForegroundColor Green
  Write-Host "Previous entry backup: $backupDirectory"
  Write-Host 'To update the online site, run the one-click push BAT or your normal deploy command.'
  exit 0
} catch {
  Write-Host ('Switch failed: ' + $_.Exception.Message) -ForegroundColor Red
  exit 1
} finally {
  if ($null -ne $switchLock) {
    $switchLock.Dispose()
    # The empty lock file is reused; leaving it avoids a delete/open race.
  }
}
