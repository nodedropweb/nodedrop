<#
.SYNOPSIS
    Fetches the pinned btop4win release into dist/tools/btop4win so that it ships with the Windows build.

.DESCRIPTION
    btop4win (https://github.com/aristocratos/btop4win, Apache-2.0) is the terminal system monitor behind the
    "Monitor" widget (`ndsh sysmon`). The release is downloaded from GitHub, verified against a pinned SHA-256
    checksum and extracted to dist/tools/btop4win. electron-builder then packs dist/tools into the installer.

    To update btop4win, change $Version and $Sha256 below (the checksum is shown on the GitHub release page).
    The download is cached in node_modules/.cache/btop4win.
#>

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$Version = "1.0.5"
$Url = "https://github.com/aristocratos/btop4win/releases/download/v$Version/btop4win-x64.zip"
$Sha256 = "8275899f02ddc82523f23356836a427c9bba996ca17ef24057a1020dbcd3e951"

$repoRoot = Split-Path -Parent $PSScriptRoot
$cacheDir = Join-Path $repoRoot "node_modules/.cache/btop4win"
$zipPath = Join-Path $cacheDir "btop4win-x64-$Version.zip"
$outDir = Join-Path $repoRoot "dist/tools/btop4win"

function Get-Sha256([string]$Path) {
    return (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash.ToLowerInvariant()
}

New-Item -ItemType Directory -Force $cacheDir | Out-Null

if (-not (Test-Path -LiteralPath $zipPath) -or (Get-Sha256 $zipPath) -ne $Sha256) {
    Write-Host "Downloading btop4win $Version ..."
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $Url -OutFile $zipPath -UseBasicParsing
}

$actual = Get-Sha256 $zipPath
if ($actual -ne $Sha256) {
    Remove-Item -Force -LiteralPath $zipPath
    throw "btop4win checksum mismatch: expected $Sha256 but got $actual. The download was removed."
}

$tmp = Join-Path ([IO.Path]::GetTempPath()) ("btop4win-" + [Guid]::NewGuid().ToString("N"))
try {
    Expand-Archive -LiteralPath $zipPath -DestinationPath $tmp
    $src = Join-Path $tmp "btop4win"
    if (-not (Test-Path -LiteralPath (Join-Path $src "btop4win.exe"))) {
        throw "btop4win.exe not found in the downloaded archive"
    }
    if (Test-Path -LiteralPath $outDir) {
        Remove-Item -Recurse -Force -LiteralPath $outDir
    }
    New-Item -ItemType Directory -Force $outDir | Out-Null
    Copy-Item -Recurse -Force -Path (Join-Path $src "*") -Destination $outDir
}
finally {
    if (Test-Path -LiteralPath $tmp) {
        Remove-Item -Recurse -Force -LiteralPath $tmp
    }
}

Write-Host "btop4win $Version (sha256 verified) ready in dist/tools/btop4win"
