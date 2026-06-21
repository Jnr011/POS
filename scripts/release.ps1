#!/usr/bin/env pwsh
param(
  [Parameter(Mandatory=$true)]
  [string]$Version,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

if ($Version -notmatch '^\d+\.\d+\.\d+$') {
  Write-Error "Version must be semver (e.g. 1.2.0), got: $Version"
  exit 1
}

$Root = Resolve-Path "$PSScriptRoot/.."

$Files = @(
  "$Root\client\package.json",
  "$Root\client\src-tauri\Cargo.toml",
  "$Root\client\src-tauri\Cargo.lock",
  "$Root\client\src-tauri\tauri.conf.json"
)

Write-Host "==> Bumping version to $Version" -ForegroundColor Cyan

$Updated = @()

foreach ($File in $Files) {
  $Content = Get-Content $File -Raw
  $Original = $Content

  if ($File -like "*Cargo.lock") {
    $Content = $Content -replace '(?m)^name = "pharmacy-pos"\r?\nversion = "\d+\.\d+\.\d+"', "name = ""pharmacy-pos""`nversion = ""$Version"""
  } elseif ($File -like "*Cargo.toml") {
    $Content = $Content -replace '(?m)^version = "\d+\.\d+\.\d+"', "version = ""$Version"""
  } else {
    $Content = $Content -replace '"version": "\d+\.\d+\.\d+"', """version"": ""$Version"""
  }

  if ($Content -eq $Original) {
    Write-Warning "No change in $File — version pattern not found?"
  } else {
    if (-not $DryRun) {
      Set-Content $File $Content -NoNewline
    }
    $Updated += $File
    Write-Host "  Updated: $File" -ForegroundColor Green
  }
}

if ($Updated.Count -ne $Files.Count) {
  Write-Error "Only $($Updated.Count)/$($Files.Count) files updated. Aborting."
  exit 1
}

$Tag = "v$Version"

if ($DryRun) {
  Write-Host "`n==> Dry-run complete. Would commit and tag: $Tag" -ForegroundColor Yellow
  exit 0
}

Write-Host "`n==> Committing..." -ForegroundColor Cyan
git -C $Root add -A
git -C $Root commit -m "v$Version"

Write-Host "==> Tagging $Tag..." -ForegroundColor Cyan
git -C $Root tag $Tag

Write-Host "==> Pushing..." -ForegroundColor Cyan
git -C $Root push origin main --tags

Write-Host "`nDone! Release $Tag pushed. GitHub Actions will build and create the release." -ForegroundColor Green
