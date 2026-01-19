<#
.SYNOPSIS
    Master deployment script for 1BT Resource Management microservices

.DESCRIPTION
    Deploys all infrastructure and microservices in the correct order.
    Uses a single infrastructure stack for VPC, RDS, Cognito, and API Gateway.

.PARAMETER Stage
    Deployment stage: dev, qa, uat, prod

.PARAMETER Action
    Action to perform: deploy, remove, status

.PARAMETER Service
    Specific service to deploy (optional, deploys all if not specified)
    Options: infrastructure, shared, auth, resource, project, allocation, report, document

.EXAMPLE
    .\deploy.ps1 -Stage dev -Action deploy
    .\deploy.ps1 -Stage dev -Action deploy -Service auth
    .\deploy.ps1 -Stage dev -Action remove
    .\deploy.ps1 -Stage dev -Action status
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "qa", "uat", "prod")]
    [string]$Stage,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("deploy", "remove", "status")]
    [string]$Action = "deploy",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("", "infrastructure", "shared", "auth", "resource", "project", "allocation", "report", "document")]
    [string]$Service = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "ap-southeast-1"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Colors for output
function Write-Success { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warn { param($msg) Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-Step { param($msg) Write-Host "`n=== $msg ===" -ForegroundColor Magenta }

# Service definitions
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

function Test-Prerequisites {
    Write-Step "Checking Prerequisites"
    
    # Check AWS CLI
    try {
        $awsVersion = aws --version 2>&1
        Write-Success "AWS CLI: $awsVersion"
    } catch {
        Write-Err "AWS CLI not found. Please install it: https://aws.amazon.com/cli/"
        exit 1
    }
    
    # Check Serverless Framework
    try {
        $slsVersion = npx serverless --version 2>&1 | Select-Object -First 1
        Write-Success "Serverless Framework: $slsVersion"
    } catch {
        Write-Err "Serverless Framework not found. Run: npm install -g serverless"
        exit 1
    }
    
    # Check AWS credentials
    try {
        $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
        Write-Success "AWS Account: $($identity.Account)"
        Write-Success "AWS User/Role: $($identity.Arn)"
    } catch {
        Write-Err "AWS credentials not configured. Run: aws configure"
        exit 1
    }
}

function Deploy-Service {
    param(
        [string]$ServiceName,
        [string]$ServicePath,
        [string]$Stage,
        [string]$Region
    )
    
    $fullPath = Join-Path $ScriptDir $ServicePath
    
    if (-not (Test-Path $fullPath)) {
        Write-Err "Service path not found: $fullPath"
        return $false
    }
    
    Write-Info "Deploying $ServiceName from $ServicePath..."
    
    Push-Location $fullPath
    try {
        $result = npx serverless deploy --stage $Stage --region $Region --verbose 2>&1
        Write-Host $result
        
        if ($LASTEXITCODE -ne 0) {
            Write-Err "Deployment failed for $ServiceName"
            return $false
        }
        
        Write-Success "$ServiceName deployed successfully"
        return $true
    }
    finally {
        Pop-Location
    }
}

function Remove-Service {
    param(
        [string]$ServiceName,
        [string]$ServicePath,
        [string]$Stage,
        [string]$Region
    )
    
    $fullPath = Join-Path $ScriptDir $ServicePath
    
    if (-not (Test-Path $fullPath)) {
        Write-Warn "Service path not found: $fullPath (may already be removed)"
        return $true
    }
    
    Write-Info "Removing $ServiceName..."
    
    Push-Location $fullPath
    try {
        $result = npx serverless remove --stage $Stage --region $Region 2>&1
        Write-Host $result
        
        Write-Success "$ServiceName removed"
        return $true
    }
    catch {
        Write-Warn "Error removing $ServiceName (may not exist): $_"
        return $true
    }
    finally {
        Pop-Location
    }
}

function Get-ServiceStatus {
    param(
        [string]$ServiceName,
        [string]$ServicePath,
        [string]$Stage,
        [string]$Region
    )
    
    $fullPath = Join-Path $ScriptDir $ServicePath
    
    if (-not (Test-Path $fullPath)) {
        Write-Warn "$ServiceName - Path not found"
        return
    }
    
    Push-Location $fullPath
    try {
        $result = npx serverless info --stage $Stage --region $Region 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "$ServiceName - Deployed"
            Write-Host $result
        } else {
            Write-Warn "$ServiceName - Not deployed"
        }
    }
    catch {
        Write-Warn "$ServiceName - Not deployed or error getting status"
    }
    finally {
        Pop-Location
    }
}

# Main execution
Write-Host "`n"
Write-Host "========================================" -ForegroundColor Blue
Write-Host "  1BT Resource Management Deployment" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host "Stage:  $Stage" -ForegroundColor White
Write-Host "Action: $Action" -ForegroundColor White
Write-Host "Region: $Region" -ForegroundColor White
if ($Service) {
    Write-Host "Service: $Service" -ForegroundColor White
}
Write-Host ""

Test-Prerequisites

# Determine which services to process
if ($Service) {
    $servicesToProcess = @{ $Service = $Services[$Service] }
} else {
    $servicesToProcess = $Services
}

# Execute action
switch ($Action) {
    "deploy" {
        Write-Step "Starting Deployment"
        
        $failed = @()
        foreach ($svc in $servicesToProcess.GetEnumerator()) {
            Write-Step "Deploying: $($svc.Key) - $($svc.Value.Description)"
            
            $success = Deploy-Service -ServiceName $svc.Key -ServicePath $svc.Value.Path -Stage $Stage -Region $Region
            
            if (-not $success) {
                $failed += $svc.Key
                Write-Err "Deployment stopped due to failure in $($svc.Key)"
                break
            }
        }
        
        Write-Host "`n"
        if ($failed.Count -eq 0) {
            Write-Success "All services deployed successfully!"
            
            # Get API endpoint
            try {
                $apiEndpoint = aws cloudformation describe-stacks `
                    --stack-name onebt-infrastructure-$Stage `
                    --query "Stacks[0].Outputs[?OutputKey=='HttpApiEndpoint'].OutputValue" `
                    --output text `
                    --region $Region 2>$null
                
                if ($apiEndpoint) {
                    Write-Host "`nAPI Endpoint: $apiEndpoint" -ForegroundColor Green
                }
            } catch {
                # Ignore errors getting endpoint
            }
        } else {
            Write-Err "Deployment failed. Failed services: $($failed -join ', ')"
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
        
        # Remove in reverse order (services first, then infrastructure)
        $reverseOrder = @($servicesToProcess.Keys)
        [Array]::Reverse($reverseOrder)
        
        foreach ($svcName in $reverseOrder) {
            $svc = $servicesToProcess[$svcName]
            Write-Step "Removing: $svcName"
            Remove-Service -ServiceName $svcName -ServicePath $svc.Path -Stage $Stage -Region $Region
        }
        
        Write-Success "Removal complete!"
    }
    
    "status" {
        Write-Step "Checking Deployment Status"
        
        foreach ($svc in $servicesToProcess.GetEnumerator()) {
            Get-ServiceStatus -ServiceName $svc.Key -ServicePath $svc.Value.Path -Stage $Stage -Region $Region
            Write-Host ""
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Blue
Write-Host "  Deployment Complete" -ForegroundColor Blue
Write-Host "========================================`n" -ForegroundColor Blue
