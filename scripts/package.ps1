<#
.SYNOPSIS
    Rebuild both Angular sites and repackage the three cPanel deliverables.

.DESCRIPTION
    Run this AFTER you have changed apiBaseUrl in the two environment.ts files.

    Examples
    --------
    # deployed straight on a sub-domain (https://client.xxx) -> no sub-folder
    powershell -ExecutionPolicy Bypass -File scripts\package.ps1 -Username hz123456

    # deployed inside public_html sub-folders
    powershell -ExecutionPolicy Bypass -File scripts\package.ps1 -Username hz123456 `
        -ClientBase "/a3-client/" -AdminBase "/a3-admin/"

    Output:  deliverables\hz123456A3-clientside.zip
             deliverables\hz123456A3-adminside.zip
             deliverables\hz123456A3-api.zip
#>
param(
    [string]$Username   = 'username',
    [string]$ClientBase = '/',
    [string]$AdminBase  = '/'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$ws   = Join-Path $root 'charity-workspace'
$out  = Join-Path $root 'deliverables'

function New-Htaccess([string]$dir, [string]$base) {
    $content = @"
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase $base
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . ${base}index.html [L]
</IfModule>
"@
    Set-Content -Path (Join-Path $dir '.htaccess') -Value $content -Encoding ASCII
}

Write-Host 'Building client + admin ...' -ForegroundColor Cyan
Push-Location $ws
ng build client
ng build admin
Pop-Location

$clientDir = Join-Path $ws 'dist/client/browser'
$adminDir  = Join-Path $ws 'dist/admin/browser'
New-Htaccess $clientDir $ClientBase
New-Htaccess $adminDir  $AdminBase

New-Item -ItemType Directory -Force -Path $out | Out-Null
# -Force so the hidden .htaccess file is included as well
Get-ChildItem $clientDir -Force | Compress-Archive -DestinationPath "$out\${Username}A3-clientside.zip" -Force
Get-ChildItem $adminDir  -Force | Compress-Archive -DestinationPath "$out\${Username}A3-adminside.zip"  -Force

# API: source only - node_modules and .env must never be uploaded
$tmp = Join-Path $env:TEMP 'a3-api-pkg'
Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $tmp | Out-Null
Copy-Item (Join-Path $root 'api/*') $tmp -Recurse -Force -Exclude 'node_modules'
Remove-Item (Join-Path $tmp 'node_modules')    -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path $tmp '.env')            -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path $tmp 'package-lock.json') -Force -ErrorAction SilentlyContinue
Get-ChildItem $tmp -Force | Compress-Archive -DestinationPath "$out\${Username}A3-api.zip" -Force

Write-Host "`nDone:" -ForegroundColor Green
Get-ChildItem $out | Select-Object Name, @{n = 'KB'; e = { [math]::Round($_.Length / 1KB, 1) } } | Format-Table -AutoSize
