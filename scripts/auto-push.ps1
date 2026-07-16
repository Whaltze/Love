<#
  One-click Git push helper for the birthday website.

  Normal workflow:
  1. Validate the repository, branch, and origin remote.
  2. Stage added, modified, and deleted files.
  3. Create a timestamped commit when changes exist.
  4. Pull the remote branch with rebase.
  5. Push the current branch to origin.

  Double-click the root-level "one-click push" BAT file for normal use.

  Optional custom commit message:
  powershell -ExecutionPolicy Bypass -File .\scripts\auto-push.ps1 -Message "Update photos"

  Validation without changing the repository:
  powershell -ExecutionPolicy Bypass -File .\scripts\auto-push.ps1 -DryRun
#>

param(
  [string]$Message = "",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# Always run from the repository root, regardless of the launch directory.
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot

function Write-Step {
  param([string]$Text)
  Write-Host ""
  Write-Host "==> $Text" -ForegroundColor Cyan
}

function Invoke-Git {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments
  )

  & git @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Git command failed: git $($Arguments -join ' ')"
  }
}

function Get-GitOutput {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments
  )

  $output = & git @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Git command failed: git $($Arguments -join ' ')"
  }
  return (($output | Out-String).Trim())
}

try {
  Write-Host "Birthday website auto push" -ForegroundColor Magenta
  Write-Host "Project: $projectRoot"

  if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "Git was not found. Install Git for Windows first."
  }

  $insideWorkTree = Get-GitOutput @("rev-parse", "--is-inside-work-tree")
  if ($insideWorkTree -ne "true") {
    throw "The project directory is not a Git repository."
  }

  $branch = Get-GitOutput @("branch", "--show-current")
  if ([string]::IsNullOrWhiteSpace($branch)) {
    throw "Detached HEAD detected. Switch to a normal branch first."
  }

  $remoteUrl = Get-GitOutput @("remote", "get-url", "origin")
  Write-Host "Branch: $branch"
  Write-Host "Remote: $remoteUrl"

  if ($DryRun) {
    Write-Host ""
    Write-Host "Dry-run validation passed. No files were changed." -ForegroundColor Green
    exit 0
  }

  Write-Step "Staging all local changes"
  # -A records additions, edits, and deletions so the remote matches this version.
  Invoke-Git @("add", "-A")

  # Exit code 0 means no staged changes; exit code 1 means changes exist.
  & git diff --cached --quiet
  $diffExitCode = $LASTEXITCODE
  if ($diffExitCode -notin @(0, 1)) {
    throw "Unable to inspect staged changes."
  }

  if ($diffExitCode -eq 1) {
    if ([string]::IsNullOrWhiteSpace($Message)) {
      $Message = "Auto update " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    }

    Write-Step "Creating commit: $Message"
    Invoke-Git @("commit", "-m", $Message)
  }
  else {
    Write-Host "No new local changes. Remote sync will continue." -ForegroundColor Yellow
  }

  Write-Step "Pulling remote updates with rebase"
  Invoke-Git @("pull", "--rebase", "origin", $branch)

  Write-Step "Pushing to origin/$branch"
  Invoke-Git @("push", "origin", $branch)

  $latestCommit = Get-GitOutput @("log", "-1", "--oneline")
  Write-Host ""
  Write-Host "Push completed successfully." -ForegroundColor Green
  Write-Host "Latest commit: $latestCommit"
  exit 0
}
catch {
  Write-Host ""
  Write-Host "Push failed: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "Keep this window open and review the error above." -ForegroundColor Yellow
  Write-Host "For a rebase conflict, run: git rebase --abort" -ForegroundColor Yellow
  exit 1
}

