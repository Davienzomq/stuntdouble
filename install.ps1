# stuntdouble installer for Claude Code (Windows PowerShell)
# Usage: irm https://raw.githubusercontent.com/Davienzomq/stuntdouble/main/install.ps1 | iex
$ErrorActionPreference = "Stop"

$repoZip = "https://github.com/Davienzomq/stuntdouble/archive/refs/heads/main.zip"
$skillsDir = Join-Path $env:USERPROFILE ".claude\skills"
$dest = Join-Path $skillsDir "stuntdouble"
$tmp = Join-Path $env:TEMP ("stuntdouble-" + [guid]::NewGuid().ToString("N"))

New-Item -ItemType Directory -Force $tmp | Out-Null
try {
    Write-Host "Downloading stuntdouble..."
    Invoke-WebRequest -Uri $repoZip -OutFile (Join-Path $tmp "repo.zip") -UseBasicParsing
    Expand-Archive -Path (Join-Path $tmp "repo.zip") -DestinationPath $tmp -Force

    New-Item -ItemType Directory -Force $skillsDir | Out-Null
    if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
    Copy-Item -Recurse (Join-Path $tmp "stuntdouble-main\skills\stuntdouble") $dest

    Write-Host ""
    Write-Host "stuntdouble installed to $dest"
    Write-Host "Restart your Claude Code session, then run: /stuntdouble on"
}
finally {
    Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
}
