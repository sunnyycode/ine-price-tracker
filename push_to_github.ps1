# INE Price Tracker - Push to GitHub Script
$ErrorActionPreference = "Stop"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "    INE Price Tracker - Push to GitHub Repository  " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Locate Git
$gitCmd = "git"
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    $mingitPath = "$env:USERPROFILE\mingit\cmd\git.exe"
    if (Test-Path $mingitPath) {
        $gitCmd = $mingitPath
    } else {
        Write-Error "Git is not found. Please install Git from https://git-scm.com/download/win and run this script again."
    }
}

Write-Host "Using Git from: $gitCmd" -ForegroundColor Green

# 2. Configure default user if not set
try {
    & $gitCmd config user.name | Out-Null
} catch {
    & $gitCmd config --global user.name "Sunny Chaudhary"
    & $gitCmd config --global user.email "sunnyycode@gmail.com"
}

# 3. Initialize repository if not already
if (-not (Test-Path ".git")) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    & $gitCmd init
}

# 4. Add all files
Write-Host "Staging files..." -ForegroundColor Yellow
& $gitCmd add .

# 5. Commit
Write-Host "Committing files..." -ForegroundColor Yellow
& $gitCmd commit -m "Initial commit: INE Product Price Tracker full-stack application" --allow-empty

# 6. Set branch to main
& $gitCmd branch -M main

# 7. Configure remote origin
$remoteUrl = "https://github.com/sunnyycode/ine-price-tracker.git"
try {
    & $gitCmd remote remove origin 2>$null
} catch {}
& $gitCmd remote add origin $remoteUrl
Write-Host "Remote set to: $remoteUrl" -ForegroundColor Green

# 8. Push to GitHub
Write-Host "Pushing to GitHub (main branch)..." -ForegroundColor Cyan
& $gitCmd push -u origin main

Write-Host "`nSUCCESS! Code pushed to https://github.com/sunnyycode/ine-price-tracker" -ForegroundColor Green
Write-Host "You can now connect this repo to Render and Vercel!" -ForegroundColor Green
