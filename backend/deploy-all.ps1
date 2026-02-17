# Deploy All Services Script
# Usage: .\deploy-all.ps1 [-Stage dev|qa|uat|prod] [-Force]

param(
    [string]$Stage = "dev",
    [switch]$Force
)

$ErrorActionPreference = "Continue"

# Colors for output
function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Info { param($msg) Write-Host $msg -ForegroundColor Cyan }
function Write-Warn { param($msg) Write-Host $msg -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host $msg -ForegroundColor Red }

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServicesDir = Join-Path $ScriptDir "services"

# Services in deployment order (dependencies first)
$Services = @(
    "migration-service",
    "auth-service",
    "resource-service",
    "project-service",
    "allocation-service",
    "report-service",
    "audit-service"
)

Write-Info "============================================"
Write-Info "  1BT Resource Management - Deploy All"
Write-Info "============================================"
Write-Info "Stage: $Stage"
Write-Info "Force: $Force"
Write-Info "Services: $($Services.Count)"
Write-Info "============================================"
Write-Host ""

$startTime = Get-Date
$successful = @()
$failed = @()

foreach ($service in $Services) {
    $servicePath = Join-Path $ServicesDir $service
    
    if (-not (Test-Path $servicePath)) {
        Write-Warn "Service not found: $service - Skipping"
        continue
    }
    
    Write-Info ""
    Write-Info "[$($Services.IndexOf($service) + 1)/$($Services.Count)] Deploying $service..."
    Write-Host "----------------------------------------"
    
    Push-Location $servicePath
    
    $deployCmd = "npx serverless deploy --stage $Stage"
    if ($Force) {
        $deployCmd += " --force"
    }
    
    Invoke-Expression $deployCmd
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Success ">>> $service deployed successfully"
        $successful += $service
    }
    else {
        Write-Err ">>> $service deployment failed (exit code: $exitCode)"
        $failed += $service
    }
    
    Pop-Location
}

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Info "============================================"
Write-Info "  Deployment Summary"
Write-Info "============================================"
Write-Success "Successful: $($successful.Count)/$($Services.Count)"
foreach ($s in $successful) {
    Write-Success "  + $s"
}

if ($failed.Count -gt 0) {
    Write-Err "Failed: $($failed.Count)/$($Services.Count)"
    foreach ($f in $failed) {
        Write-Err "  - $f"
    }
}

Write-Info "Duration: $([math]::Floor($duration.TotalMinutes))m $($duration.Seconds)s"
Write-Info "============================================"

if ($failed.Count -gt 0) {
    exit 1
}
