<#
.SYNOPSIS
    1BT Resource Management - Deployment Script

.DESCRIPTION
    Deploys all infrastructure and microservices in the correct order.
    Uses a single infrastructure stack for VPC, RDS, Cognito, and API Gateway.

.PARAMETER Stage
    Deployment stage: dev, qa, uat, prod

.PARAMETER Action
    Action to perform: deploy, remove, status

.PARAMETER Service
    Specific service to target (optional)

.PARAMETER Region
    AWS region (default: ap-southeast-1)

.EXAMPLE
    .\deploy.ps1 -Stage dev -Action deploy
    Deploy all services to dev

.EXAMPLE
    .\deploy.ps1 -Stage dev -Action deploy -Service auth
    Deploy only auth service to dev

.EXAMPLE
    .\deploy.ps1 -Stage dev -Action status
    Check deployment status
#>

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("dev", "qa", "uat", "prod")]
    [string]$Stage,

    [Parameter(Mandatory = $false)]
    [ValidateSet("deploy", "remove", "status")]
    [string]$Action = "deploy",

    [Parameter(Mandatory = $false)]
    [ValidateSet("infrastructure", "shared", "auth", "resource", "project", "allocation", "report", "document")]
    [string]$Service,

    [Parameter(Mandatory = $false)]
    [string]$Region = "ap-southeast-1"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Service definitions (order matters for deployment)
$Services = [ordered]@{
    "infrastructure" = @{ Path = "infrastructure"; Description = "VPC, RDS, Cognito, API Gateway" }
    "shared"         = @{ Path = "shared"; Description = "Shared Lambda Layer" }
    "auth"           = @{ Path = "services/auth-service"; Description = "Authentication Service" }
    "resource"       = @{ Path = "services/resource-service"; Description = "Resource Management Service" }
    "project"        = @{ Path = "services/project-service"; Description = "Project & Client Service" }
    "allocation"     = @{ Path = "services/allocation-service"; Description = "Allocation Service" }
    "report"         = @{ Path = "services/report-service"; Description = "Reporting Service" }
    "document"       = @{ Path = "services/document-service"; Description = "Document Generation Service (Python)" }
}

# Colors
function Write-Success { param($Message) Write-Host "[OK] $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Warn { param($Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Write-Err { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }
function Write-Step { param($Message) Write-Host "`n=== $Message ===" -ForegroundColor Magenta }

# Check prerequisites
function Test-Prerequisites {
    Write-Step "Checking Prerequisites"

    # Check AWS CLI
    if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
        Write-Err "AWS CLI not found. Please install it: https://aws.amazon.com/cli/"
        exit 1
    }
    Write-Success "AWS CLI: $(aws --version 2>&1 | Select-Object -First 1)"

    # Check Node.js
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Err "Node.js not found. Please install Node.js 20+"
        exit 1
    }
    Write-Success "Node.js: $(node --version)"

    # Check Serverless Framework
    try {
        $slsVersion = npx serverless --version 2>&1 | Select-Object -First 1
        Write-Success "Serverless: $slsVersion"
    }
    catch {
        Write-Err "Serverless Framework not found. Run: npm install -g serverless"
        exit 1
    }

    # Check AWS credentials
    try {
        $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
        Write-Success "AWS Account: $($identity.Account)"
        Write-Success "AWS User/Role: $($identity.Arn)"
    }
    catch {
        Write-Err "AWS credentials not configured. Run: aws configure"
        exit 1
    }
}

# Deploy a single service
function Deploy-Service {
    param([string]$ServiceName)

    $svc = $Services[$ServiceName]
    $fullPath = Join-Path $ScriptDir $svc.Path

    if (-not (Test-Path $fullPath)) {
        Write-Err "Service path not found: $fullPath"
        return $false
    }

    Write-Info "Deploying $ServiceName from $($svc.Path)..."

    Push-Location $fullPath
    try {
        npx serverless deploy --stage $Stage --region $Region --verbose
        if ($LASTEXITCODE -ne 0) {
            throw "Deployment failed"
        }
        Write-Success "$ServiceName deployed successfully"
        return $true
    }
    catch {
        Write-Err "Deployment failed for $ServiceName : $_"
        return $false
    }
    finally {
        Pop-Location
    }
}

# Remove a single service
function Remove-Service {
    param([string]$ServiceName)

    $svc = $Services[$ServiceName]
    $fullPath = Join-Path $ScriptDir $svc.Path

    if (-not (Test-Path $fullPath)) {
        Write-Warn "Service path not found: $fullPath (may already be removed)"
        return $true
    }

    Write-Info "Removing $ServiceName..."

    Push-Location $fullPath
    try {
        npx serverless remove --stage $Stage --region $Region 2>&1
        Write-Success "$ServiceName removed"
        return $true
    }
    catch {
        Write-Warn "Error removing $ServiceName (may not exist)"
        return $true
    }
    finally {
        Pop-Location
    }
}

# Get service status
function Get-ServiceStatus {
    param([string]$ServiceName)

    $svc = $Services[$ServiceName]
    $fullPath = Join-Path $ScriptDir $svc.Path

    if (-not (Test-Path $fullPath)) {
        Write-Warn "$ServiceName - Path not found"
        return
    }

    Push-Location $fullPath
    try {
        npx serverless info --stage $Stage --region $Region 2>&1
        Write-Success "$ServiceName - Deployed"
    }
    catch {
        Write-Warn "$ServiceName - Not deployed"
    }
    finally {
        Pop-Location
    }
}

# Get services to process
function Get-ServicesToProcess {
    if ($Service) {
        return @($Service)
    }
    return $Services.Keys
}

# Main execution
Write-Host ""
Write-Host "========================================" -ForegroundColor Blue
Write-Host "  1BT Resource Management Deployment" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host "Stage:  $Stage"
Write-Host "Action: $Action"
Write-Host "Region: $Region"
if ($Service) {
    Write-Host "Service: $Service"
}
Write-Host ""

Test-Prerequisites

$servicesToProcess = Get-ServicesToProcess

switch ($Action) {
    "deploy" {
        Write-Step "Starting Deployment"

        $failed = $null
        foreach ($svc in $servicesToProcess) {
            Write-Step "Deploying: $svc - $($Services[$svc].Description)"

            if (-not (Deploy-Service $svc)) {
                $failed = $svc
                Write-Err "Deployment stopped due to failure in $svc"
                break
            }
        }

        Write-Host ""
        if (-not $failed) {
            Write-Success "All services deployed successfully!"

            # Get API endpoint
            try {
                $apiEndpoint = aws cloudformation describe-stacks `
                    --stack-name "onebt-infrastructure-$Stage" `
                    --query "Stacks[0].Outputs[?OutputKey=='HttpApiEndpoint'].OutputValue" `
                    --output text `
                    --region $Region 2>$null

                if ($apiEndpoint -and $apiEndpoint -ne "None") {
                    Write-Host "`nAPI Endpoint: $apiEndpoint" -ForegroundColor Green
                }
            }
            catch { }
        }
        else {
            Write-Err "Deployment failed. Failed service: $failed"
            exit 1
        }
    }

    "remove" {
        Write-Step "Starting Removal (Reverse Order)"

        if (-not $Service) {
            Write-Warn "This will remove ALL services and infrastructure for stage: $Stage"
            $confirm = Read-Host "Are you sure? (yes/no)"
            if ($confirm -ne "yes") {
                Write-Info "Removal cancelled"
                exit 0
            }
        }

        # Reverse the order for removal
        $reversed = @($servicesToProcess)
        [array]::Reverse($reversed)

        foreach ($svc in $reversed) {
            Write-Step "Removing: $svc"
            Remove-Service $svc | Out-Null
        }

        Write-Success "Removal complete!"
    }

    "status" {
        Write-Step "Checking Deployment Status"

        foreach ($svc in $servicesToProcess) {
            Write-Host ""
            Write-Info "Checking: $svc - $($Services[$svc].Description)"
            Get-ServiceStatus $svc
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Blue
Write-Host "  Deployment Complete" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""
