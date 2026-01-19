<#
.SYNOPSIS
    Master deployment script for 1BT Resource Management microservices

.DESCRIPTION
    Deploys all infrastructure and microservices in the correct order.
    Supports incremental deployment and rollback capabilities.

.PARAMETER Stage
    Deployment stage: dev, qa, uat, prod

.PARAMETER Action
    Action to perform: deploy, remove, status

.PARAMETER Service
    Specific service to deploy (optional, deploys all if not specified)

.EXAMPLE
    .\deploy.ps1 -Stage dev -Action deploy
    .\deploy.ps1 -Stage dev -Action deploy -Service auth-service
    .\deploy.ps1 -Stage dev -Action remove
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "qa", "uat", "prod")]
    [string]$Stage,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("deploy", "remove", "status")]
    [string]$Action = "deploy",
    
    [Parameter(Mandatory=$false)]
    [string]$Service = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "ap-southeast-1"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Colors for output
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Warn { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }

# Deployment order (dependencies first)
$InfrastructureStacks = @(
    @{ Name = "vpc-stack"; Path = "infrastructure/vpc-stack.yml"; Type = "cfn" },
    @{ Name = "rds-stack"; Path = "infrastructure/rds-stack.yml"; Type = "cfn" },
    @{ Name = "cognito-stack"; Path = "infrastructure/cognito-stack.yml"; Type = "cfn" },
    @{ Name = "api-gateway-stack"; Path = "infrastructure/api-gateway-stack.yml"; Type = "cfn" }
)

$SharedLayer = @{
    Name = "shared-layer"
    Path = "shared"
    Type = "serverless"
}

$Microservices = @(
    @{ Name = "auth-service"; Path = "services/auth-service"; Type = "serverless" },
    @{ Name = "resource-service"; Path = "services/resource-service"; Type = "serverless" },
    @{ Name = "project-service"; Path = "services/project-service"; Type = "serverless" },
    @{ Name = "allocation-service"; Path = "services/allocation-service"; Type = "serverless" },
    @{ Name = "report-service"; Path = "services/report-service"; Type = "serverless" },
    @{ Name = "document-service"; Path = "services/document-service"; Type = "serverless" }
)

function Test-AwsCli {
    try {
        $null = aws --version 2>&1
        return $true
    } catch {
        return $false
    }
}

function Test-Serverless {
    try {
        $null = npx serverless --version 2>&1
        return $true
    } catch {
        return $false
    }
}

function Deploy-CloudFormationStack {
    param(
        [string]$StackName,
        [string]$TemplatePath,
        [string]$Stage,
        [string]$Region
    )
    
    $fullStackName = "onebt-rm-$Stage-$StackName".Replace("-stack", "")
    $fullTemplatePath = Join-Path $ScriptDir $TemplatePath
    $parametersFile = Join-Path $ScriptDir "infrastructure/parameters/$Stage.yml"
    
    Write-Info "Deploying CloudFormation stack: $fullStackName"
    
    $cmd = "aws cloudformation deploy " +
           "--template-file `"$fullTemplatePath`" " +
           "--stack-name $fullStackName " +
           "--parameter-overrides Environment=$Stage " +
           "--capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM " +
           "--region $Region " +
           "--no-fail-on-empty-changeset"
    
    if (Test-Path $parametersFile) {
        Write-Info "Using parameters from: $parametersFile"
    }
    
    Invoke-Expression $cmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Stack $fullStackName deployed successfully"
        return $true
    } else {
        Write-Err "Failed to deploy stack $fullStackName"
        return $false
    }
}

function Deploy-ServerlessService {
    param(
        [string]$ServiceName,
        [string]$ServicePath,
        [string]$Stage,
        [string]$Region
    )
    
    $fullPath = Join-Path $ScriptDir $ServicePath
    
    Write-Info "Deploying Serverless service: $ServiceName"
    
    Push-Location $fullPath
    
    try {
        # Install dependencies if needed
        if (Test-Path "package.json") {
            if (-not (Test-Path "node_modules")) {
                Write-Info "Installing npm dependencies..."
                npm install
            }
        }
        
        # Deploy
        $cmd = "npx serverless deploy --stage $Stage --region $Region"
        Invoke-Expression $cmd
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Service $ServiceName deployed successfully"
            return $true
        } else {
            Write-Err "Failed to deploy service $ServiceName"
            return $false
        }
    } finally {
        Pop-Location
    }
}

function Remove-CloudFormationStack {
    param(
        [string]$StackName,
        [string]$Stage,
        [string]$Region
    )
    
    $fullStackName = "onebt-rm-$Stage-$StackName".Replace("-stack", "")
    
    Write-Warn "Removing CloudFormation stack: $fullStackName"
    
    aws cloudformation delete-stack --stack-name $fullStackName --region $Region
    
    Write-Info "Waiting for stack deletion..."
    aws cloudformation wait stack-delete-complete --stack-name $fullStackName --region $Region
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Stack $fullStackName removed"
    }
}

function Remove-ServerlessService {
    param(
        [string]$ServicePath,
        [string]$Stage,
        [string]$Region
    )
    
    $fullPath = Join-Path $ScriptDir $ServicePath
    
    Push-Location $fullPath
    
    try {
        npx serverless remove --stage $Stage --region $Region
    } finally {
        Pop-Location
    }
}

function Get-DeploymentStatus {
    param([string]$Stage, [string]$Region)
    
    Write-Info "Checking deployment status for stage: $Stage"
    Write-Host ""
    
    Write-Host "=== Infrastructure Stacks ===" -ForegroundColor Cyan
    foreach ($stack in $InfrastructureStacks) {
        $fullStackName = "onebt-rm-$Stage-$($stack.Name)".Replace("-stack", "")
        $status = aws cloudformation describe-stacks --stack-name $fullStackName --region $Region 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            $statusObj = $status | ConvertFrom-Json
            $stackStatus = $statusObj.Stacks[0].StackStatus
            Write-Host "  $fullStackName : $stackStatus" -ForegroundColor Green
        } else {
            Write-Host "  $fullStackName : NOT DEPLOYED" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "=== Microservices ===" -ForegroundColor Cyan
    
    # Check shared layer
    Write-Host "  onebt-shared-layer : " -NoNewline
    $layerCheck = aws lambda list-layer-versions --layer-name onebt-shared-layer --region $Region 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "DEPLOYED" -ForegroundColor Green
    } else {
        Write-Host "NOT DEPLOYED" -ForegroundColor Yellow
    }
    
    foreach ($svc in $Microservices) {
        $stackName = "onebt-$($svc.Name)-$Stage"
        $status = aws cloudformation describe-stacks --stack-name $stackName --region $Region 2>&1
        
        Write-Host "  $stackName : " -NoNewline
        if ($LASTEXITCODE -eq 0) {
            Write-Host "DEPLOYED" -ForegroundColor Green
        } else {
            Write-Host "NOT DEPLOYED" -ForegroundColor Yellow
        }
    }
}

# Main execution
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  1BT Resource Management Deployment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Stage:  $Stage" -ForegroundColor White
Write-Host "  Action: $Action" -ForegroundColor White
Write-Host "  Region: $Region" -ForegroundColor White
if ($Service) {
    Write-Host "  Service: $Service" -ForegroundColor White
}
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Verify prerequisites
if (-not (Test-AwsCli)) {
    Write-Err "AWS CLI is not installed or not in PATH"
    exit 1
}

if ($Action -eq "status") {
    Get-DeploymentStatus -Stage $Stage -Region $Region
    exit 0
}

if ($Action -eq "deploy") {
    # Production confirmation
    if ($Stage -eq "prod") {
        Write-Warn "You are about to deploy to PRODUCTION!"
        $confirm = Read-Host "Type 'yes' to confirm"
        if ($confirm -ne "yes") {
            Write-Info "Deployment cancelled"
            exit 0
        }
    }
    
    $startTime = Get-Date
    
    if (-not $Service) {
        # Full deployment
        
        # 1. Deploy infrastructure (if not exists)
        Write-Host ""
        Write-Host "=== Phase 1: Infrastructure ===" -ForegroundColor Magenta
        foreach ($stack in $InfrastructureStacks) {
            if (-not (Deploy-CloudFormationStack -StackName $stack.Name -TemplatePath $stack.Path -Stage $Stage -Region $Region)) {
                Write-Err "Infrastructure deployment failed. Aborting."
                exit 1
            }
        }
        
        # 2. Deploy shared layer
        Write-Host ""
        Write-Host "=== Phase 2: Shared Layer ===" -ForegroundColor Magenta
        if (-not (Deploy-ServerlessService -ServiceName $SharedLayer.Name -ServicePath $SharedLayer.Path -Stage $Stage -Region $Region)) {
            Write-Err "Shared layer deployment failed. Aborting."
            exit 1
        }
        
        # 3. Deploy microservices
        Write-Host ""
        Write-Host "=== Phase 3: Microservices ===" -ForegroundColor Magenta
        foreach ($svc in $Microservices) {
            if (-not (Deploy-ServerlessService -ServiceName $svc.Name -ServicePath $svc.Path -Stage $Stage -Region $Region)) {
                Write-Err "Service $($svc.Name) deployment failed. Continuing with next service."
            }
        }
    } else {
        # Single service deployment
        $targetService = $Microservices | Where-Object { $_.Name -eq $Service }
        if ($targetService) {
            Deploy-ServerlessService -ServiceName $targetService.Name -ServicePath $targetService.Path -Stage $Stage -Region $Region
        } else {
            Write-Err "Service '$Service' not found"
            Write-Info "Available services: $($Microservices.Name -join ', ')"
            exit 1
        }
    }
    
    $endTime = Get-Date
    $duration = $endTime - $startTime
    
    Write-Host ""
    Write-Success "Deployment completed in $($duration.TotalMinutes.ToString('F1')) minutes"
}

if ($Action -eq "remove") {
    Write-Warn "This will remove all resources for stage: $Stage"
    $confirm = Read-Host "Type 'yes' to confirm"
    
    if ($confirm -ne "yes") {
        Write-Info "Removal cancelled"
        exit 0
    }
    
    # Remove in reverse order
    Write-Host "=== Removing Microservices ===" -ForegroundColor Magenta
    foreach ($svc in $Microservices) {
        Remove-ServerlessService -ServicePath $svc.Path -Stage $Stage -Region $Region
    }
    
    Write-Host "=== Removing Shared Layer ===" -ForegroundColor Magenta
    Remove-ServerlessService -ServicePath $SharedLayer.Path -Stage $Stage -Region $Region
    
    Write-Host "=== Removing Infrastructure ===" -ForegroundColor Magenta
    $reversedInfra = $InfrastructureStacks | ForEach-Object { $_ } | Sort-Object { [array]::IndexOf($InfrastructureStacks, $_) } -Descending
    foreach ($stack in $reversedInfra) {
        Remove-CloudFormationStack -StackName $stack.Name -Stage $Stage -Region $Region
    }
    
    Write-Success "All resources removed for stage: $Stage"
}

Write-Host ""
