# Build and Publish Layer Script
# Builds the shared layer and publishes to AWS Lambda
# Usage: .\publish-layer.ps1 [-Stage dev] [-Runtime nodejs22.x]

param(
    [string]$Stage = "dev",
    [string]$Runtime = "nodejs22.x"
)

$ErrorActionPreference = "Stop"

function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Info { param($msg) Write-Host $msg -ForegroundColor Cyan }
function Write-Err { param($msg) Write-Host $msg -ForegroundColor Red }

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$LayersDir = Join-Path $ScriptDir "shared\layers"
$BuildDir = Join-Path $LayersDir "build"
$NodejsDir = Join-Path $LayersDir "nodejs"

Write-Info "============================================"
Write-Info "  Build and Publish Lambda Layer"
Write-Info "============================================"
Write-Info "Stage: $Stage"
Write-Info "Runtime: $Runtime"
Write-Info "============================================"
Write-Host ""

# Step 1: Install dependencies
Write-Info "Installing dependencies..."
Push-Location $NodejsDir
npm install 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Err "Failed to install dependencies"
    Pop-Location
    exit 1
}
Pop-Location
Write-Success "✓ Dependencies installed"

# Step 2: Clean and create build directory
Write-Info "Building layer..."
if (Test-Path $BuildDir) {
    Remove-Item -Recurse -Force $BuildDir
}
New-Item -ItemType Directory -Path $BuildDir | Out-Null

# Step 3: Copy nodejs folder to build
Copy-Item -Recurse $NodejsDir (Join-Path $BuildDir "nodejs")

# Step 4: Create zip
$ZipPath = Join-Path $BuildDir "layer.zip"
Compress-Archive -Path (Join-Path $BuildDir "nodejs") -DestinationPath $ZipPath -Force
Write-Success "✓ Layer built"

# Step 5: Publish to AWS
Write-Info "Publishing to AWS Lambda..."
$LayerName = "onebt-shared-libs-$Stage"
$Region = "ap-southeast-1"

$result = aws lambda publish-layer-version `
    --layer-name $LayerName `
    --zip-file "fileb://$ZipPath" `
    --compatible-runtimes $Runtime `
    --region $Region `
    --query 'Version' `
    --output text

if ($LASTEXITCODE -ne 0) {
    Write-Err "Failed to publish layer"
    exit 1
}

Write-Success "✓ Layer published successfully"
Write-Host ""
Write-Info "============================================"
Write-Success "  Layer Version: $result"
Write-Info "============================================"
Write-Host ""
Write-Info "To update all services, run:"
Write-Host "  .\update-layer.ps1 -Version $result -Deploy" -ForegroundColor Yellow
