#!/usr/bin/env pwsh
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'qa', 'uat', 'prod')]
    [string]$Stage = 'dev'
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

function Write-Status {
    param([string]$Message, [string]$Color = 'White')
    Write-Host $Message -ForegroundColor $Color
}

function Get-CurrentLayerVersion {
    param([string]$LayerName)
    
    Write-Status "Getting current layer version..." "Cyan"
    
    $layerVersion = aws lambda list-layer-versions `
        --layer-name $LayerName `
        --region $region `
        --query 'LayerVersions[0].Version' `
        --output text
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to retrieve layer version"
    }
    
    return [int]$layerVersion
}

function Update-ServiceToDirectARN {
    param(
        [string]$ServicePath,
        [int]$LayerVersion,
        [string]$ServiceName
    )
    
    $serverlessYml = Join-Path $ServicePath "serverless.yml"
    
    if (-not (Test-Path $serverlessYml)) {
        Write-Status "  WARNING: serverless.yml not found in $ServiceName" "Yellow"
        return $false
    }
    
    $content = Get-Content $serverlessYml -Raw
    
    # Check if using ImportValue
    $importPattern = '- !ImportValue onebt-shared-layer-\$\{self:provider\.stage\}-arn'
    if ($content -match $importPattern) {
        $newArn = "    - arn:aws:lambda:$region`:$accountId`:layer:onebt-shared-libs-$Stage`:$LayerVersion"
        $content = $content -replace $importPattern, $newArn
        Set-Content -Path $serverlessYml -Value $content -NoNewline
        Write-Status "  SUCCESS: Converted $ServiceName from ImportValue to direct ARN" "Green"
        return $true
    }
    
    # Check if using OLD layer name (onebt-shared-layer) and convert to new name
    $oldLayerPattern = "arn:aws:lambda:$region`:$accountId`:layer:onebt-shared-layer-$Stage`:\d+"
    if ($content -match $oldLayerPattern) {
        $newArn = "arn:aws:lambda:$region`:$accountId`:layer:onebt-shared-libs-$Stage`:$LayerVersion"
        $content = $content -replace $oldLayerPattern, $newArn
        Set-Content -Path $serverlessYml -Value $content -NoNewline
        Write-Status "  SUCCESS: Converted $ServiceName from old layer (onebt-shared-layer) to new layer (onebt-shared-libs)" "Green"
        return $true
    }
    
    # Check if already using correct layer name (onebt-shared-libs)
    $newLayerPattern = "arn:aws:lambda:$region`:$accountId`:layer:onebt-shared-libs-$Stage`:\d+"
    if ($content -match $newLayerPattern) {
        Write-Status "  INFO: $ServiceName already using correct layer" "Gray"
        return $false
    }
    
    Write-Status "  WARNING: No layer reference found in $ServiceName" "Yellow"
    return $false
}

function Update-ServiceLayerVersion {
    param(
        [string]$ServicePath,
        [int]$LayerVersion,
        [string]$ServiceName
    )
    
    $serverlessYml = Join-Path $ServicePath "serverless.yml"
    
    if (-not (Test-Path $serverlessYml)) {
        return $false
    }
    
    $content = Get-Content $serverlessYml -Raw
    
    # Update direct ARN version (support both old and new layer names)
    $arnPattern = "arn:aws:lambda:$region`:$accountId`:layer:onebt-shared-(layer|libs)-$Stage`:\d+"
    if ($content -match $arnPattern) {
        $newArn = "arn:aws:lambda:$region`:$accountId`:layer:onebt-shared-libs-$Stage`:$LayerVersion"
        $content = $content -replace $arnPattern, $newArn
        Set-Content -Path $serverlessYml -Value $content -NoNewline
        Write-Status "  SUCCESS: Updated $ServiceName to version $LayerVersion" "Green"
        return $true
    }
    
    return $false
}

function Deploy-Service {
    param([string]$ServicePath, [string]$ServiceName)
    
    Write-Status "  Deploying $ServiceName..." "Cyan"
    Push-Location $ServicePath
    
    try {
        npx serverless deploy --stage $Stage | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Status "    SUCCESS: $ServiceName deployed" "Green"
            return $true
        } else {
            Write-Status "    ERROR: Failed to deploy $ServiceName" "Red"
            return $false
        }
    } catch {
        Write-Status "    ERROR: Exception during deployment - $_" "Red"
        return $false
    } finally {
        Pop-Location
    }
}

# Main execution
Write-Status "`n=========================================================" "Magenta"
Write-Status " SHARED LAYER DEPLOYMENT - STAGE: $Stage" "Magenta"
Write-Status "=========================================================`n" "Magenta"

# Get current layer version
$currentVersion = Get-CurrentLayerVersion -LayerName $layerName
Write-Status "Current layer version: $currentVersion`n" "Cyan"

# STEP 1: Convert all services from ImportValue to direct ARN (current version)
Write-Status "=========================================================" "Yellow"
Write-Status "STEP 1: Ensuring all services use direct ARN" "Yellow"
Write-Status "=========================================================`n" "Yellow"

$servicesToDeploy = @()
$alreadyConverted = @()

foreach ($service in $services) {
    $servicePath = Join-Path $servicesDir $service
    $updated = Update-ServiceToDirectARN -ServicePath $servicePath -LayerVersion $currentVersion -ServiceName $service
    
    if ($updated) {
        $servicesToDeploy += $service
    } else {
        # Check if it's using direct ARN (not a warning case)
        $serverlessYml = Join-Path $servicePath "serverless.yml"
        if ((Test-Path $serverlessYml) -and ((Get-Content $serverlessYml -Raw) -match "arn:aws:lambda:$region`:$accountId`:layer:onebt-shared-layer-$Stage")) {
            $alreadyConverted += $service
        }
    }
}

# Force deploy ALL services that use layer to update CloudFormation stacks
$allServicesWithLayer = $servicesToDeploy + $alreadyConverted
if ($allServicesWithLayer.Count -gt 0) {
    Write-Status "`nForce deploying $($allServicesWithLayer.Count) service(s) to update CloudFormation...`n" "Cyan"
    
    $deployCount = 0
    foreach ($service in $allServicesWithLayer) {
        $servicePath = Join-Path $servicesDir $service
        $success = Deploy-Service -ServicePath $servicePath -ServiceName $service
        if ($success) { $deployCount++ }
    }
    
    Write-Status "`nDeployed $deployCount service(s) successfully`n" "Green"
} else {
    Write-Status "`nNo services found with layer configuration`n" "Yellow"
}

# STEP 2: Deploy shared layer (now safe since no ImportValue dependencies)
Write-Status "=========================================================" "Yellow"
Write-Status "STEP 2: Deploying shared layer" "Yellow"
Write-Status "=========================================================`n" "Yellow"

Push-Location $sharedLayerDir
try {
    Write-Status "Deploying shared layer...`n" "Cyan"
    npx serverless deploy --stage $Stage | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Status "SUCCESS: Shared layer deployed`n" "Green"
        
        # Get new version
        $newVersion = Get-CurrentLayerVersion -LayerName $layerName
        Write-Status "New layer version: $newVersion`n" "Green"
    } else {
        Write-Status "ERROR: Failed to deploy shared layer" "Red"
        exit 1
    }
} catch {
    Write-Status "ERROR: Exception during shared layer deployment - $_" "Red"
    exit 1
} finally {
    Pop-Location
}

# STEP 3: Update all services to new layer version
Write-Status "=========================================================" "Yellow"
Write-Status "STEP 3: Updating services to new layer version" "Yellow"
Write-Status "=========================================================`n" "Yellow"

$updatedServices = @()

foreach ($service in $services) {
    $servicePath = Join-Path $servicesDir $service
    $updated = Update-ServiceLayerVersion -ServicePath $servicePath -LayerVersion $newVersion -ServiceName $service
    
    if ($updated) {
        $updatedServices += $service
    }
}

if ($updatedServices.Count -gt 0) {
    Write-Status "`nDeploying $($updatedServices.Count) service(s) with new layer...`n" "Cyan"
    
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
    Write-Status "`n=========================================================" "Magenta"
    Write-Status " DEPLOYMENT COMPLETE" "Magenta"
    Write-Status "=========================================================" "Magenta"
    Write-Status "Previous version: $currentVersion" "White"
    Write-Status "New version: $newVersion" "White"
    Write-Status "Services updated: $($updatedServices.Count)" "White"
    Write-Status "Successful: $successCount" "Green"
    if ($failCount -gt 0) {
        Write-Status "Failed: $failCount" "Red"
    }
    Write-Status "=========================================================`n" "Magenta"
    
    if ($failCount -gt 0) {
        Write-Status "WARNING: Some deployments failed" "Yellow"
        exit 1
    } else {
        Write-Status "SUCCESS: All services deployed successfully!" "Green"
    }
} else {
    Write-Status "`nNo services needed updating`n" "Yellow"
}
