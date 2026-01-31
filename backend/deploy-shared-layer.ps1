#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploys shared Lambda layer and updates all services to use the new version.

.DESCRIPTION
    This script automates the complete workflow for updating the shared Lambda layer:
    1. Deploys the shared layer to create a new version
    2. Retrieves the new layer version number
    3. Updates all service serverless.yml files with the new layer version
    4. Redeploys all services with the updated layer

.PARAMETER Stage
    The deployment stage (dev, qa, uat, prod). Default: dev

.PARAMETER ServicesOnly
    If specified, only redeploys services without updating the shared layer

.PARAMETER SkipServiceDeploy
    If specified, only deploys the shared layer without redeploying services

.EXAMPLE
    .\deploy-shared-layer.ps1
    .\deploy-shared-layer.ps1 -Stage qa
    .\deploy-shared-layer.ps1 -ServicesOnly
    .\deploy-shared-layer.ps1 -SkipServiceDeploy
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'qa', 'uat', 'prod')]
    [string]$Stage = 'dev',
    
    [Parameter(Mandatory=$false)]
    [switch]$ServicesOnly,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipServiceDeploy
)

$ErrorActionPreference = 'Stop'
$scriptDir = $PSScriptRoot
$sharedLayerDir = Join-Path $scriptDir "shared"
$servicesDir = Join-Path $scriptDir "services"

# AWS Configuration
$region = 'ap-southeast-1'
$accountId = '550586832874'
$layerName = "onebt-shared-libs-$Stage"

# List of services to update
$services = @(
    'migration-service',
    'resource-service',
    'allocation-service',
    'report-service',
    'project-service',
    'auth-service',
    'audit-service',
    'configuration-service'
)

function Write-ColorOutput {
    param([string]$Message, [string]$Color = 'White')
    Write-Host $Message -ForegroundColor $Color
}

function Get-LatestLayerVersion {
    param([string]$LayerName)
    
    Write-ColorOutput "🔍 Retrieving latest layer version for $LayerName..." "Cyan"
    
    $layerVersions = aws lambda list-layer-versions `
        --layer-name $LayerName `
        --region $region `
        --query 'LayerVersions[0].Version' `
        --output text
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to retrieve layer version"
    }
    
    return [int]$layerVersions
}

function Update-ServiceLayerVersion {
    param(
        [string]$ServicePath,
        [int]$LayerVersion,
        [string]$ServiceName
    )
    
    $serverlessYml = Join-Path $ServicePath "serverless.yml"
    
    if (-not (Test-Path $serverlessYml)) {
        Write-ColorOutput "⚠️  Serverless.yml not found in $ServiceName, skipping..." "Yellow"
        return $false
    }
    
    $content = Get-Content $serverlessYml -Raw
    
    # Pattern to match the layer ARN with version
    $pattern = "arn:aws:lambda:\`${self:provider\.region}:$accountId`:layer:onebt-shared-libs-\`${self:provider\.stage}:\d+"
    $replacement = "arn:aws:lambda:`${self:provider.region}:$accountId`:layer:onebt-shared-libs-`${self:provider.stage}:$LayerVersion"
    
    if ($content -match $pattern) {
        $newContent = $content -replace $pattern, $replacement
        Set-Content -Path $serverlessYml -Value $newContent -NoNewline
        Write-ColorOutput "  ✓ Updated $ServiceName to layer version $LayerVersion" "Green"
        return $true
    } else {
        Write-ColorOutput "  ⚠️  No layer reference found in $ServiceName" "Yellow"
        return $false
    }
}

function Deploy-Service {
    param([string]$ServicePath, [string]$ServiceName)
    
    Write-ColorOutput "📦 Deploying $ServiceName..." "Cyan"
    Push-Location $ServicePath
    
    try {
        $output = npx serverless deploy --stage $Stage 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            $deployTime = ($output | Select-String "Service deployed to stack.*\((\d+)s\)" | ForEach-Object { $_.Matches.Groups[1].Value })
            Write-ColorOutput "  ✓ $ServiceName deployed successfully ($deployTime`s)" "Green"
            return $true
        } else {
            Write-ColorOutput "  ✗ Failed to deploy $ServiceName" "Red"
            Write-ColorOutput $output "Red"
            return $false
        }
    } finally {
        Pop-Location
    }
}

# Main execution
Write-ColorOutput "`n🚀 Starting shared layer deployment process for stage: $Stage`n" "Magenta"

$newLayerVersion = $null

# Step 1: Deploy shared layer (unless ServicesOnly flag is set)
if (-not $ServicesOnly) {
    Write-ColorOutput "═══════════════════════════════════════════════════════" "Gray"
    Write-ColorOutput "STEP 1: Deploying Shared Lambda Layer" "Yellow"
    Write-ColorOutput "═══════════════════════════════════════════════════════`n" "Gray"
    
    Push-Location $sharedLayerDir
    try {
        Write-ColorOutput "📦 Deploying shared layer..." "Cyan"
        $deployOutput = npx serverless deploy --stage $Stage 2>&1 | Out-String
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✓ Shared layer deployed successfully`n" "Green"
            
            # Get the new layer version
            $newLayerVersion = Get-LatestLayerVersion -LayerName $layerName
            Write-ColorOutput "✓ New layer version: $newLayerVersion`n" "Green"
        } else {
            Write-ColorOutput "✗ Failed to deploy shared layer" "Red"
            Write-ColorOutput $deployOutput "Red"
            exit 1
        }
    } finally {
        Pop-Location
    }
} else {
    # If ServicesOnly, just get the current layer version
    $newLayerVersion = Get-LatestLayerVersion -LayerName $layerName
    Write-ColorOutput "Using existing layer version: $newLayerVersion`n" "Cyan"
}

# Step 2: Update all service configurations (unless SkipServiceDeploy flag is set)
if (-not $SkipServiceDeploy) {
    Write-ColorOutput "═══════════════════════════════════════════════════════" "Gray"
    Write-ColorOutput "STEP 2: Updating Service Configurations" "Yellow"
    Write-ColorOutput "═══════════════════════════════════════════════════════`n" "Gray"
    
    $updatedServices = @()
    
    foreach ($service in $services) {
        $servicePath = Join-Path $servicesDir $service
        $updated = Update-ServiceLayerVersion -ServicePath $servicePath -LayerVersion $newLayerVersion -ServiceName $service
        
        if ($updated) {
            $updatedServices += $service
        }
    }
    
    Write-ColorOutput "`n✓ Updated $($updatedServices.Count) service(s)`n" "Green"
    
    # Step 3: Deploy all updated services
    Write-ColorOutput "═══════════════════════════════════════════════════════" "Gray"
    Write-ColorOutput "STEP 3: Deploying Services" "Yellow"
    Write-ColorOutput "═══════════════════════════════════════════════════════`n" "Gray"
    
    $successCount = 0
    $failCount = 0
    
    foreach ($service in $updatedServices) {
        $servicePath = Join-Path $servicesDir $service
        $success = Deploy-Service -ServicePath $servicePath -ServiceName $service
        
        if ($success) {
            $successCount++
        } else {
            $failCount++
        }
    }
    
    # Summary
    Write-ColorOutput "`n═══════════════════════════════════════════════════════" "Gray"
    Write-ColorOutput "DEPLOYMENT SUMMARY" "Yellow"
    Write-ColorOutput "═══════════════════════════════════════════════════════" "Gray"
    Write-ColorOutput "Stage: $Stage" "White"
    Write-ColorOutput "Layer Version: $newLayerVersion" "White"
    Write-ColorOutput "Services Updated: $($updatedServices.Count)" "White"
    Write-ColorOutput "Successful Deployments: $successCount" "Green"
    if ($failCount -gt 0) {
        Write-ColorOutput "Failed Deployments: $failCount" "Red"
    }
    Write-ColorOutput "═══════════════════════════════════════════════════════`n" "Gray"
    
    if ($failCount -gt 0) {
        Write-ColorOutput "⚠️  Some deployments failed. Please check the logs above." "Yellow"
        exit 1
    } else {
        Write-ColorOutput "🎉 All services deployed successfully!" "Green"
    }
} else {
    Write-ColorOutput "✓ Skipping service deployment (SkipServiceDeploy flag set)`n" "Yellow"
    Write-ColorOutput "Layer version $newLayerVersion is ready to use." "Green"
}
