# Update Layer Version Script
# Updates all services to use a specific layer version and optionally deploys
# Usage: .\update-layer.ps1 -Version 31 [-Deploy] [-Stage dev]

param(
    [Parameter(Mandatory=$true)]
    [int]$Version,
    [string]$Stage = "dev",
    [switch]$Deploy
)

$ErrorActionPreference = "Stop"

function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Info { param($msg) Write-Host $msg -ForegroundColor Cyan }

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServicesDir = Join-Path $ScriptDir "services"

Write-Info "Updating all services to layer version $Version..."

# Find all serverless.yml files and update layer version
Get-ChildItem -Path $ServicesDir -Recurse -Filter "serverless.yml" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace 'onebt-shared-libs-\$\{self:provider\.stage\}:\d+', "onebt-shared-libs-`${self:provider.stage}:$Version"
    
    if ($content -ne $newContent) {
        Set-Content -Path $_.FullName -Value $newContent -NoNewline
        Write-Success "Updated: $($_.FullName)"
    }
}

Write-Success "`nAll services updated to layer version $Version"

if ($Deploy) {
    Write-Info "`nStarting deployment..."
    & "$ScriptDir\deploy-all.ps1" -Stage $Stage -Force
}
